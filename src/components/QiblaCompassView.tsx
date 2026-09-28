import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Compass,
  Navigation,
  Maximize2,
  Volume2,
  VolumeX,
  Smartphone,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Sliders,
  X,
  MapPin,
  Hand,
} from 'lucide-react';
import {
  calculateKaabaDistance,
  getCompassHeading,
  calculateTiltAndLevel,
  evaluateQiblaAlignment,
  playQiblaAlignedChime,
  toBanglaNumber,
  TiltState,
} from '../utils/qiblaCompass';
import { CityLocation, AppLanguage } from '../types';

interface QiblaCompassViewProps {
  currentCity: CityLocation;
  qiblaAngle: number;
  isExpandedModal?: boolean;
  onCloseModal?: () => void;
  onOpenModal?: () => void;
  language?: AppLanguage;
}

export const QiblaCompassView: React.FC<QiblaCompassViewProps> = ({
  currentCity,
  qiblaAngle,
  isExpandedModal = false,
  onCloseModal,
  onOpenModal,
  language = 'bn',
}) => {
  const isBangla = language === 'bn';

  const formatNumber = (num: number | string): string => {
    return isBangla ? toBanglaNumber(num) : num.toString();
  };

  // Sensor State
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasSensorSupport, setHasSensorSupport] = useState<boolean | null>(null);
  const [isPermissionRequired, setIsPermissionRequired] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [permissionErrorMsg, setPermissionErrorMsg] = useState<string | null>(null);
  const [sensorActive, setSensorActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showCalibrationHelp, setShowCalibrationHelp] = useState<boolean>(false);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  // Accelerometer / Tilt State
  const [tiltState, setTiltState] = useState<TiltState>({
    pitch: 0,
    roll: 0,
    tiltAngle: 0,
    isLevel: true,
    bubbleX: 0,
    bubbleY: 0,
  });

  const lastOrientationEvent = useRef<DeviceOrientationEvent | null>(null);
  const lastMotionEvent = useRef<DeviceMotionEvent | null>(null);
  const sensorTimeoutRef = useRef<number | null>(null);
  const isAlignedPrevRef = useRef<boolean>(false);
  const dialRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartAngleRef = useRef<number>(0);
  const headingAtStartRef = useRef<number>(0);

  // Kaaba distance from current city coordinates
  const kaabaDistanceKm = useMemo(() => {
    return calculateKaabaDistance(currentCity.lat, currentCity.lng);
  }, [currentCity.lat, currentCity.lng]);

  // Current active heading (either from hardware sensors or manual test mode)
  const currentHeading = isManualMode ? manualHeading : deviceHeading;

  // Qibla alignment evaluation
  const alignment = useMemo(() => {
    return evaluateQiblaAlignment(currentHeading, qiblaAngle, 4);
  }, [currentHeading, qiblaAngle]);

  // Sound and vibration effect on locking onto Qibla
  useEffect(() => {
    if (alignment.isAligned && !isAlignedPrevRef.current && soundEnabled) {
      playQiblaAlignedChime();
    }
    isAlignedPrevRef.current = alignment.isAligned;
  }, [alignment.isAligned, soundEnabled]);

  // Request iOS 13+ sensor permissions safely without window.alert
  const requestIOSPermissions = useCallback(async () => {
    try {
      const OrientationEvent = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };

      if (typeof OrientationEvent?.requestPermission === 'function') {
        const response = await OrientationEvent.requestPermission();
        if (response === 'granted') {
          setPermissionGranted(true);
          setIsPermissionRequired(false);
          setPermissionErrorMsg(null);
          setSensorActive(true);
        } else {
          setPermissionErrorMsg(
            isBangla
              ? 'মোশন পারমিশন অনুমোদিত হয়নি। ড্র্যাগ করে ম্যানুয়ালি কম্পাস ব্যবহার করতে পারেন।'
              : 'Sensor permission not granted. You can drag the compass manually.'
          );
        }
      }

      const MotionEvent = window.DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };
      if (typeof MotionEvent?.requestPermission === 'function') {
        await MotionEvent.requestPermission();
      }
    } catch (err) {
      console.warn('Error requesting device orientation permission:', err);
    }
  }, [isBangla]);

  // Set up listeners for Magnetometer & Accelerometer
  const setupSensors = useCallback(() => {
    // Check for iOS permission requirement first
    const OrientationEvent = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof OrientationEvent?.requestPermission === 'function' && !permissionGranted) {
      setIsPermissionRequired(true);
    }

    let receivedEvent = false;

    // 1. Orientation / Magnetometer Listener
    const handleOrientation = (event: DeviceOrientationEvent) => {
      lastOrientationEvent.current = event;
      const screenAngle =
        typeof window.orientation === 'number'
          ? (window.orientation as number)
          : window.screen?.orientation?.angle || 0;

      const comp = getCompassHeading(event, screenAngle);

      if (comp !== null && !isNaN(comp.heading)) {
        receivedEvent = true;
        setSensorActive(true);
        setHasSensorSupport(true);

        // Smooth shortest-arc rotation to avoid jitter
        setDeviceHeading((prev) => {
          if (!prev) return comp.heading;
          const diff = (comp.heading - prev + 540) % 360 - 180;
          return Math.round(((prev + diff * 0.35 + 360) % 360) * 10) / 10;
        });

        // Update tilt using orientation's beta/gamma
        setTiltState(calculateTiltAndLevel(lastMotionEvent.current, event));
      }
    };

    // 2. Accelerometer Listener (DeviceMotionEvent)
    const handleMotion = (event: DeviceMotionEvent) => {
      lastMotionEvent.current = event;
      if (event.accelerationIncludingGravity) {
        setTiltState(calculateTiltAndLevel(event, lastOrientationEvent.current));
      }
    };

    // Register all standard orientation listeners simultaneously
    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
    window.addEventListener('devicemotion', handleMotion as EventListener, true);

    // If no sensor events fire within 1500ms (e.g. desktop laptops, PCs)
    sensorTimeoutRef.current = window.setTimeout(() => {
      if (!receivedEvent) {
        setHasSensorSupport(false);
      }
    }, 1500);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
      window.removeEventListener('devicemotion', handleMotion as EventListener, true);
      if (sensorTimeoutRef.current) {
        clearTimeout(sensorTimeoutRef.current);
      }
    };
  }, [permissionGranted]);

  useEffect(() => {
    const cleanup = setupSensors();
    return () => {
      if (cleanup) cleanup();
    };
  }, [setupSensors]);

  // Interactive Touch & Mouse Drag to Rotate Dial
  const getPointerAngle = (clientX: number, clientY: number) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rad = Math.atan2(clientY - centerY, clientX - centerX);
    return (rad * 180) / Math.PI;
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    dragStartAngleRef.current = getPointerAngle(clientX, clientY);
    headingAtStartRef.current = isManualMode ? manualHeading : deviceHeading;
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const currentAngle = getPointerAngle(clientX, clientY);
    const angleDiff = currentAngle - dragStartAngleRef.current;
    // Rotate heading with finger movement
    let newHeading = (headingAtStartRef.current - angleDiff + 360) % 360;
    newHeading = Math.round(newHeading);
    setIsManualMode(true);
    setManualHeading(newHeading);
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
  };

  const handleResetToLiveSensor = () => {
    setIsManualMode(false);
    setupSensors();
  };

  // Cardinal point name generator
  const getCardinalLabel = (deg: number) => {
    const normalized = (deg + 360) % 360;
    if (normalized >= 337.5 || normalized < 22.5) return isBangla ? 'উত্তর (N)' : 'North (N)';
    if (normalized >= 22.5 && normalized < 67.5) return isBangla ? 'উত্তর-পূর্ব (NE)' : 'North-East (NE)';
    if (normalized >= 67.5 && normalized < 112.5) return isBangla ? 'পূর্ব (E)' : 'East (E)';
    if (normalized >= 112.5 && normalized < 157.5) return isBangla ? 'দক্ষিণ-পূর্ব (SE)' : 'South-East (SE)';
    if (normalized >= 157.5 && normalized < 202.5) return isBangla ? 'দক্ষিণ (S)' : 'South (S)';
    if (normalized >= 202.5 && normalized < 247.5) return isBangla ? 'দক্ষিণ-পশ্চিম (SW)' : 'South-West (SW)';
    if (normalized >= 247.5 && normalized < 292.5) return isBangla ? 'পশ্চিম (W)' : 'West (W)';
    return isBangla ? 'উত্তর-পশ্চিম (NW)' : 'North-West (NW)';
  };

  return (
    <div
      id="live-qibla-compass-container"
      className={`relative flex flex-col transition-all duration-300 ${
        isExpandedModal
          ? 'w-full max-w-xl mx-auto bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-700/60 max-h-[92vh] overflow-y-auto'
          : 'w-full bg-white text-slate-900 rounded-3xl p-5 border border-slate-200 shadow-xs'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm md:text-base text-slate-900">
                {isBangla ? 'লাইভ কিবলা কম্পাস' : 'Live Qibla Compass'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                sensorActive && !isManualMode
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {sensorActive && !isManualMode
                  ? (isBangla ? 'ম্যাগনেটোমিটার সক্রিয়' : 'Live Sensor Active')
                  : (isBangla ? 'ম্যানুয়াল / ড্র্যাগ মোড' : 'Interactive / Drag Mode')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin className="w-3 h-3 text-amber-500" />
              <span>{isBangla ? currentCity.nameBangla : currentCity.nameEnglish}</span>
              <span>•</span>
              <span className="font-medium text-emerald-700">
                {isBangla ? "পবিত্র কা'বা:" : "Holy Ka'aba:"} {formatNumber(qiblaAngle)}°
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1">
          {/* Sound Toggle */}
          <button
            id="btn-qibla-sound-toggle"
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs transition border cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
            title={
              soundEnabled
                ? (isBangla ? 'কিবলা লক সাউন্ড চালু' : 'Qibla Lock sound ON')
                : (isBangla ? 'কিবলা লক সাউন্ড বন্ধ' : 'Qibla Lock sound OFF')
            }
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Calibration Help */}
          <button
            id="btn-qibla-help"
            type="button"
            onClick={() => setShowCalibrationHelp(!showCalibrationHelp)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 border border-transparent transition cursor-pointer"
            title={isBangla ? 'সেন্সর ক্যালিব্রেশন নির্দেশিকা' : 'Sensor Calibration Guide'}
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Modal Close or Expand Button */}
          {isExpandedModal ? (
            <button
              id="btn-qibla-close-modal"
              type="button"
              onClick={onCloseModal}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              title={isBangla ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            onOpenModal && (
              <button
                id="btn-qibla-open-modal"
                type="button"
                onClick={onOpenModal}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                title={isBangla ? 'ফুলস্ক্রিন লাইভ মোড' : 'Fullscreen Live Mode'}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>

      {/* iOS Permission Request Banner if needed */}
      {isPermissionRequired && (
        <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {isBangla
                ? 'আইফোন/আইপ্যাডে কম্পাসের ম্যাগনেটোমিটার সেন্সর চালুর অনুমতি দিন'
                : 'Allow magnetometer & orientation sensor access for compass'}
            </span>
          </div>
          <button
            id="btn-request-ios-compass"
            type="button"
            onClick={requestIOSPermissions}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shrink-0 shadow-xs cursor-pointer"
          >
            {isBangla ? 'সেন্সর চালু করুন' : 'Enable Sensor'}
          </button>
        </div>
      )}

      {/* Permission Error Message Banner */}
      {permissionErrorMsg && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{permissionErrorMsg}</span>
          <button
            type="button"
            onClick={() => setPermissionErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sensor Calibration Guide Modal / Collapsible */}
      {showCalibrationHelp && (
        <div className="mb-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              {isBangla ? 'কম্পাস নির্ভুল করার নির্দেশিকা:' : 'Compass Accuracy Guide:'}
            </span>
            <button
              type="button"
              onClick={() => setShowCalibrationHelp(false)}
              className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
          <ul className="list-disc pl-4 space-y-1 leading-relaxed">
            <li>
              <strong>{isBangla ? 'সমতল রাখুন:' : 'Keep Flat:'}</strong>{' '}
              {isBangla
                ? 'ফোনটি হাতের তালু বা জায়নামাজের উপর সম্পূর্ণ সমতল (Flat) রাখুন। নিচে বাবল লেভেল সবুজ রঙে সমতল অবস্থান দেখাবে।'
                : 'Hold the phone flat on your palm or prayer mat. The center bubble level will turn green when level.'}
            </li>
            <li>
              <strong>{isBangla ? 'চৌম্বকীয় প্রভাব এড়ান:' : 'Avoid Interference:'}</strong>{' '}
              {isBangla
                ? 'ল্যাপটপ, স্পিকার, ধাতব বস্তু বা চুম্বকীয় কভার থেকে ফোনটি কয়েক হাত দূরে রাখুন।'
                : 'Keep away from laptops, metallic objects, magnetic phone cases, and electronic speakers.'}
            </li>
            <li>
              <strong>{isBangla ? 'ক্যালিব্রেশন:' : 'Calibration:'}</strong>{' '}
              {isBangla
                ? "কম্পাস ভুল দেখালে ফোনটিকে বাতাসে ইংরেজি '8' (Figure-8) আকারে ২-৩ বার ঘোরান। এতে ফোনের ম্যাগনেটোমিটার সেন্সর স্বয়ংক্রিয়ভাবে রিক্যালিব্রেট হবে।"
                : "If the compass seems off, wave your phone gently in a figure-8 motion in the air 2-3 times to recalibrate the hardware magnetometer."}
            </li>
          </ul>
        </div>
      )}

      {/* Main Compass Dial & Target Area */}
      <div className="relative py-4 flex flex-col items-center justify-center select-none">
        {/* Alignment Halo Glow when facing Qibla */}
        <div
          className={`absolute w-72 h-72 md:w-80 md:h-80 rounded-full transition-all duration-700 pointer-events-none ${
            alignment.isAligned
              ? 'bg-emerald-500/20 ring-8 ring-emerald-500/40 animate-pulse'
              : 'opacity-0'
          }`}
        />

        {/* 360-degree Compass Housing */}
        <div
          ref={dialRef}
          onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={(e) => {
            if (e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={handleDragEnd}
          className={`relative w-64 h-64 md:w-72 md:h-72 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-xl cursor-grab active:cursor-grabbing ${
            alignment.isAligned
              ? 'border-emerald-500 bg-emerald-50/30 shadow-emerald-500/30 ring-4 ring-emerald-400/40'
              : 'border-slate-200 bg-slate-50'
          }`}
          title={isBangla ? 'হাত দিয়ে ঘুরিয়ে কিবলা নির্ধারণ করতে পারেন' : 'Drag or rotate with finger/mouse'}
        >
          {/* Static Top Direction Marker (Phone orientation forward axis) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
            <div
              className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] ${
                alignment.isAligned ? 'border-b-emerald-600' : 'border-b-rose-600'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full mt-0.5 ${
                alignment.isAligned ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            />
          </div>

          {/* Rotating Compass Dial (Rotates opposite to device heading: transform -deviceHeading) */}
          <div
            className="absolute inset-2 rounded-full transition-transform ease-out duration-150 flex items-center justify-center select-none pointer-events-none"
            style={{ transform: `rotate(${-currentHeading}deg)` }}
          >
            {/* Cardinal Markers */}
            <span className="absolute top-2 text-[11px] font-extrabold text-rose-600 tracking-wider">
              {isBangla ? 'উত্তর (N)' : 'N (North)'}
            </span>
            <span className="absolute right-2 text-[11px] font-bold text-slate-500">
              {isBangla ? 'পূর্ব (E)' : 'E (East)'}
            </span>
            <span className="absolute bottom-2 text-[11px] font-bold text-slate-500">
              {isBangla ? 'দক্ষিণ (S)' : 'S (South)'}
            </span>
            <span className="absolute left-2 text-[11px] font-bold text-slate-500">
              {isBangla ? 'পশ্চিম (W)' : 'W (West)'}
            </span>

            {/* Subtle 30-degree tick marks */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <div
                key={deg}
                className="absolute inset-0 flex justify-center pointer-events-none"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                <div
                  className={`w-0.5 ${
                    deg % 90 === 0
                      ? 'h-3 bg-slate-400'
                      : 'h-1.5 bg-slate-300'
                  }`}
                />
              </div>
            ))}

            {/* Qibla Marker (Holy Kaaba at qiblaAngle degrees from True North) */}
            <div
              className="absolute inset-0 flex justify-center pointer-events-none"
              style={{ transform: `rotate(${qiblaAngle}deg)` }}
            >
              <div className="absolute top-2.5 flex flex-col items-center">
                {/* Kaaba Icon / Golden Pointer */}
                <div
                  className={`relative p-1.5 rounded-lg transition-all duration-300 ${
                    alignment.isAligned
                      ? 'bg-amber-500 text-slate-950 scale-125 shadow-lg shadow-amber-500/50 ring-2 ring-emerald-500'
                      : 'bg-emerald-800 text-amber-300'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center font-bold text-[10px] rounded bg-slate-950 text-amber-400 border border-amber-300/80">
                    🕋
                  </div>
                </div>
                <div
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 shadow-xs border ${
                    alignment.isAligned
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-amber-900 text-amber-200 border-amber-600/50'
                  }`}
                >
                  {isBangla ? `কা'বা ${toBanglaNumber(qiblaAngle)}°` : `Ka'aba ${qiblaAngle}°`}
                </div>
              </div>
            </div>
          </div>

          {/* Center Accelerometer Spirit Level (Bubble Indicator) */}
          <div
            className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300 pointer-events-none ${
              tiltState.isLevel
                ? 'border-emerald-500/60 bg-emerald-500/10'
                : 'border-amber-500/60 bg-amber-500/10'
            }`}
            title={
              isBangla
                ? `অ্যাক্সিলেরোমিটার টিল্ট: ${formatNumber(tiltState.tiltAngle)}°`
                : `Accelerometer Tilt: ${tiltState.tiltAngle}°`
            }
          >
            {/* Bullseye crosshair lines */}
            <div className="absolute w-full h-[1px] bg-slate-300 pointer-events-none" />
            <div className="absolute h-full w-[1px] bg-slate-300 pointer-events-none" />

            {/* Inner target circle */}
            <div className="w-8 h-8 rounded-full border border-dashed border-slate-400 pointer-events-none" />

            {/* Moving Spirit Bubble */}
            <div
              className={`absolute w-5 h-5 rounded-full shadow-md transition-transform duration-100 flex items-center justify-center ${
                tiltState.isLevel
                  ? 'bg-emerald-600 ring-2 ring-emerald-300 text-white'
                  : 'bg-amber-500 ring-2 ring-amber-300 text-white'
              }`}
              style={{
                transform: `translate(${tiltState.bubbleX * 24}px, ${tiltState.bubbleY * 24}px)`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
            </div>
          </div>
        </div>

        {/* Live Guidance Banner Below Dial */}
        <div className="mt-5 text-center space-y-1.5 w-full max-w-sm px-2">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs md:text-sm font-bold border transition-all duration-300 ${
              alignment.isAligned
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/30'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            {alignment.isAligned ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>
                  {isBangla
                    ? alignment.guidanceBangla
                    : "MashaAllah! Facing the Holy Ka'aba"}
                </span>
              </>
            ) : (
              <>
                <Navigation
                  className={`w-4 h-4 text-amber-500 ${
                    alignment.directionHint === 'right' ? 'rotate-90' : '-rotate-90'
                  }`}
                />
                <span>
                  {isBangla
                    ? alignment.guidanceBangla
                    : alignment.directionHint === 'right'
                    ? 'Turn right towards Qibla'
                    : 'Turn left towards Qibla'}
                </span>
              </>
            )}
          </div>

          {/* Device Orientation and Heading Degree Numbers */}
          <div className="flex items-center justify-center gap-3 text-xs text-slate-600 font-mono">
            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
              {isBangla ? 'দিক:' : 'Heading:'} {formatNumber(Math.round(currentHeading))}° (
              {getCardinalLabel(currentHeading)})
            </span>
            <span>•</span>
            <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/60 font-semibold">
              {isBangla ? 'কিবলা:' : 'Qibla:'} {formatNumber(qiblaAngle)}°
            </span>
          </div>

          {/* Drag instruction hint */}
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <Hand className="w-3 h-3 text-emerald-600" />
            <span>
              {isBangla
                ? 'কম্পাস চক্রটি স্পর্শ করে ঘুরিয়ে কিবলা পরীক্ষা করুন'
                : 'Touch or drag compass dial to rotate manually'}
            </span>
          </p>
        </div>
      </div>

      {/* Quick Cardinal Snap Buttons */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap my-2">
        <button
          type="button"
          onClick={() => {
            setIsManualMode(true);
            setManualHeading(qiblaAngle);
          }}
          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
            Math.abs(currentHeading - qiblaAngle) <= 4
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
          }`}
        >
          <span>🕋</span>
          <span>{isBangla ? "কা'বামুখী করুন" : 'Lock Kaaba'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsManualMode(true);
            setManualHeading(0);
          }}
          className="px-2 py-1 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
        >
          {isBangla ? 'উত্তর (০°)' : 'N (0°)'}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsManualMode(true);
            setManualHeading(90);
          }}
          className="px-2 py-1 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
        >
          {isBangla ? 'পূর্ব (৯০°)' : 'E (90°)'}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsManualMode(true);
            setManualHeading(180);
          }}
          className="px-2 py-1 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
        >
          {isBangla ? 'দক্ষিণ (১৮০°)' : 'S (180°)'}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsManualMode(true);
            setManualHeading(270);
          }}
          className="px-2 py-1 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
        >
          {isBangla ? 'পশ্চিম (২৭০°)' : 'W (270°)'}
        </button>
      </div>

      {/* Sensor & Level Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2 pt-3 border-t border-slate-100 text-xs">
        {/* Accelerometer Level Status */}
        <div
          className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition ${
            tiltState.isLevel
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
              : 'bg-amber-50/70 border-amber-200 text-amber-800'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl shrink-0 ${
              tiltState.isLevel
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 text-white animate-pulse'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold flex items-center justify-between">
              <span>{isBangla ? 'অ্যাক্সিলেরোমিটার লেভেল' : 'Accelerometer Level'}</span>
              <span className="font-mono text-[10px]">
                {formatNumber(tiltState.tiltAngle)}° {isBangla ? 'টিল্ট' : 'Tilt'}
              </span>
            </div>
            <p className="text-[11px] leading-tight mt-0.5 opacity-90">
              {tiltState.isLevel
                ? (isBangla ? 'ডিভাইস সমতল রয়েছে (সঠিক পরিমাপ)' : 'Device is flat (Accurate measurement)')
                : (isBangla ? 'ফোনটি সমতল রাখুন (উন্নত নির্ভুলতার জন্য)' : 'Hold device flat for best accuracy')}
            </p>
          </div>
        </div>

        {/* Magnetometer / Sensor Hardware Status */}
        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                sensorActive && !isManualMode
                  ? 'bg-emerald-500 animate-ping'
                  : 'bg-amber-500'
              }`}
            />
            <div className="truncate">
              <span className="text-[11px] font-semibold text-slate-700 block">
                {sensorActive && !isManualMode
                  ? (isBangla ? 'ম্যাগনেটোমিটার সক্রিয়' : 'Magnetometer Active')
                  : isManualMode
                  ? (isBangla ? 'ম্যানুয়াল / ড্র্যাগ মোড' : 'Interactive Mode')
                  : (isBangla ? 'সেন্সর প্রস্তুত' : 'Sensors Ready')}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {isBangla
                  ? `দূরত্ব: প্রায় ${toBanglaNumber(kaabaDistanceKm.toLocaleString())} কি.মি.`
                  : `Distance: ~${kaabaDistanceKm.toLocaleString()} km`}
              </span>
            </div>
          </div>

          {/* Toggle between live sensor and test mode */}
          <div className="flex items-center gap-1">
            {isManualMode ? (
              <button
                type="button"
                onClick={handleResetToLiveSensor}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition shrink-0 cursor-pointer shadow-xs"
                title={isBangla ? 'লাইভ হার্ডওয়্যার সেন্সরে ফিরুন' : 'Return to hardware sensors'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isBangla ? 'লাইভ সেন্সর' : 'Live Sensor'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsManualMode(true);
                  setManualHeading(deviceHeading);
                }}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 flex items-center gap-1 transition shrink-0 cursor-pointer"
                title={isBangla ? 'ম্যানুয়াল ড্র্যাগ চালু করুন' : 'Test manual rotation'}
              >
                <Sliders className="w-3 h-3" />
                <span>{isBangla ? 'টেস্ট মোড' : 'Manual Mode'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Compass Slider (Visible when testing or in manual mode) */}
      {(isManualMode || hasSensorSupport === false) && (
        <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between text-amber-900">
            <span className="font-semibold flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" />
              {isBangla ? 'দিক পরিবর্তন স্লাইডার (সিমুলেটর):' : 'Heading Simulator (Manual Slider):'}
            </span>
            <span className="font-mono font-bold">{formatNumber(manualHeading)}°</span>
          </div>
          <input
            id="qibla-manual-slider"
            type="range"
            min={0}
            max={359}
            value={manualHeading}
            onChange={(e) => {
              setIsManualMode(true);
              setManualHeading(Number(e.target.value));
            }}
            className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>{isBangla ? '০° (উত্তর)' : '0° (N)'}</span>
            <span>{isBangla ? '৯০° (পূর্ব)' : '90° (E)'}</span>
            <span>{isBangla ? '১৮০° (দক্ষিণ)' : '180° (S)'}</span>
            <span>{isBangla ? '২৭০° (পশ্চিম)' : '270° (W)'}</span>
          </div>
          <p className="text-[10px] text-slate-500 italic text-center">
            {isBangla
              ? '*কম্পাস চক্রটি সরাসরি আঙুল বা মাউস দিয়ে ঘুরিয়েও পরীক্ষা করতে পারবেন।'
              : '*You can also rotate the compass dial directly with your finger or mouse.'}
          </p>
        </div>
      )}
    </div>
  );
};
