import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Repeat, X, Volume2, HardDriveDownload, AlertCircle } from 'lucide-react';
import { Qari, AppLanguage } from '../types';
import { RECITERS } from '../utils/quranApi';

interface AudioPlayerBarProps {
  surahNumber: number;
  surahNameBangla: string;
  surahNameEnglish?: string;
  currentAyahNumber: number;
  totalAyahs: number;
  audioUrl: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextAyah: () => void;
  onPrevAyah: () => void;
  onClose: () => void;
  selectedQariId: string;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onChangeQari?: (qariId: string) => void;
  language?: AppLanguage;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  surahNumber,
  surahNameBangla,
  surahNameEnglish,
  currentAyahNumber,
  totalAyahs,
  audioUrl,
  isPlaying,
  onTogglePlay,
  onNextAyah,
  onPrevAyah,
  onClose,
  selectedQariId,
  playbackSpeed,
  onChangeSpeed,
  onChangeQari,
  language = 'bn',
}) => {
  const isBangla = language === 'bn';

  const toDigits = (num: number | string): string => {
    if (!isBangla) return num.toString();
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map((c) => bnDigits[parseInt(c, 10)] ?? c).join('');
  };
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [isLooping, setIsLooping] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const currentQari = RECITERS.find((q: Qari) => q.id === selectedQariId) || RECITERS[0];

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    setIsLoadingAudio(true);
    setHasError(false);
    audio.src = audioUrl;
    audio.playbackRate = playbackSpeed;

    if (isPlaying) {
      audio
        .play()
        .then(() => setIsLoadingAudio(false))
        .catch((err) => {
          console.warn('Playback error:', err);
          setIsLoadingAudio(false);
          setHasError(true);
        });
    } else {
      audio.pause();
      setIsLoadingAudio(false);
    }
  }, [audioUrl]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setHasError(true));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Android Lock Screen & Notification Center MediaSession integration
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: surahNumber > 0 ? `${surahNameBangla} - আয়াত ${currentAyahNumber}` : surahNameBangla,
          artist: currentQari.nameBangla,
          album: 'Daily Quran',
          artwork: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        });

        navigator.mediaSession.setActionHandler('play', () => onTogglePlay());
        navigator.mediaSession.setActionHandler('pause', () => onTogglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => onPrevAyah());
        navigator.mediaSession.setActionHandler('nexttrack', () => onNextAyah());
      } catch (err) {
        // Safe fallback for older Android WebView/browsers
      }
    }
  }, [surahNumber, surahNameBangla, currentAyahNumber, currentQari, onTogglePlay, onPrevAyah, onNextAyah]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setProgress((cur / dur) * 100);

    const m = Math.floor(cur / 60);
    const s = Math.floor(cur % 60);
    setCurrentTime(`${m}:${s.toString().padStart(2, '0')}`);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration;
    if (dur && !isNaN(dur)) {
      const m = Math.floor(dur / 60);
      const s = Math.floor(dur % 60);
      setDuration(`${m}:${s.toString().padStart(2, '0')}`);
    }
    setIsLoadingAudio(false);
  };

  const handleEnded = () => {
    if (isLooping) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      onNextAyah();
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    onChangeSpeed(speeds[nextIdx]);
  };

  return (
    <div
      id="global-audio-player"
      className="fixed bottom-[62px] sm:bottom-[68px] left-0 right-0 z-40 max-w-xl mx-auto px-2.5 sm:px-3 pointer-events-auto"
    >
      <div className="bg-emerald-950/95 text-white backdrop-blur-md rounded-2xl shadow-xl border border-emerald-700/50 p-3 transition-all">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={() => {
            setHasError(true);
            setIsLoadingAudio(false);
          }}
        />

        {/* Progress bar */}
        <div className="w-full bg-emerald-900/60 h-1 rounded-full mb-2 overflow-hidden">
          <div
            className="bg-amber-400 h-full rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-400 shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-xs text-white truncate">
                  {isBangla ? surahNameBangla : (surahNameEnglish || surahNameBangla)}
                </span>
                <span className="text-[11px] text-amber-300 font-mono shrink-0">
                  {isBangla ? 'আয়াত' : 'Ayah'} {toDigits(currentAyahNumber)}/{toDigits(totalAyahs)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {onChangeQari ? (
                  <select
                    id="audio-player-qari-select"
                    value={selectedQariId}
                    onChange={(e) => onChangeQari(e.target.value)}
                    className="text-[10px] text-emerald-300 bg-emerald-900/80 hover:bg-emerald-850 border border-emerald-700/50 rounded px-1.5 py-0.5 max-w-[170px] truncate cursor-pointer focus:outline-hidden font-medium"
                    title={isBangla ? 'ক্বারী পরিবর্তন করুন' : 'Change Reciter'}
                  >
                    {RECITERS.map((q) => (
                      <option key={q.id} value={q.id} className="bg-slate-900 text-white text-xs">
                        {isBangla ? q.nameBangla : q.nameEnglish}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[10px] text-emerald-300/80 truncate">
                    {isBangla ? currentQari.nameBangla : currentQari.nameEnglish}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={cycleSpeed}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-900/80 hover:bg-emerald-850 text-emerald-200"
              title={isBangla ? 'প্লেব্যাক স্পিড পরিবর্তন' : 'Change playback speed'}
            >
              {playbackSpeed}x
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`p-1.5 rounded-lg transition ${
                isLooping ? 'text-amber-400 bg-amber-400/20' : 'text-emerald-300 hover:text-white'
              }`}
              title={
                isLooping
                  ? (isBangla ? 'আয়াত পুনরাবৃত্তি চালু' : 'Loop verse ON')
                  : (isBangla ? 'একবার শুনুন' : 'Play once')
              }
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onPrevAyah}
              disabled={currentAyahNumber <= 1}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white disabled:opacity-30"
              title={isBangla ? 'পূর্ববর্তী আয়াত' : 'Previous Ayah'}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-300 text-emerald-950 flex items-center justify-center font-bold shadow transition active:scale-95"
              title={
                isPlaying
                  ? (isBangla ? 'বিরতি' : 'Pause')
                  : (isBangla ? 'বাজান' : 'Play')
              }
            >
              {isLoadingAudio ? (
                <div className="w-3.5 h-3.5 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onNextAyah}
              disabled={currentAyahNumber >= totalAyahs}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white disabled:opacity-30"
              title={isBangla ? 'পরবর্তী আয়াত' : 'Next Ayah'}
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-rose-400 ml-1"
              title={isBangla ? 'প্লেয়ার বন্ধ করুন' : 'Close Player'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {hasError && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded">
            <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
            {isBangla
              ? 'অডিও লোড করা যায়নি; অনলাইন সংযোগ বা অফলাইন ডাউনলোড চেক করুন।'
              : 'Unable to load audio. Please check internet connection or offline cache.'}
          </div>
        )}
      </div>
    </div>
  );
};
