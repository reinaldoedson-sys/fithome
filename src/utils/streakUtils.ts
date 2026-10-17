import { WorkoutSession } from '../types/workout';

export interface DayWorkoutSummary {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  sessions: WorkoutSession[];
  totalVolumeKg: number;
  totalDurationSeconds: number;
  hasWorkout: boolean;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalWorkoutsMonth: number;
  totalMinutesMonth: number;
  totalVolumeMonthKg: number;
}

/**
 * Extracts unique dates (YYYY-MM-DD) from workout sessions sorted chronologically
 */
export const getSortedWorkoutDates = (sessions: WorkoutSession[]): string[] => {
  const datesSet = new Set<string>();
  sessions.forEach(s => {
    if (s.startTime) {
      const datePart = s.startTime.split('T')[0];
      if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        datesSet.add(datePart);
      }
    }
  });

  return Array.from(datesSet).sort();
};

/**
 * Calculate current consecutive workout days streak and all-time longest streak
 */
export const calculateWorkoutStreaks = (
  sessions: WorkoutSession[],
  referenceDate: Date = new Date()
): { currentStreak: number; longestStreak: number } => {
  const sortedDates = getSortedWorkoutDates(sessions);
  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate longest streak across all history
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  sortedDates.forEach(dateStr => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const currentDate = new Date(y, m - 1, d);

    if (prevDate) {
      const diffMs = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak += 1;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = currentDate;
  });

  // Calculate current streak relative to referenceDate (today or yesterday allowed)
  const todayStr = referenceDate.toISOString().split('T')[0];
  const yesterday = new Date(referenceDate);
  yesterday.setDate(referenceDate.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const dateSet = new Set(sortedDates);
  let currentStreak = 0;

  let checkDate = new Date(referenceDate);
  if (!dateSet.has(todayStr)) {
    // If today hasn't had a workout yet, check if yesterday had one to maintain streak
    if (dateSet.has(yesterdayStr)) {
      checkDate = yesterday;
    } else {
      return { currentStreak: 0, longestStreak };
    }
  }

  // Count backwards day by day
  while (true) {
    const curStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(curStr)) {
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
};

/**
 * Generates month calendar matrix (42 cells: 6 weeks x 7 days) starting on Monday
 */
export const generateMonthCalendar = (
  year: number,
  month: number, // 0-indexed (0 = Jan, 11 = Dec)
  sessions: WorkoutSession[],
  today: Date = new Date()
): {
  days: DayWorkoutSummary[];
  stats: StreakStats;
} => {
  const todayStr = today.toISOString().split('T')[0];

  // Map sessions by date
  const sessionsByDate: Record<string, WorkoutSession[]> = {};
  sessions.forEach(s => {
    if (s.startTime) {
      const datePart = s.startTime.split('T')[0];
      if (!sessionsByDate[datePart]) {
        sessionsByDate[datePart] = [];
      }
      sessionsByDate[datePart].push(s);
    }
  });

  // First day of month
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Dom, 1 = Seg ...
  // In pt-BR calendar starts on Monday (1):
  const leadDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // Calendar start date
  const calendarStart = new Date(year, month, 1 - leadDays);

  const days: DayWorkoutSummary[] = [];
  let totalWorkoutsMonth = 0;
  let totalMinutesMonth = 0;
  let totalVolumeMonthKg = 0;

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(calendarStart);
    cellDate.setDate(calendarStart.getDate() + i);

    const dateStr = cellDate.toISOString().split('T')[0];
    const isCurrentMonth = cellDate.getMonth() === month;
    const isToday = dateStr === todayStr;

    const daySessions = sessionsByDate[dateStr] || [];
    let dayVolume = 0;
    let dayDuration = 0;

    daySessions.forEach(s => {
      dayVolume += s.totalVolumeKg || 0;
      dayDuration += s.durationSeconds || 0;
    });

    if (isCurrentMonth) {
      totalWorkoutsMonth += daySessions.length;
      totalMinutesMonth += Math.round(dayDuration / 60);
      totalVolumeMonthKg += dayVolume;
    }

    days.push({
      dateStr,
      dayNumber: cellDate.getDate(),
      isCurrentMonth,
      isToday,
      sessions: daySessions,
      totalVolumeKg: dayVolume,
      totalDurationSeconds: dayDuration,
      hasWorkout: daySessions.length > 0
    });
  }

  const { currentStreak, longestStreak } = calculateWorkoutStreaks(sessions, today);

  return {
    days,
    stats: {
      currentStreak,
      longestStreak,
      totalWorkoutsMonth,
      totalMinutesMonth,
      totalVolumeMonthKg
    }
  };
};
