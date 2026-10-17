import {
  MigrationCategory,
  hasCategoryMigrated,
  markCategoryMigrated,
  ALL_MIGRATION_CATEGORIES
} from '../utils/migrationUtils';
import { WorkoutSession, PersonalRecord } from '../types/workout';
import { WeightEntry, MeasurementEntry, BodyGoal } from '../types/bodyEvolution';
import {
  saveUserWorkoutToFirestore,
  saveUserWeightToFirestore,
  saveUserMeasurementToFirestore,
  saveUserRecordToFirestore,
  saveUserGoalToFirestore
} from '../lib/firestoreService';

export interface MigrationDeps {
  storage?: Storage;
  saveWorkout?: (userId: string, workout: WorkoutSession) => Promise<void>;
  saveWeight?: (userId: string, weight: WeightEntry) => Promise<void>;
  saveMeasurement?: (userId: string, measurement: MeasurementEntry) => Promise<void>;
  saveRecord?: (userId: string, record: PersonalRecord) => Promise<void>;
  saveGoal?: (userId: string, goal: BodyGoal) => Promise<void>;
}

export interface MigrationResult<T = unknown> {
  success: boolean;
  category: MigrationCategory;
  migrated: boolean;
  count: number;
  data?: T;
  error?: unknown;
}

export const GUEST_STORAGE_KEYS: Record<MigrationCategory, { primary: string; fallback: string }> = {
  workouts: {
    primary: 'fithome_guest_user_sessions',
    fallback: 'fithome_user_sessions'
  },
  weights: {
    primary: 'fithome_guest_body_weights_v1',
    fallback: 'fithome_body_weights_v1'
  },
  measurements: {
    primary: 'fithome_guest_body_measurements_v1',
    fallback: 'fithome_body_measurements_v1'
  },
  records: {
    primary: 'fithome_guest_user_prs',
    fallback: 'fithome_user_prs'
  },
  goals: {
    primary: 'fithome_guest_body_goal_v1',
    fallback: 'fithome_body_goal_v1'
  }
};

// In-flight concurrency registry to prevent duplicate simultaneous executions
const inFlightMigrations = new Map<string, Promise<MigrationResult>>();

export function getInFlightKey(uid: string, category: MigrationCategory): string {
  return `${uid}:${category}`;
}

export function clearInFlightMigrations(): void {
  inFlightMigrations.clear();
}

export function isMigrationInFlight(uid: string, category: MigrationCategory): boolean {
  return inFlightMigrations.has(getInFlightKey(uid, category));
}

/**
 * Deduplicates an array of items by their unique identifier (id or exerciseId).
 * Preserves the first occurrence.
 */
export function deduplicateEntries<T extends { id?: string; exerciseId?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    if (!item) continue;
    const key = item.id || item.exerciseId;
    if (key) {
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    } else {
      result.push(item);
    }
  }

  return result;
}

/**
 * Checks if a goal object has at least one valid tracked metric.
 */
export function hasGoalContent(goal: unknown): goal is BodyGoal {
  if (!goal || typeof goal !== 'object') return false;
  const g = goal as BodyGoal;
  return (
    g.targetWeightKg !== undefined ||
    g.customInitialWeightKg !== undefined ||
    g.heightCm !== undefined
  );
}

/**
 * Migrates a single category from guest localStorage to Firestore.
 * 
 * Guarantees:
 * 1. Independent per-category migration.
 * 2. In-flight concurrency locking prevents duplicate simultaneous calls.
 * 3. Deduplication of items before writes.
 * 4. Awaits all Firestore writes with Promise.all before calling markCategoryMigrated.
 * 5. On write error: does NOT mark category as migrated, releases lock, and throws error so retry is permitted.
 */
