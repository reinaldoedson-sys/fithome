import React, { useEffect, useState } from 'react';
import { Play, Pause, Plus, Minus, X, Bell, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import {
  playTimerBeep,
  playCountdownBeep,
  speakVoiceAlert,
  isSoundEnabled,
  setSoundEnabled,
  isVoiceEnabled,
  setVoiceEnabled
} from '../utils/audio';
import { useLanguage } from '../i18n/LanguageContext';

interface RestTimerProps {
  duration: number; // in seconds
  timeLeft: number;
  isRunning: boolean;
  onTogglePlay: () => void;
  onAdjustTime: (deltaSeconds: number) => void;
  onClose: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  duration,
  timeLeft,
  isRunning,
  onTogglePlay,
  onAdjustTime,
  onClose,
}) => {
  const { language, t } = useLanguage();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [voiceOn, setVoiceOn] = useState(() => isVoiceEnabled());

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  const handleToggleSound = () => {
    const nextVal = !soundOn;
    setSoundOn(nextVal);
    setSoundEnabled(nextVal);
  };

  const handleToggleVoice = () => {
    const nextVal = !voiceOn;
    setVoiceOn(nextVal);
    setVoiceEnabled(nextVal);
  };

  // Beeps & voice alert effects
  useEffect(() => {
    if (!isRunning) return;

    if (timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
      playCountdownBeep(timeLeft);
    } else if (timeLeft === 0) {
      playTimerBeep(true);
      speakVoiceAlert(t.restTimer.voiceFinishMessage, language);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200, 100, 300]);
        } catch {
          // ignore vibration restriction
        }
      }
    }
  }, [timeLeft, isRunning]);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 bg-slate-900 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-sm w-[90vw] sm:w-80 transition-all animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {t.restTimer.title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Sound toggle button */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`p-1 rounded-lg transition-colors ${
              soundOn ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title={soundOn ? t.restTimer.soundOff : t.restTimer.soundOn}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Voice alert toggle button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-1 rounded-lg transition-colors ${
              voiceOn ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title={voiceOn ? t.restTimer.voiceOff : t.restTimer.voiceOn}
          >
            {voiceOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors ml-1"
            aria-label={t.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            timeLeft <= 3 && timeLeft > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      {/* Main Countdown Display */}
      <div className="flex items-center justify-between">
        <div className={`text-3xl font-extrabold tracking-tight tabular-nums font-display transition-colors ${
          timeLeft <= 3 && timeLeft > 0 ? 'text-amber-300' : 'text-slate-100'
        }`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAdjustTime(-15)}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors text-xs font-semibold"
            title="-15s"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-xs"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>{t.restTimer.pause}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t.restTimer.resume}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onAdjustTime(30)}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors text-xs font-semibold"
            title="+30 segundos"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
