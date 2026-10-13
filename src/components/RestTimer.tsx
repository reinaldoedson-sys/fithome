import React, { useEffect } from 'react';
import { Play, Pause, Plus, Minus, X, Bell } from 'lucide-react';
import { playTimerBeep } from '../utils/audio';

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
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      playTimerBeep(true);
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
            Descanso entre Séries
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Fechar temporizador"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
        <div
          className="bg-emerald-500 h-full transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      {/* Main Countdown Display */}
      <div className="flex items-center justify-between">
        <div className="text-3xl font-extrabold tracking-tight tabular-nums text-slate-100 font-display">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAdjustTime(-15)}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors text-xs font-semibold"
            title="-15 segundos"
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
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Retomar</span>
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
