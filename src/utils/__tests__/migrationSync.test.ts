import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasCategoryMigrated,
  markCategoryMigrated,
  resetCategoryMigration,
  areAllCategoriesMigrated,
  getCategoryMigrationKey,
  ALL_MIGRATION_CATEGORIES,
  MigrationCategory
} from '../migrationUtils';

describe('Migration and Sync State Logic (Per-Category Independent Control)', () => {
  // In-memory mock storage adhering to Web Storage API
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

  it('tracks migration independently per category: completing weights does NOT block workouts or measurements', () => {
    const uid = 'athlete-abc';

    // Initially none are migrated
    expect(hasCategoryMigrated(uid, 'weights', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'measurements', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'records', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'goals', fakeStorage)).toBe(false);
    expect(areAllCategoriesMigrated(uid, fakeStorage)).toBe(false);

    // Mark weights migrated
    markCategoryMigrated(uid, 'weights', fakeStorage);

    // Only weights should be marked as migrated
    expect(hasCategoryMigrated(uid, 'weights', fakeStorage)).toBe(true);
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'measurements', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'records', fakeStorage)).toBe(false);
    expect(hasCategoryMigrated(uid, 'goals', fakeStorage)).toBe(false);
    expect(areAllCategoriesMigrated(uid, fakeStorage)).toBe(false);

    // Mark the rest step by step
    markCategoryMigrated(uid, 'workouts', fakeStorage);
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);
    expect(areAllCategoriesMigrated(uid, fakeStorage)).toBe(false);

    markCategoryMigrated(uid, 'measurements', fakeStorage);
    markCategoryMigrated(uid, 'records', fakeStorage);
    markCategoryMigrated(uid, 'goals', fakeStorage);

    expect(areAllCategoriesMigrated(uid, fakeStorage)).toBe(true);
  });

  it('supports resetCategoryMigration for debugging and testing', () => {
    const uid = 'athlete-reset';
    markCategoryMigrated(uid, 'workouts', fakeStorage);
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);

    resetCategoryMigration(uid, 'workouts', fakeStorage);
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(false);
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

  it('enforces isolation between different user IDs', () => {
    const uid1 = 'user-alpha';
    const uid2 = 'user-beta';

    markCategoryMigrated(uid1, 'workouts', fakeStorage);

    expect(hasCategoryMigrated(uid1, 'workouts', fakeStorage)).toBe(true);
    expect(hasCategoryMigrated(uid2, 'workouts', fakeStorage)).toBe(false);
  });

  it('guarantees the sequence: login -> sync -> delete all records -> empty snapshot -> reload without resurrecting deleted data', () => {
    const uid = 'test-athlete-lifecycle';
    let localSessions: Array<{ id: string; name: string }> = [];

    // Step 1: User has guest sessions in local storage before login
    mockStorage['fithome_guest_user_sessions'] = JSON.stringify([{ id: 'guest-1', name: 'Treino Convidado' }]);
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(false);

    // Step 2: User logs in. Initial snapshot arrives from Firestore (remote is empty)
    let isInitialSnapshot = true;
    const remoteWorkouts: Array<{ id: string; name: string }> = [];

    const handleWorkoutSnapshot = (remote: Array<{ id: string; name: string }>) => {
      const isMigrated = hasCategoryMigrated(uid, 'workouts', fakeStorage);

      if (remote && remote.length > 0) {
        localSessions = remote;
        markCategoryMigrated(uid, 'workouts', fakeStorage);
      } else if (!isMigrated && isInitialSnapshot) {
        // Initial migration from guest data
        const guestData = mockStorage['fithome_guest_user_sessions'];
        if (guestData) {
          const parsed = JSON.parse(guestData);
          localSessions = parsed;
          // In real application, saves to Firestore collection
        }
        markCategoryMigrated(uid, 'workouts', fakeStorage);
      } else {
        // Authorized empty state (records were cleared by user)
        localSessions = [];
      }
      isInitialSnapshot = false;
    };

    // First snapshot triggers migration of guest data
    handleWorkoutSnapshot(remoteWorkouts);
    expect(localSessions.length).toBe(1);
    expect(localSessions[0].id).toBe('guest-1');
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);

    // Step 3: User deletes all records in the app
    // Firestore fires a new live snapshot with empty array []
    handleWorkoutSnapshot([]);

    // Step 4: Callback runs on empty snapshot. Must NOT re-inject guest sessions!
    expect(localSessions.length).toBe(0);

    // Step 5: User reloads the page. hasCategoryMigrated is already true.
    isInitialSnapshot = true;
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);

    // Initial snapshot after reload arrives with []
    handleWorkoutSnapshot([]);
    expect(localSessions.length).toBe(0); // STILL EMPTY! No ghost data resurrection!
  });

  it('guarantees that remote existing weights do NOT block empty workouts from migrating guest workouts', () => {
    const uid = 'test-cross-category';
    let localWeights: Array<{ id: string; weightKg: number }> = [];
    let localWorkouts: Array<{ id: string; title: string }> = [];

    // Guest has both weights and workouts stored
    mockStorage['fithome_guest_body_weights_v1'] = JSON.stringify([{ id: 'gw-1', weightKg: 80 }]);
    mockStorage['fithome_guest_user_sessions'] = JSON.stringify([{ id: 'gs-1', title: 'Treino A' }]);

    // Simulated cloud: Remote weights has records, remote workouts is EMPTY
    const remoteWeights = [{ id: 'rw-1', weightKg: 81 }];
    const remoteWorkouts: Array<{ id: string; title: string }> = [];

    // Weights snapshot fires first
    const handleWeightsSnapshot = (remote: typeof remoteWeights) => {
      const isMigrated = hasCategoryMigrated(uid, 'weights', fakeStorage);
      if (remote && remote.length > 0) {
        localWeights = remote;
        markCategoryMigrated(uid, 'weights', fakeStorage);
      } else if (!isMigrated) {
        localWeights = JSON.parse(mockStorage['fithome_guest_body_weights_v1'] || '[]');
        markCategoryMigrated(uid, 'weights', fakeStorage);
      }
    };

    // Workouts snapshot fires second
    const handleWorkoutsSnapshot = (remote: typeof remoteWorkouts) => {
      const isMigrated = hasCategoryMigrated(uid, 'workouts', fakeStorage);
      if (remote && remote.length > 0) {
        localWorkouts = remote;
        markCategoryMigrated(uid, 'workouts', fakeStorage);
      } else if (!isMigrated) {
        localWorkouts = JSON.parse(mockStorage['fithome_guest_user_sessions'] || '[]');
        markCategoryMigrated(uid, 'workouts', fakeStorage);
      }
    };

    // 1. Process weights snapshot
    handleWeightsSnapshot(remoteWeights);
    expect(localWeights.length).toBe(1);
    expect(localWeights[0].id).toBe('rw-1');
    expect(hasCategoryMigrated(uid, 'weights', fakeStorage)).toBe(true);

    // 2. Crucial test: Workouts MUST still be unmigrated!
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(false);

    // 3. Process workouts snapshot with empty cloud
    handleWorkoutsSnapshot(remoteWorkouts);
    // Workouts successfully migrated from guest sessions!
    expect(localWorkouts.length).toBe(1);
    expect(localWorkouts[0].id).toBe('gs-1');
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);
  });

  it('migrates guest body goal when cloud goal is empty', () => {
    const uid = 'test-goal-migration';
    let localGoal: Record<string, unknown> = {};

    mockStorage['fithome_guest_body_goal_v1'] = JSON.stringify({
      targetWeightKg: 75,
      heightCm: 180
    });

    const handleGoalSnapshot = (remoteGoal: Record<string, unknown>) => {
      const isMigrated = hasCategoryMigrated(uid, 'goals', fakeStorage);
      const hasRemoteGoal = remoteGoal && Object.keys(remoteGoal).length > 0;

      if (hasRemoteGoal) {
        localGoal = remoteGoal;
        markCategoryMigrated(uid, 'goals', fakeStorage);
      } else if (!isMigrated) {
        const guestGoal = mockStorage['fithome_guest_body_goal_v1'];
        if (guestGoal) {
          localGoal = JSON.parse(guestGoal);
        }
        markCategoryMigrated(uid, 'goals', fakeStorage);
      } else {
        localGoal = {};
      }
    };

    // Cloud goal is empty {}
    handleGoalSnapshot({});
    expect(localGoal.targetWeightKg).toBe(75);
    expect(localGoal.heightCm).toBe(180);
    expect(hasCategoryMigrated(uid, 'goals', fakeStorage)).toBe(true);

    // Next time empty goal arrives (e.g. user cleared goal), stays empty
    handleGoalSnapshot({});
    expect(Object.keys(localGoal).length).toBe(0);
  });
});
