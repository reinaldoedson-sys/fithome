import React, { useState } from 'react';
import { WorkoutSession } from '../types/workout';
import { generateMonthCalendar, DayWorkoutSummary } from '../utils/streakUtils';
import {
  Calendar as CalendarIcon,
  Flame,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  CheckCircle2,
  X,
  Layers
} from 'lucide-react';

interface WorkoutStreakCalendarProps {
  sessions: WorkoutSession[];
  onStartWorkout?: () => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

const WEEKDAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const WorkoutStreakCalendar: React.FC<WorkoutStreakCalendarProps> = ({
  sessions,
  onStartWorkout
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<DayWorkoutSummary | null>(null);

  const { days, stats } = generateMonthCalendar(
    currentYear,
    currentMonth,
    sessions,
    today
  );

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDay(null);
  };

  return (
    <div className="space-y-6">
      {/* Gamification Cards: Streak & Monthly Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Current Streak */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Sequência Ativa
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-current animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display tabular-nums">
              {stats.currentStreak}
            </span>
            <span className="text-xs text-slate-400">
              {stats.currentStreak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.currentStreak > 0 ? 'Mantenha o fogo aceso!' : 'Treine hoje para acender sua sequência!'}
          </p>
        </div>

        {/* Card 2: Longest Streak Record */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Maior Sequência
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display tabular-nums">
              {stats.longestStreak}
            </span>
            <span className="text-xs text-slate-400">dias recorde</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sua maior consistência histórica.</p>
        </div>

        {/* Card 3: Monthly Workouts */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Treinos no Mês
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-display tabular-nums">
              {stats.totalWorkoutsMonth}
            </span>
            <span className="text-xs text-slate-400">sessões feitas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Em {MONTH_NAMES[currentMonth]}.</p>
        </div>

        {/* Card 4: Monthly Volume & Minutes */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tempo & Volume
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-display tabular-nums">
              {stats.totalMinutesMonth}
            </span>
            <span className="text-xs text-slate-400">minutos</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.totalVolumeMonthKg > 0 ? `${stats.totalVolumeMonthKg} kg levantados` : 'Foco em peso corporal'}
          </p>
        </div>
      </div>

      {/* Main Monthly Calendar Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        {/* Month Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
                {currentMonth === today.getMonth() && currentYear === today.getFullYear() && (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Mês Atual
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Toque nos dias destacados para ver os treinos realizados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleGoToday}
              className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Hoje
            </button>
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekday Labels Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-semibold text-slate-400 py-1">
          {WEEKDAY_NAMES.map(day => (
            <div key={day} className="uppercase tracking-wider text-[11px]">
              {day}
            </div>
          ))}
        </div>

        {/* 42-day Calendar Matrix */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((day, idx) => {
            const isSelected = selectedDay?.dateStr === day.dateStr;

            return (
              <button
                key={`${day.dateStr}-${idx}`}
                type="button"
                onClick={() => setSelectedDay(day.hasWorkout ? day : null)}
                disabled={!day.hasWorkout}
                className={`min-h-[58px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-xl text-left transition-all relative flex flex-col justify-between ${
                  !day.isCurrentMonth
                    ? 'opacity-25 bg-slate-950/20 text-slate-600 border border-transparent'
                    : day.hasWorkout
                    ? isSelected
                      ? 'bg-emerald-950/60 border-2 border-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-emerald-950/30 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/50 shadow-sm'
                    : day.isToday
                    ? 'bg-slate-800/60 border border-slate-700 text-slate-300'
                    : 'bg-slate-950/40 border border-slate-800/60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-bold ${day.isToday ? 'text-emerald-400 underline underline-offset-2' : ''}`}>
                    {day.dayNumber}
                  </span>
                  {day.hasWorkout && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  )}
                </div>

                {day.hasWorkout ? (
                  <div className="mt-1">
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-300 block truncate">
                      {day.sessions.length === 1 ? day.sessions[0].title : `${day.sessions.length} treinos`}
                    </span>
                    <span className="hidden sm:block text-[10px] text-slate-400 tabular-nums">
                      {Math.round(day.totalDurationSeconds / 60)} min
                    </span>
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Day Details Panel */}
        {selectedDay && selectedDay.sessions.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">
                  Treinos realizados em {new Date(`${selectedDay.dateStr}T12:00:00`).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedDay.sessions.map(s => (
                <div
                  key={s.id}
                  className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-bold text-white text-sm">{s.title}</h5>
                      <span className="text-[11px] text-slate-400">
                        {new Date(s.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                      Concluído
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-300 pt-1 border-t border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{Math.round(s.durationSeconds / 60)} min</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>{s.totalSets} séries</span>
                    </span>
                    {s.totalVolumeKg > 0 && (
                      <span className="flex items-center gap-1">
                        <Dumbbell className="w-3.5 h-3.5 text-slate-500" />
                        <span>{s.totalVolumeKg} kg</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
