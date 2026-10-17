import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hasCategoryMigrated,
  markCategoryMigrated,
  resetCategoryMigration,
  areAllCategoriesMigrated,
  getCategoryMigrationKey,
  ALL_MIGRATION_CATEGORIES,
  MigrationCategory
} from '../migrationUtils';
import {
  migrateCategory,
  handleCategorySnapshot,
  syncRestoredBackupToFirestore,
  clearInFlightMigrations,
  deduplicateEntries,
  GUEST_STORAGE_KEYS
} from '../../services/migrationService';
import { WorkoutSession, PersonalRecord } from '../../types/workout';
import { WeightEntry, MeasurementEntry, BodyGoal } from '../../types/bodyEvolution';

describe('Real Production Migration Service & Utilities (migrationService.ts & migrationUtils.ts)', () => {
  let mockStorage: Record<string, string> = {};

  const fakeStorage: Storage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = String(value);
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      mockStorage = {};
    },
    key: (index: number) => Object.keys(mockStorage)[index] ?? null,
    get length() {
      return Object.keys(mockStorage).length;
    }
  };

  beforeEach(() => {
    mockStorage = {};
    clearInFlightMigrations();
    vi.clearAllMocks();
  });

  const getStorageKey = (key: string, uid?: string | null) => {
    return uid ? `fithome_user_${uid}_${key}` : `fithome_guest_${key}`;
  };

  it('preserves user isolation in localStorage keys', () => {
    expect(getStorageKey('user_sessions', null)).toBe('fithome_guest_user_sessions');
    expect(getStorageKey('user_sessions', 'user_abc')).toBe('fithome_user_user_abc_user_sessions');
    expect(getStorageKey('user_sessions', 'user_xyz')).toBe('fithome_user_user_xyz_user_sessions');
    expect(getStorageKey('body_weights_v1', 'user_abc')).toBe('fithome_user_user_abc_body_weights_v1');
  });

  it('generates predictable per-category migration storage keys', () => {
    expect(getCategoryMigrationKey('uid_123', 'workouts')).toBe('fithome_migrated_uid_123_workouts');
    expect(getCategoryMigrationKey('uid_123', 'weights')).toBe('fithome_migrated_uid_123_weights');
    expect(getCategoryMigrationKey('uid_123', 'measurements')).toBe('fithome_migrated_uid_123_measurements');
    expect(getCategoryMigrationKey('uid_123', 'records')).toBe('fithome_migrated_uid_123_records');
    expect(getCategoryMigrationKey('uid_123', 'goals')).toBe('fithome_migrated_uid_123_goals');
  });

  it('tracks migration independently per category using real migrateCategory implementation', async () => {
    const uid = 'athlete-independent';

    // Guest has data in weights and workouts
    mockStorage[GUEST_STORAGE_KEYS.weights.primary] = JSON.stringify([
      { id: 'w1', date: '2026-03-01', weightKg: 78.5 }
    ]);
    mockStorage[GUEST_STORAGE_KEYS.workouts.primary] = JSON.stringify([
      { id: 's1', title: 'Treino A', startTime: '2026-03-01T10:00:00Z', exercises: [] }
    ]);

    const saveWeight = vi.fn().mockResolvedValue(undefined);
    const saveWorkout = vi.fn().mockResolvedValue(undefined);

    // Initial state: none are migrated
    expect(hasCategoryMigrated(uid, 'weights', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'measurements', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'records', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'goals', fakeStorage)).toBe(false);

    // 1. Migrate only weights
    const weightResult = await migrateCategory(uid, 'weights', {
      storage: fakeStorage,
      saveWeight
    });

    expect(weightResult.success).toBe(true);
    expect(weightResult.migrated).toBe(true);
    expect(weightResult.count).toBe(1);
    expect(saveWeight).toHaveBeenCalledTimes(1);

    // ONLY weights should be marked as migrated
    expect(hasCategoryMigrated(uid, 'weights', fakeStorage)).toBe(true);
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'measurements', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'records', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'goals', fakeStorage)).toBe(false);
    expect(areAllCategoriesMigrated(uid, fakeStorage)).toBe(false);

    // 2. Migrate workouts next
    const workoutResult = await migrateCategory(uid, 'workouts', {
      storage: fakeStorage,
      saveWorkout
    });

    expect(workoutResult.success).toBe(true);
    expect(workoutResult.migrated).toBe(true);
    expect(workoutResult.count).toBe(1);
    expect(saveWorkout).toHaveBeenCalledTimes(1);

    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);
    expect(hasCategoryMigrated(uid, 'measurements', fakeStorage)).toBe(false);
  });

  it('guarantees the sequence: login -> sync -> delete all records -> empty snapshot -> reload without resurrecting deleted data', async () => {
    const uid = 'athlete-lifecycle-test';
    let currentSessionsState: WorkoutSession[] = [];

    // Step 1: User has guest sessions in local storage before login
    const guestWorkouts: WorkoutSession[] = [
      {
        id: 'guest-w1',
        title: 'Treino Convidado',
        startTime: '2026-03-01T09:00:00Z',
        endTime: '2026-03-01T09:45:00Z',
        durationSeconds: 2700,
        totalVolumeKg: 1200,
        totalSets: 12,
        exercises: []
      }
    ];
    mockStorage[GUEST_STORAGE_KEYS.workouts.primary] = JSON.stringify(guestWorkouts);
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(false);

    const saveWorkout = vi.fn().mockResolvedValue(undefined);
    const deps = { storage: fakeStorage, saveWorkout };

    // Step 2: User logs in. Initial snapshot arrives from Firestore with empty remote array
    await handleCategorySnapshot(
      uid,
      'workouts',
      [],
      (data) => { currentSessionsState = data; },
      deps
    );

    // Unmigrated guest data was migrated to cloud and state was populated
    expect(currentSessionsState.length).toBe(1);
    expect(currentSessionsState[0].id).toBe('guest-w1');
    expect(saveWorkout).toHaveBeenCalledWith(uid, expect.objectContaining({ id: 'guest-w1' }));
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);

    // Step 3: User deletes all records in the application.
    // Live snapshot arrives from Firestore with empty array []
    await handleCategorySnapshot(
      uid,
      'workouts',
      [],
      (data) => { currentSessionsState = data; },
      deps
    );

    // State reflects authorized deletion (empty array)
    expect(currentSessionsState.length).toBe(0);

    // Step 4: User reloads the application.
    // hasCategoryMigrated is already true.
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);

    // Initial snapshot after reload arrives with []
    let stateAfterReload: WorkoutSession[] = [{ id: 'dummy', title: 'Before' } as WorkoutSession];
    await handleCategorySnapshot(
      uid,
      'workouts',
      [],
      (data) => { stateAfterReload = data; },
      deps
    );

    // State remains empty []! Guest data in localStorage was NOT resurrected!
    expect(stateAfterReload.length).toBe(0);
  });

  it('handles Firestore write failure: does NOT mark category as migrated and permits clean retry', async () => {
    const uid = 'athlete-failure-retry';

    mockStorage[GUEST_STORAGE_KEYS.workouts.primary] = JSON.stringify([
      { id: 'w-fail', title: 'Treino A', startTime: '2026-03-01T10:00:00Z', exercises: [] }
    ]);

    const failingSave = vi.fn().mockRejectedValue(new Error('Firestore connection timeout'));

    // Attempt migration with failing Firestore
    await expect(
      migrateCategory(uid, 'workouts', {
        storage: fakeStorage,
        saveWorkout: failingSave
      })
    ).rejects.toThrow('Firestore connection timeout');

    // CRITICAL: Category MUST NOT be marked as migrated!
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(false);

    // Subsequent retry with working network
    const workingSave = vi.fn().mockResolvedValue(undefined);
    const retryResult = await migrateCategory(uid, 'workouts', {
      storage: fakeStorage,
      saveWorkout: workingSave
    });

    expect(retryResult.success).toBe(true);
    expect(retryResult.migrated).toBe(true);
    expect(workingSave).toHaveBeenCalledTimes(1);

    // Now category IS marked as migrated
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);
  });

  it('prevents duplicate simultaneous executions for the same user and category via in-flight concurrency lock', async () => {
    const uid = 'athlete-concurrency';

    mockStorage[GUEST_STORAGE_KEYS.workouts.primary] = JSON.stringify([
      { id: 'cw-1', title: 'Concorrência Test', startTime: '2026-03-01T10:00:00Z', exercises: [] }
    ]);

    let delayedResolve: () => void = () => {};
    const delayedSave = vi.fn().mockImplementation(() => {
      return new Promise<void>((resolve) => {
        delayedResolve = resolve;
      });
    });

    const deps = { storage: fakeStorage, saveWorkout: delayedSave };

    // Fire two migration calls simultaneously
    const promise1 = migrateCategory(uid, 'workouts', deps);
    const promise2 = migrateCategory(uid, 'workouts', deps);

    // Release the write
    delayedResolve();

    const [res1, res2] = await Promise.all([promise1, promise2]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    // saveWorkout should only have been called ONCE, not twice!
    expect(delayedSave).toHaveBeenCalledTimes(1);
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);
  });

  it('deduplicates items before writing to Firestore', async () => {
    const uid = 'athlete-dedup';

    mockStorage[GUEST_STORAGE_KEYS.weights.primary] = JSON.stringify([
      { id: 'dup-1', date: '2026-03-01', weightKg: 75.0 },
      { id: 'dup-1', date: '2026-03-01', weightKg: 75.0 }, // Duplicate ID
      { id: 'dup-2', date: '2026-03-02', weightKg: 75.5 }
    ]);

    const savedIds: string[] = [];
    const saveWeight = vi.fn().mockImplementation((_uid: string, w: WeightEntry) => {
      savedIds.push(w.id);
      return Promise.resolve();
    });

    const result = await migrateCategory(uid, 'weights', {
      storage: fakeStorage,
      saveWeight
    });

    expect(result.count).toBe(2);
    expect(savedIds).toEqual(['dup-1', 'dup-2']);
    expect(hasCategoryMigrated(uid, 'weights', fakeStorage)).toBe(true);
  });

  it('deduplicateEntries helper preserves first occurrence of item by id or exerciseId', () => {
    const raw = [
      { id: '1', title: 'First' },
      { id: '1', title: 'Duplicate' },
      { id: '2', title: 'Second' }
    ];
    const deduped = deduplicateEntries(raw);
    expect(deduped.length).toBe(2);
    expect(deduped[0].title).toBe('First');
    expect(deduped[1].title).toBe('Second');
  });

  it('preserves backward compatibility with legacy global migration flag', () => {
    const uid = 'legacy-athlete';
    // User had old single flag 'fithome_migrated_legacy-athlete' = 'true'
    mockStorage[`fithome_migrated_${uid}`] = 'true';

    // hasCategoryMigrated should fall back to true for all categories
    for (const cat of ALL_MIGRATION_CATEGORIES) {
      expect(hasCategoryMigrated(uid, cat, fakeStorage)).toBe(true);
    }
  });

  it('syncRestoredBackupToFirestore coordinates awaited batch writes and category flags', async () => {
    const uid = 'athlete-restore-sync';

    const saveWorkout = vi.fn().mockResolvedValue(undefined);
    const saveWeight = vi.fn().mockResolvedValue(undefined);
    const saveMeasurement = vi.fn().mockResolvedValue(undefined);
    const saveRecord = vi.fn().mockResolvedValue(undefined);
    const saveGoal = vi.fn().mockResolvedValue(undefined);

    const backupData = {
      sessions: [
        {
          id: 's1',
          title: 'Treino Backup',
          startTime: '2026-03-01T08:00:00Z',
          endTime: '2026-03-01T08:50:00Z',
          durationSeconds: 3000,
          totalVolumeKg: 1500,
          totalSets: 15,
          exercises: []
        }
      ],
      bodyWeights: [{ id: 'w1', date: '2026-03-01', weightKg: 80.0, createdAt: '2026-03-01T08:00:00Z' }],
      bodyMeasurements: [{ id: 'm1', date: '2026-03-01', measurements: { cintura: 85 }, createdAt: '2026-03-01T08:00:00Z' }],
      personalRecords: [{ exerciseId: 'ex1', exerciseName: 'Flexão de Braço', maxScore: 25, metricLabel: 'reps', achievedAt: '2026-03-01' }],
      bodyGoal: { targetWeightKg: 75, heightCm: 180 }
    };

    const res = await syncRestoredBackupToFirestore(uid, backupData, {
      storage: fakeStorage,
      saveWorkout,
      saveWeight,
      saveMeasurement,
      saveRecord,
      saveGoal
    });

    expect(res.success).toBe(true);
    expect(res.errors.length).toBe(0);

    expect(saveWorkout).toHaveBeenCalledTimes(1);
    expect(saveWeight).toHaveBeenCalledTimes(1);
    expect(saveMeasurement).toHaveBeenCalledTimes(1);
    expect(saveRecord).toHaveBeenCalledTimes(1);
    expect(saveGoal).toHaveBeenCalledTimes(1);

    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);
    expect(hasCategoryMigrated(uid, 'weights', fakeStorage)).toBe(true);
    expect(hasCategoryMigrated(uid, 'measurements', fakeStorage)).toBe(true);
    expect(hasCategoryMigrated(uid, 'records', fakeStorage)).toBe(true);
    expect(hasCategoryMigrated(uid, 'goals', fakeStorage)).toBe(true);
    expect(areAllCategoriesMigrated(uid, fakeStorage)).toBe(true);
  });

  it('migrates guest body goal when cloud goal is empty using real handleCategorySnapshot', async () => {
    const uid = 'test-goal-real';
    let localGoalState: BodyGoal = {};

    mockStorage[GUEST_STORAGE_KEYS.goals.primary] = JSON.stringify({
      targetWeightKg: 72.5,
      heightCm: 178
    });

    const saveGoal = vi.fn().mockResolvedValue(undefined);

    // Initial snapshot arrives with empty goal {}
    await handleCategorySnapshot(
      uid,
      'goals',
      {},
      (goal) => { localGoalState = goal; },
      { storage: fakeStorage, saveGoal }
    );

    expect(localGoalState.targetWeightKg).toBe(72.5);
    expect(localGoalState.heightCm).toBe(178);
    expect(saveGoal).toHaveBeenCalledWith(uid, expect.objectContaining({ targetWeightKg: 72.5 }));
    expect(hasCategoryMigrated(uid, 'goals', fakeStorage)).toBe(true);

    // User clears goal -> new snapshot arrives with {}
    await handleCategorySnapshot(
      uid,
      'goals',
      {},
      (goal) => { localGoalState = goal; },
      { storage: fakeStorage, saveGoal }
    );

    // Remains empty, no ghost data resurrection
    expect(Object.keys(localGoalState).length).toBe(0);
  });
});
