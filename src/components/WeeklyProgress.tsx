import React, { useState } from 'react';
import { WorkoutSession, PersonalRecord, MuscleGroup } from '../types/workout';
import { EXERCISES, MUSCLE_LABELS } from '../data/exercises';
import {
  Calendar,
  Flame,
  Award,
  Zap,
  CheckCircle2,
  Clock,
  Home,
  Dumbbell,
  TrendingUp,
  Activity,
  Layers,
  Repeat,
  Trophy
} from 'lucide-react';
import { WorkoutStreakCalendar } from './WorkoutStreakCalendar';
import { calculateWorkoutStreaks } from '../utils/streakUtils';
import { useLanguage } from '../i18n/LanguageContext';
import { getLocaleCode, getExerciseName } from '../utils/i18nHelpers';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';

interface WeeklyProgressProps {
  sessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
  onStartWorkout: () => void;
}

export const WeeklyProgress: React.FC<WeeklyProgressProps> = ({
  sessions,
  personalRecords,
  onStartWorkout
}) => {
  const { language, t } = useLanguage();
  const [chartMetric, setChartMetric] = useState<'reps' | 'volumeKg' | 'sets'>('reps');
  const [viewMode, setViewMode] = useState<'weekly' | 'calendar'>('weekly');

  const now = new Date();
  const { currentStreak, longestStreak } = calculateWorkoutStreaks(sessions, now);
  const currentDay = now.getDay();
  const mondayDiff = currentDay === 0 ? -6 : 1 - currentDay;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + mondayDiff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Filter sessions that occurred this week
  const thisWeekSessions = sessions.filter(s => {
    const sDate = new Date(s.startTime);
    return sDate >= startOfWeek;
  });

  // Calculate volume by muscle group for this week
  const muscleVolumeSets: Record<MuscleGroup, number> = {
    chest: 0,
    lats: 0,
    traps: 0,
    shoulders: 0,
    biceps: 0,
    triceps: 0,
    forearms: 0,
    abs: 0,
    quads: 0,
    hamstrings: 0,
    glutes: 0,
    calves: 0,
    lower_back: 0
  };

  let totalSetsCompleted = 0;
  let totalDurationSecs = 0;

  thisWeekSessions.forEach(session => {
    totalDurationSecs += session.durationSeconds;

    session.exercises.forEach(we => {
      const exMeta = EXERCISES.find(e => e.id === we.exerciseId);
      if (!exMeta) return;

      const completedSets = we.sets.filter(s => s.completed).length;
      totalSetsCompleted += completedSets;

      muscleVolumeSets[exMeta.primaryMuscle] += completedSets;
      exMeta.secondaryMuscles.forEach(sm => {
        muscleVolumeSets[sm] += Math.round(completedSets * 0.5);
      });
    });
  });

  const locale = getLocaleCode(language);

  // Calculate 4-week historical progression
  const last4WeeksData = [3, 2, 1, 0].map(weeksAgo => {
    const wStart = new Date(startOfWeek);
    wStart.setDate(startOfWeek.getDate() - weeksAgo * 7);
    wStart.setHours(0, 0, 0, 0);

    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 7);

    const weekSessions = sessions.filter(s => {
      const sDate = new Date(s.startTime);
      return sDate >= wStart && sDate < wEnd;
    });

    let totalReps = 0;
    let totalVolumeKg = 0;
    let totalSets = 0;
    let totalDurationMinutes = 0;

    weekSessions.forEach(s => {
      totalVolumeKg += s.totalVolumeKg;
      totalSets += s.totalSets;
      totalDurationMinutes += Math.round(s.durationSeconds / 60);

      s.exercises.forEach(we => {
        we.sets.filter(st => st.completed).forEach(st => {
          totalReps += st.repsOrSeconds || 0;
        });
      });
    });

    let label = '';
    let shortLabel = '';

    if (language === 'en') {
      label = weeksAgo === 0 ? 'Current Week' : weeksAgo === 1 ? 'Previous Week' : `Week -${weeksAgo}`;
      shortLabel = weeksAgo === 0 ? 'Current' : `W-${weeksAgo}`;
    } else if (language === 'es') {
      label = weeksAgo === 0 ? 'Semana Actual' : weeksAgo === 1 ? 'Semana Anterior' : `Semana -${weeksAgo}`;
      shortLabel = weeksAgo === 0 ? 'Actual' : `Sem -${weeksAgo}`;
    } else {
      label = weeksAgo === 0 ? 'Semana Atual' : weeksAgo === 1 ? 'Semana Anterior' : `Semana -${weeksAgo}`;
      shortLabel = weeksAgo === 0 ? 'Atual' : `Sem -${weeksAgo}`;
    }

    const rangeStart = wStart.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
    const rangeEnd = new Date(wEnd.getTime() - 86400000).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
    const separator = language === 'en' ? ' to ' : language === 'es' ? ' a ' : ' a ';

    return {
      weekNumber: 4 - weeksAgo,
      label,
      shortLabel,
      dateRange: `${rangeStart}${separator}${rangeEnd}`,
      workouts: weekSessions.length,
      reps: totalReps,
      volumeKg: totalVolumeKg,
      sets: totalSets,
      minutes: totalDurationMinutes
    };
  });

  // Calculate growth rate over 4 weeks
  const firstWeekVal = last4WeeksData[0][chartMetric] || 0;
  const currentWeekVal = last4WeeksData[3][chartMetric] || 0;
  const monthlyGrowthPct = firstWeekVal > 0
    ? Math.round(((currentWeekVal - firstWeekVal) / firstWeekVal) * 100)
    : currentWeekVal > 0 ? 100 : 0;

  // 7-day week schedule (Mon - Sun / Seg - Dom)
  const daysOfWeek = t.progress.daysOfWeek.map((d, index) => ({
    key: d.key,
    label: d.label,
    dayOffset: index
  }));

  const daysStatus = daysOfWeek.map(d => {
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + d.dayOffset);
    const dateStr = targetDate.toISOString().split('T')[0];

    const sessionOnDay = thisWeekSessions.find(s => s.startTime.startsWith(dateStr));
    const isToday = targetDate.toDateString() === now.toDateString();

    return {
      ...d,
      dateNum: targetDate.getDate(),
      hasWorkout: Boolean(sessionOnDay),
      workoutTitle: sessionOnDay?.title,
      isToday
    };
  });

  const weeklyGoal = 4;
  const completedCount = thisWeekSessions.length;
  const goalPercent = Math.min(100, Math.round((completedCount / weeklyGoal) * 100));

  // Recovery calculation per muscle group
  const getMuscleRecoveryState = (muscle: MuscleGroup) => {
    let lastTrainedTime: Date | null = null;

    sessions.forEach(s => {
      const hasMuscle = s.exercises.some(we => {
        const meta = EXERCISES.find(e => e.id === we.exerciseId);
        return meta && (meta.primaryMuscle === muscle || meta.secondaryMuscles.includes(muscle));
      });

      if (hasMuscle) {
        const time = new Date(s.endTime || s.startTime);
        if (!lastTrainedTime || time > lastTrainedTime) {
          lastTrainedTime = time;
        }
      }
    });

    if (!lastTrainedTime) {
      return { status: t.progress.statusReady, percent: 100, color: 'text-emerald-400' };
    }

    const hoursSince = (now.getTime() - (lastTrainedTime as Date).getTime()) / (1000 * 60 * 60);

    if (hoursSince < 24) {
      return { status: t.progress.statusRecentFatigue, percent: 35, color: 'text-rose-400' };
    }
    if (hoursSince < 48) {
      return { status: t.progress.statusRecovering, percent: 70, color: 'text-amber-400' };
    }
    return { status: t.progress.statusReady, percent: 100, color: 'text-emerald-400' };
  };

  const readyMuscles = (Object.keys(MUSCLE_LABELS) as MuscleGroup[])
    .filter(m => getMuscleRecoveryState(m).percent === 100)
    .slice(0, 4);

  // Metric metadata
  const metricConfigs = {
    reps: {
      title: t.progress.metricRepsTitle,
      unit: language === 'en' ? 'reps/sec' : 'reps/seg',
      color: '#10b981',
      stroke: '#34d399',
      desc: t.progress.metricRepsDesc
    },
    volumeKg: {
      title: t.progress.metricVolumeTitle,
      unit: 'kg',
      color: '#38bdf8',
      stroke: '#0284c7',
      desc: t.progress.metricVolumeDesc
    },
    sets: {
      title: t.progress.metricSetsTitle,
      unit: language === 'en' ? 'sets' : language === 'es' ? 'series' : 'séries',
      color: '#a855f7',
      stroke: '#c084fc',
      desc: t.progress.metricSetsDesc
    }
  };

  const activeMetricConfig = metricConfigs[chartMetric];

  // Custom Recharts Tooltip
  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ value: number; payload: (typeof last4WeeksData)[0] }>;
  }

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = payload[0].value;

      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3.5 rounded-xl shadow-xl backdrop-blur-md text-xs min-w-[200px]">
          <div className="font-bold text-slate-100 flex items-center justify-between mb-1">
            <span>{data.label}</span>
            <span className="text-[11px] font-normal text-slate-400">({data.dateRange})</span>
          </div>

          <div className="my-2 p-2 bg-slate-950/80 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">{activeMetricConfig.title}:</span>
            <div className="text-lg font-extrabold text-emerald-400 font-display tabular-nums mt-0.5">
              {value.toLocaleString()} <span className="text-xs font-medium text-slate-300">{activeMetricConfig.unit}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>
              {t.progress.workoutsLabel}: <strong className="text-slate-200 tabular-nums">{data.workouts}</strong>
            </span>
            <span>
              {t.progress.timeLabel}: <strong className="text-slate-200 tabular-nums">{data.minutes} min</strong>
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const seriesWord = language === 'en' ? 'sets' : language === 'es' ? 'series' : 'séries';

  return (
    <div className="space-y-6">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Weekly frequency */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{t.progress.homeWorkouts}</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-display tabular-nums">
            {completedCount}{' '}
            <span className="text-sm font-normal text-slate-500">
              / {weeklyGoal} {t.progress.inTheWeek}
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
        </div>

        {/* Total Time at Home */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{t.progress.activeTimeHome}</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-display tabular-nums">
            {Math.round(totalDurationSecs / 60)}{' '}
            <span className="text-sm font-normal text-slate-500">{t.common.minutes}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 truncate">
            {t.progress.sessionsInRoom(thisWeekSessions.length)}
          </p>
        </div>

        {/* Total Sets */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{t.progress.setsCompleted}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-display tabular-nums">
            {totalSetsCompleted}{' '}
            <span className="text-sm font-normal text-slate-500">{seriesWord}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {t.progress.bodyweightSubtitle}
          </p>
        </div>

        {/* Consistency streak */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{t.progress.activeStreak}</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-display tabular-nums">
            {currentStreak}{' '}
            <span className="text-sm font-normal text-slate-400">
              {currentStreak === 1 ? t.common.day : t.common.days}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>{t.progress.recordStreak(longestStreak)}</span>
          </p>
        </div>
      </div>

      {/* Sub-view Switcher: Weekly Overview vs Monthly Consistency Calendar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setViewMode('weekly')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            viewMode === 'weekly'
              ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{t.progress.tabWeekly}</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('calendar')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            viewMode === 'calendar'
              ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t.progress.tabCalendar}</span>
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <WorkoutStreakCalendar sessions={sessions} onStartWorkout={onStartWorkout} />
      ) : (
        <React.Fragment>
          {/* RECHARTS: 4-WEEKS ACCUMULATED EVOLUTION */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            {/* Chart Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 font-display">
                    {t.progress.chartTitle}
                  </h3>
                  {monthlyGrowthPct !== 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tabular-nums">
                      {t.progress.inTheMonth(monthlyGrowthPct)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {activeMetricConfig.desc}
                </p>
              </div>

              {/* Interactive Metric Switch Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl self-start lg:self-auto overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setChartMetric('reps')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    chartMetric === 'reps'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>{t.progress.metricReps}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartMetric('volumeKg')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    chartMetric === 'volumeKg'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  <span>{t.progress.metricVolume}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartMetric('sets')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    chartMetric === 'sets'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{t.progress.metricSets}</span>
                </button>
              </div>
            </div>

            {/* Interactive Recharts Line Graph */}
            <div className="w-full h-72 sm:h-80 select-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={last4WeeksData}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeMetricConfig.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={activeMetricConfig.color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#334155"
                    strokeDasharray="4 4"
                    opacity={0.3}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="shortLabel"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />

                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={val => val.toLocaleString()}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey={chartMetric}
                    stroke={activeMetricConfig.color}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#metricGradient)"
                    activeDot={{
                      r: 6,
                      fill: activeMetricConfig.color,
                      stroke: '#022c22',
                      strokeWidth: 2
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* 4-Week Summary Footnote Bar */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {last4WeeksData.map((w, idx) => (
                <div
                  key={w.weekNumber}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    idx === 3
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <span className="text-[11px] text-slate-400 block truncate">
                    {w.label}
                  </span>
                  <div className="text-base font-bold text-slate-100 font-display tabular-nums mt-0.5">
                    {w[chartMetric].toLocaleString()}{' '}
                    <span className="text-[11px] font-normal text-slate-400">
                      {activeMetricConfig.unit}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {w.workouts} {t.progress.workoutsLabel.toLowerCase()} · {w.minutes} min
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Schedule Days Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {t.progress.currentWeekSchedule}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.progress.currentWeekScheduleDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={onStartWorkout}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>{t.progress.trainToday}</span>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {daysStatus.map(d => (
                <div
                  key={d.key}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    d.hasWorkout
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-slate-100 shadow-sm'
                      : d.isToday
                      ? 'bg-slate-800/80 border-slate-600 text-slate-100 ring-2 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase">{d.label}</span>
                  <span className="text-lg font-bold my-1 font-display tabular-nums">
                    {d.dateNum}
                  </span>
                  {d.hasWorkout ? (
                    <span className="w-5 h-5 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-sm">
                      ✓
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">
                      {d.isToday ? t.common.today : t.progress.restDay}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Split Section: Muscle Volume & Muscle Recovery Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Weekly Sets Volume (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {t.progress.weeklyVolumePerMuscle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t.progress.weeklyVolumeDesc}
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                {[
                  { muscle: 'chest' as MuscleGroup, optimal: 12 },
                  { muscle: 'quads' as MuscleGroup, optimal: 14 },
                  { muscle: 'abs' as MuscleGroup, optimal: 12 },
                  { muscle: 'lats' as MuscleGroup, optimal: 12 },
                  { muscle: 'glutes' as MuscleGroup, optimal: 12 },
                  { muscle: 'triceps' as MuscleGroup, optimal: 10 },
                  { muscle: 'shoulders' as MuscleGroup, optimal: 10 }
                ].map(item => {
                  const currentSets = muscleVolumeSets[item.muscle] || 0;
                  const percent = Math.min(100, Math.round((currentSets / item.optimal) * 100));

                  let statusText = t.progress.inDevelopment;
                  let barColor = 'bg-slate-600';
                  if (currentSets >= 8) {
                    statusText = t.progress.excellentVolume;
                    barColor = 'bg-emerald-500';
                  } else if (currentSets >= 4) {
                    statusText = t.progress.maintenance;
                    barColor = 'bg-emerald-600/70';
                  }

                  const muscleName = MUSCLE_LABELS[item.muscle][language] || MUSCLE_LABELS[item.muscle].pt;

                  return (
                    <div key={item.muscle}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-200">
                          {muscleName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">
                            {statusText}
                          </span>
                          <span className="font-bold text-slate-100 tabular-nums">
                            {currentSets} / {item.optimal} {seriesWord}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Muscle Recovery & Recommendations (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-100">
                    {t.progress.muscleRecovery}
                  </h3>
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {t.progress.muscleRecoveryDesc}
                </p>

                <div className="space-y-2.5">
                  {[
                    'chest',
                    'lats',
                    'quads',
                    'glutes',
                    'abs',
                    'triceps',
                    'shoulders'
                  ].map(key => {
                    const muscle = key as MuscleGroup;
                    const rec = getMuscleRecoveryState(muscle);
                    const muscleName = MUSCLE_LABELS[muscle][language] || MUSCLE_LABELS[muscle].pt;
                    return (
                      <div
                        key={muscle}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                      >
                        <span className="font-medium text-slate-300">
                          {muscleName}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${rec.percent}%` }}
                            />
                          </div>
                          <span className={`font-semibold tabular-nums ${rec.color}`}>
                            {rec.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick recommendation note */}
              <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <span className="font-bold text-emerald-300 block mb-1">
                  {t.progress.tipNextWorkout}
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {t.progress.musclesRested}{' '}
                  <strong className="text-emerald-400">
                    {readyMuscles.map(m => MUSCLE_LABELS[m][language] || MUSCLE_LABELS[m].pt).join(', ')}
                  </strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Hall of Personal Records (Home PRs) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {t.progress.prsTitle}
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {t.progress.prsCount(personalRecords.length)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {personalRecords.map(pr => {
                const exMeta = EXERCISES.find(e => e.id === pr.exerciseId);
                const displayName = exMeta ? getExerciseName(exMeta, language) : pr.exerciseName;
                return (
                  <div
                    key={pr.exerciseId}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/30 transition-colors"
                  >
                    <h4 className="font-bold text-sm text-slate-200 truncate">
                      {displayName}
                    </h4>
                    <div className="my-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-amber-400 font-display tabular-nums">
                        {pr.maxScore}
                      </span>
                      <span className="text-xs text-slate-400">{pr.metricLabel}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
                      <span>{t.progress.bestRecord}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      )}
    </div>
  );
};