export async function migrateCategory(
  userId: string,
  category: MigrationCategory,
  deps: MigrationDeps = {}
): Promise<MigrationResult> {
  if (!userId) {
    throw new Error('User ID is required for migration.');
  }

  const storage = deps.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!storage) {
    throw new Error('Storage is not available for migration.');
  }

  // 1. Check if category is already migrated
  if (hasCategoryMigrated(userId, category, storage)) {
    return {
      success: true,
      category,
      migrated: false,
      count: 0
    };
  }

  // 2. Concurrency Lock: Return existing in-flight promise if already migrating
  const lockKey = getInFlightKey(userId, category);
  const activePromise = inFlightMigrations.get(lockKey);
  if (activePromise) {
    return activePromise;
  }

  const migrationExecution = (async (): Promise<MigrationResult> => {
    try {
      const keys = GUEST_STORAGE_KEYS[category];
      const rawData = storage.getItem(keys.primary) || storage.getItem(keys.fallback);

      if (category === 'goals') {
        let goalData: BodyGoal | null = null;
        if (rawData) {
          try {
            const parsed = JSON.parse(rawData);
            if (hasGoalContent(parsed)) {
              goalData = parsed;
            }
          } catch {
            // invalid JSON, ignore
          }
        }

        if (goalData) {
          const saveGoal = deps.saveGoal || saveUserGoalToFirestore;
          await saveGoal(userId, goalData);
        }

        // Mark category migrated only after successful write
        markCategoryMigrated(userId, 'goals', storage);
        return {
          success: true,
          category: 'goals',
          migrated: true,
          count: goalData ? 1 : 0,
          data: goalData || {}
        };
      }

      // Array categories: workouts, weights, measurements, records
      let items: unknown[] = [];
      if (rawData) {
        try {
          const parsed = JSON.parse(rawData);
          if (Array.isArray(parsed)) {
            items = parsed;
          }
        } catch {
          // invalid JSON, ignore
        }
      }

      if (items.length === 0) {
        // No guest items to migrate; mark category migrated so future checks don't search localStorage
        markCategoryMigrated(userId, category, storage);
        return {
          success: true,
          category,
          migrated: true,
          count: 0,
          data: []
        };
      }

      // Deduplicate before saving
      const deduped = deduplicateEntries(items as { id?: string; exerciseId?: string }[]);

      if (category === 'workouts') {
        const save = deps.saveWorkout || saveUserWorkoutToFirestore;
        await Promise.all(deduped.map(item => save(userId, item as WorkoutSession)));
      } else if (category === 'weights') {
        const save = deps.saveWeight || saveUserWeightToFirestore;
        await Promise.all(deduped.map(item => save(userId, item as WeightEntry)));
      } else if (category === 'measurements') {
        const save = deps.saveMeasurement || saveUserMeasurementToFirestore;
        await Promise.all(deduped.map(item => save(userId, item as MeasurementEntry)));
      } else if (category === 'records') {
        const save = deps.saveRecord || saveUserRecordToFirestore;
        await Promise.all(deduped.map(item => save(userId, item as PersonalRecord)));
      }

      // Mark category as migrated ONLY after all writes have completed successfully
      markCategoryMigrated(userId, category, storage);

      return {
        success: true,
        category,
        migrated: true,
        count: deduped.length,
        data: deduped
      };
    } catch (error) {
      console.error(`[MigrationService] Failed to migrate category '${category}' for user '${userId}':`, error);
      // DO NOT mark category as migrated!
      throw error;
    } finally {
      inFlightMigrations.delete(lockKey);
    }
  })();

  inFlightMigrations.set(lockKey, migrationExecution);
  return migrationExecution;
}

/**
 * Handles live snapshot updates from Firestore, coordinating migration when remote data is empty.
 * 
 * Rules:
 * 1. If remote data is non-empty: sets data and marks category migrated.
 * 2. If remote data is empty and category was already migrated: sets empty state (does NOT resurrect deleted data).
 * 3. If remote data is empty and category was NOT migrated: triggers migrateCategory.
 * 4. If migration fails: keeps state empty/safe without setting the migrated flag, allowing subsequent retry.
 */
