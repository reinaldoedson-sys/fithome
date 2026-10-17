import { describe, it, expect } from 'vitest';
import { calculateWorkoutStreaks, generateMonthCalendar, getSortedWorkoutDates } from '../streakUtils';
import { WorkoutSession } from '../../types/workout';

const createMockSession = (id: string, dateStr: string, volumeKg = 50, durationSec = 1800): WorkoutSession => ({
  id,
  title: `Treino ${id}`,
  startTime: `${dateStr}T10:00:00.000Z`,
  endTime: `${dateStr}T10:30:00.000Z`,
  durationSeconds: durationSec,
  exercises: [],
  totalVolumeKg: volumeKg,
  totalSets: 12
});

describe('Streak and Calendar Utilities (streakUtils)', () => {
  it('1. Returns zero streaks when there are no sessions', () => {
    const { currentStreak, longestStreak } = calculateWorkoutStreaks([]);
    expect(currentStreak).toBe(0);
    expect(longestStreak).toBe(0);
  });

  it('2. Extracts and sorts unique workout dates', () => {
    const sessions = [
      createMockSession('1', '2026-03-10'),
      createMockSession('2', '2026-03-08'),
      createMockSession('3', '2026-03-10'), // duplicate date
      createMockSession('4', '2026-03-09')
    ];

    const dates = getSortedWorkoutDates(sessions);
    expect(dates).toEqual(['2026-03-08', '2026-03-09', '2026-03-10']);
  });

  it('3. Calculates consecutive streaks accurately across multiple dates', () => {
    const sessions = [
      // 3-day streak
      createMockSession('1', '2026-03-01'),
      createMockSession('2', '2026-03-02'),
      createMockSession('3', '2026-03-03'),
      // gap on 03-04
      // 4-day streak
      createMockSession('4', '2026-03-05'),
      createMockSession('5', '2026-03-06'),
      createMockSession('6', '2026-03-07'),
      createMockSession('7', '2026-03-08')
    ];

    const refDate = new Date(2026, 2, 8); // 2026-03-08
    const { currentStreak, longestStreak } = calculateWorkoutStreaks(sessions, refDate);

    expect(currentStreak).toBe(4);
    expect(longestStreak).toBe(4);
  });

  it('4. Preserves current streak if referenceDate is today without workout but yesterday had workout', () => {
    const sessions = [
      createMockSession('1', '2026-03-06'),
      createMockSession('2', '2026-03-07') // yesterday
    ];

    const todayRef = new Date(2026, 2, 8); // 2026-03-08
    const { currentStreak } = calculateWorkoutStreaks(sessions, todayRef);

    // Active streak is 2 days (ended yesterday, can be continued today)
    expect(currentStreak).toBe(2);
  });

  it('5. Resets current streak to 0 if neither today nor yesterday had a workout', () => {
    const sessions = [
      createMockSession('1', '2026-03-01'),
      createMockSession('2', '2026-03-02')
    ];

    const todayRef = new Date(2026, 2, 10);
    const { currentStreak, longestStreak } = calculateWorkoutStreaks(sessions, todayRef);

    expect(currentStreak).toBe(0);
    expect(longestStreak).toBe(2);
  });

  it('6. Generates full 42-cell month calendar with month metrics', () => {
    const sessions = [
      createMockSession('1', '2026-03-05', 100, 2400),
      createMockSession('2', '2026-03-12', 150, 3600),
      createMockSession('3', '2026-03-20', 200, 1800)
    ];

    const calendar = generateMonthCalendar(2026, 2, sessions, new Date(2026, 2, 20));

    expect(calendar.days.length).toBe(42);
    expect(calendar.stats.totalWorkoutsMonth).toBe(3);
    expect(calendar.stats.totalVolumeMonthKg).toBe(450);
    expect(calendar.stats.totalMinutesMonth).toBe(130); // 40 + 60 + 30 mins

    const day5 = calendar.days.find(d => d.dateStr === '2026-03-05');
    expect(day5?.hasWorkout).toBe(true);
    expect(day5?.sessions.length).toBe(1);
    expect(day5?.totalVolumeKg).toBe(100);
  });
});
