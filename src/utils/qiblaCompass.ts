/**
 * Qibla Compass calculation utilities & sensor adapters
 * Coordinates of Holy Kaaba in Mecca, Saudi Arabia:
 * Latitude: 21.422487° N, Longitude: 39.826206° E
 */

export const KAABA_COORDINATES = {
  lat: 21.422487,
  lng: 39.826206,
};

/**
 * Calculates Great Circle distance to Kaaba in kilometers using Haversine formula
 */
export function calculateKaabaDistance(userLat: number, userLng: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((KAABA_COORDINATES.lat - userLat) * Math.PI) / 180;
  const dLng = ((KAABA_COORDINATES.lng - userLng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((KAABA_COORDINATES.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Converts English numbers to Bengali numerals
 */
export function toBanglaNumber(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => bnDigits[Number(w)]);
}

/**
 * Derives compass heading from DeviceOrientationEvent.
 * Supports iOS (webkitCompassHeading), Android (deviceorientationabsolute / alpha),
 * and standard 3D tilt compensation.
 */
export function getCompassHeading(
  event: DeviceOrientationEvent,
  screenOrientation: number = 0
): { heading: number; accuracy?: number } | null {
  // 1. iOS Safari WebKit implementation (provides true compass heading)
  const webkitEvent = event as unknown as { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
  if (typeof webkitEvent.webkitCompassHeading === 'number' && !isNaN(webkitEvent.webkitCompassHeading)) {
    const heading = (webkitEvent.webkitCompassHeading + screenOrientation + 360) % 360;
    return {
      heading: Math.round(heading * 10) / 10,
      accuracy: webkitEvent.webkitCompassAccuracy,
    };
  }

  // 2. Standard Android / Chrome implementation
  const alpha = event.alpha;
  if (alpha === null || alpha === undefined || isNaN(alpha)) {
    return null;
  }

  // Standard flat 2D compass heading (0 = North, clockwise)
  let heading = (360 - alpha + screenOrientation + 360) % 360;

  // 3. Tilt compensation when device is held at an angle
  const beta = event.beta;
  const gamma = event.gamma;
  if (beta !== null && gamma !== null && !isNaN(beta) && !isNaN(gamma)) {
    const degToRad = Math.PI / 180;
    const b = beta * degToRad; // pitch
    const g = gamma * degToRad; // roll
    const a = alpha * degToRad; // yaw

    const sinA = Math.sin(a);
    const cosA = Math.cos(a);
    const sinB = Math.sin(b);
    const cosB = Math.cos(b);
    const sinG = Math.sin(g);
    const cosG = Math.cos(g);

    // Project device forward vector onto horizontal Earth plane (East = x, North = y)
    const x = -cosA * sinG * sinB - sinA * cosB * cosG;
    const y = -sinA * sinG * sinB + cosA * cosB * cosG;

    const mag = Math.hypot(x, y);
    if (mag > 0.05) {
      let rawHeading = (Math.atan2(x, y) * 180) / Math.PI;
      if (rawHeading < 0) {
        rawHeading += 360;
      }
      heading = (rawHeading + screenOrientation + 360) % 360;
    }
  }

  return { heading: Math.round(heading * 10) / 10 };
}

export interface TiltState {
  pitch: number; // Front-to-back tilt in degrees (-90 to 90)
  roll: number; // Left-to-right tilt in degrees (-90 to 90)
  tiltAngle: number; // Total tilt from horizontal plane (0 = flat, 90 = vertical)
  isLevel: boolean; // Device is sufficiently flat for compass accuracy (< 18°)
  bubbleX: number; // Normalized -1 to 1 for spirit level bubble
  bubbleY: number; // Normalized -1 to 1 for spirit level bubble
}

/**
 * Calculates tilt and levelness using Accelerometer (DeviceMotionEvent) or beta/gamma fallback
 */
export function calculateTiltAndLevel(
  motionEvent: DeviceMotionEvent | null,
  orientationEvent: DeviceOrientationEvent | null
): TiltState {
  let pitch = 0;
  let roll = 0;

  if (motionEvent?.accelerationIncludingGravity) {
    const { x, y, z } = motionEvent.accelerationIncludingGravity;
    if (x !== null && y !== null && z !== null) {
      // Calculate roll and pitch from accelerometer gravity vector
      pitch = Math.atan2(-y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
      roll = Math.atan2(x, z) * (180 / Math.PI);
    }
  } else if (orientationEvent && orientationEvent.beta !== null && orientationEvent.gamma !== null) {
    pitch = orientationEvent.beta;
    roll = orientationEvent.gamma;
  }

  // Clamp values
  pitch = Math.max(-90, Math.min(90, pitch));
  roll = Math.max(-90, Math.min(90, roll));

  const tiltAngle = Math.sqrt(pitch * pitch + roll * roll);
  const isLevel = tiltAngle <= 18; // within 18 degrees is considered adequately flat

  // Normalize bubble offset clamped to [-1, 1] range (scaled so 25° tilt pushes bubble to boundary)
  const maxTiltForBubble = 25;
  const bubbleX = Math.max(-1, Math.min(1, roll / maxTiltForBubble));
  const bubbleY = Math.max(-1, Math.min(1, -pitch / maxTiltForBubble));

  return {
    pitch: Math.round(pitch),
    roll: Math.round(roll),
    tiltAngle: Math.round(tiltAngle),
    isLevel,
    bubbleX,
    bubbleY,
  };
}

export interface QiblaAlignment {
  difference: number; // Signed degrees (-180 to 180)
  absoluteDiff: number; // 0 to 180
  isAligned: boolean; // True if within alignment threshold (<= 4 degrees)
  directionHint: 'aligned' | 'right' | 'left';
  guidanceBangla: string;
}

/**
 * Evaluates device orientation relative to Qibla bearing
 */
export function evaluateQiblaAlignment(
  deviceHeading: number,
  qiblaBearing: number,
  thresholdDeg: number = 4
): QiblaAlignment {
  // Difference between where device points and where Qibla is
  let diff = qiblaBearing - deviceHeading;

  // Normalize to -180 .. 180
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;

  const absoluteDiff = Math.round(Math.abs(diff) * 10) / 10;
  const isAligned = absoluteDiff <= thresholdDeg;

  let directionHint: 'aligned' | 'right' | 'left' = 'aligned';
  let guidanceBangla = '';

  if (isAligned) {
    directionHint = 'aligned';
    guidanceBangla = 'সঠিক কিবলামুখী! আপনি পবিত্র কা\'বার দিকে মুখ করে আছেন';
  } else if (diff > 0) {
    directionHint = 'right';
    guidanceBangla = `${toBanglaNumber(Math.round(absoluteDiff))}° ডানে ঘুরুন`;
  } else {
    directionHint = 'left';
    guidanceBangla = `${toBanglaNumber(Math.round(absoluteDiff))}° বামে ঘুরুন`;
  }

  return {
    difference: diff,
    absoluteDiff,
    isAligned,
    directionHint,
    guidanceBangla,
  };
}

// Gentle chime audio feedback using Web Audio API
let audioCtx: AudioContext | null = null;
let lastChimeTime = 0;

export function playQiblaAlignedChime(): void {
  const now = Date.now();
  // Throttle chimes to at most once every 3 seconds
  if (now - lastChimeTime < 3000) return;
  lastChimeTime = now;

  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioCtxClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Gentle melodic Islamic chime (E5 -> G#5)
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    osc.frequency.exponentialRampToValueAtTime(830.61, audioCtx.currentTime + 0.12); // G#5

    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.65);
  } catch (e) {
    // Ignore audio context autoplay limitations
  }

  // Trigger tactile vibration if available
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([40, 30, 40]);
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  }
}