export async function handleCategorySnapshot<T>(
  userId: string,
  category: MigrationCategory,
  remoteData: T,
  onData: (data: T) => void,
  deps: MigrationDeps = {}
): Promise<void> {
  const storage = deps.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!storage) {
    onData(remoteData);
    return;
  }

  if (category === 'goals') {
    const isRemoteValid = hasGoalContent(remoteData);
    if (isRemoteValid) {
      onData(remoteData);
      markCategoryMigrated(userId, 'goals', storage);
      return;
    }

    const isMigrated = hasCategoryMigrated(userId, 'goals', storage);
    if (isMigrated) {
      // Authorized empty state (goal cleared by user)
      onData({} as unknown as T);
      return;
    }

    try {
      const result = await migrateCategory(userId, 'goals', deps);
      if (result.migrated && result.data && hasGoalContent(result.data)) {
        onData(result.data as unknown as T);
      } else {
        onData({} as unknown as T);
      }
    } catch {
      onData({} as unknown as T);
    }
    return;
  }

  // Array categories
  const isRemotePopulated = Array.isArray(remoteData) && remoteData.length > 0;
  if (isRemotePopulated) {
    onData(remoteData);
    markCategoryMigrated(userId, category, storage);
    return;
  }

  const isMigrated = hasCategoryMigrated(userId, category, storage);
  if (isMigrated) {
    // Authorized empty state (user cleared collection)
    onData([] as unknown as T);
    return;
  }

  try {
    const result = await migrateCategory(userId, category, deps);
    if (result.migrated && Array.isArray(result.data) && result.data.length > 0) {
      onData(result.data as unknown as T);
    } else {
      onData([] as unknown as T);
    }
  } catch {
    // Migration write failed: do not mark category, set empty in UI for now, allowing future retry
    onData([] as unknown as T);
  }
}

/**
 * Synchronizes restored backup data directly to Firestore for an authenticated user.
 * Awaits all category writes and marks categories as migrated once successfully written.
 */
export async function syncRestoredBackupToFirestore(
  userId: string,
  backupData: {
    sessions?: WorkoutSession[];
    personalRecords?: PersonalRecord[];
    bodyWeights?: WeightEntry[];
    bodyMeasurements?: MeasurementEntry[];
    bodyGoal?: BodyGoal;
  },
  deps: MigrationDeps = {}
): Promise<{ success: boolean; errors: string[] }> {
  const storage = deps.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  const errors: string[] = [];

  if (!userId) {
    return { success: false, errors: ['User ID is required.'] };
  }

  // 1. Workouts
  if (backupData.sessions && backupData.sessions.length > 0) {
    try {
      const deduped = deduplicateEntries(backupData.sessions);
      const save = deps.saveWorkout || saveUserWorkoutToFirestore;
      await Promise.all(deduped.map(s => save(userId, s)));
      if (storage) markCategoryMigrated(userId, 'workouts', storage);
    } catch (err) {
      errors.push(`Treinos: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 2. Weights
  if (backupData.bodyWeights && backupData.bodyWeights.length > 0) {
    try {
      const deduped = deduplicateEntries(backupData.bodyWeights);
      const save = deps.saveWeight || saveUserWeightToFirestore;
      await Promise.all(deduped.map(w => save(userId, w)));
      if (storage) markCategoryMigrated(userId, 'weights', storage);
    } catch (err) {
      errors.push(`Pesos: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 3. Measurements
  if (backupData.bodyMeasurements && backupData.bodyMeasurements.length > 0) {
    try {
      const deduped = deduplicateEntries(backupData.bodyMeasurements);
      const save = deps.saveMeasurement || saveUserMeasurementToFirestore;
      await Promise.all(deduped.map(m => save(userId, m)));
      if (storage) markCategoryMigrated(userId, 'measurements', storage);
    } catch (err) {
      errors.push(`Medidas: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 4. Records
  if (backupData.personalRecords && backupData.personalRecords.length > 0) {
    try {
      const deduped = deduplicateEntries(backupData.personalRecords);
      const save = deps.saveRecord || saveUserRecordToFirestore;
      await Promise.all(deduped.map(r => save(userId, r)));
      if (storage) markCategoryMigrated(userId, 'records', storage);
    } catch (err) {
      errors.push(`Recordes: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 5. Goal
  if (backupData.bodyGoal && hasGoalContent(backupData.bodyGoal)) {
    try {
      const save = deps.saveGoal || saveUserGoalToFirestore;
      await save(userId, backupData.bodyGoal);
      if (storage) markCategoryMigrated(userId, 'goals', storage);
    } catch (err) {
      errors.push(`Metas: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}
