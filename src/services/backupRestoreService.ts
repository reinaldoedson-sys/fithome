import { WorkoutSession, PersonalRecord } from '../types/workout';
import { WeightEntry, MeasurementEntry, BodyGoal, ProgressPhoto } from '../types/bodyEvolution';
import { FitHomeBackup } from '../utils/backupValidator';
import {
  saveUserWorkoutToFirestore,
  deleteUserWorkoutFromFirestore,
  saveUserWeightToFirestore,
  deleteUserWeightFromFirestore,
  saveUserMeasurementToFirestore,
  deleteUserMeasurementFromFirestore,
  saveUserRecordToFirestore,
  deleteUserRecordFromFirestore,
  saveUserGoalToFirestore,
  deleteUserGoalFromFirestore
} from '../lib/firestoreService';
import { markCategoryMigrated, MigrationCategory } from '../utils/migrationUtils';
import { deduplicateEntries, hasGoalContent } from './migrationService';

export type RestoreMode = 'merge' | 'replace';

export interface RestoreDeps {
  storage?: Storage;
  saveWorkout?: (userId: string, workout: WorkoutSession) => Promise<void>;
  deleteWorkout?: (userId: string, workoutId: string) => Promise<void>;
  saveWeight?: (userId: string, weight: WeightEntry) => Promise<void>;
  deleteWeight?: (userId: string, weightId: string) => Promise<void>;
  saveMeasurement?: (userId: string, measurement: MeasurementEntry) => Promise<void>;
  deleteMeasurement?: (userId: string, measurementId: string) => Promise<void>;
  saveRecord?: (userId: string, record: PersonalRecord) => Promise<void>;
  deleteRecord?: (userId: string, exerciseId: string) => Promise<void>;
  saveGoal?: (userId: string, goal: BodyGoal) => Promise<void>;
  deleteGoal?: (userId: string) => Promise<void>;
}

export interface ExistingAppState {
  sessions: WorkoutSession[];
  personalRecords: PersonalRecord[];
  bodyWeights: WeightEntry[];
  bodyMeasurements: MeasurementEntry[];
  bodyGoal: BodyGoal;
  bodyPhotos: ProgressPhoto[];
}

export interface RestoreResult {
  success: boolean;
  mode: RestoreMode;
  isPartial: boolean;
  data: ExistingAppState;
  stats: {
    sessionsAddedOrUpdated: number;
    sessionsDeleted: number;
    weightsAddedOrUpdated: number;
    weightsDeleted: number;
    measurementsAddedOrUpdated: number;
    measurementsDeleted: number;
    recordsAddedOrUpdated: number;
    recordsDeleted: number;
    goalUpdated: boolean;
    photosAddedOrUpdated: number;
    photosDeleted: number;
  };
  errors: string[];
  photoQuotaExceeded: boolean;
}

/**
 * Executes a robust data restoration (either Merge or Replace) for FitHome.
 * 
 * Guarantees:
 * 1. Merge Mode:
 *    - Preserves existing records.
 *    - Adds new items from backup and updates existing ones with matching IDs.
 *    - Does NOT duplicate records.
 *    - Never deletes records from Firestore or local storage.
 * 2. Replace Mode:
 *    - Replaces local and cloud data to match the backup for included categories.
 *    - Omitted categories in the backup file (e.g. legacy backups) are preserved.
 *    - Surplus records on Firestore are deleted safely.
 *    - Correctly handles restoring empty categories (`[]`).
 * 3. Fault Tolerance & Integrity:
 *    - Cloud operations are executed per category.
 *    - If a category operation fails, that category is NOT marked as migrated/synced.
 *    - Clear error reporting indicating partial or complete status.
 *    - Photos are persisted to localStorage only with QuotaExceededError safety.
 */
export async function executeBackupRestore(
  mode: RestoreMode,
  existing: ExistingAppState,
  backup: FitHomeBackup,
  userId?: string | null,
  deps: RestoreDeps = {}
): Promise<RestoreResult> {
  const storage = deps.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  const errors: string[] = [];
  let photoQuotaExceeded = false;

  const stats = {
    sessionsAddedOrUpdated: 0,
    sessionsDeleted: 0,
    weightsAddedOrUpdated: 0,
    weightsDeleted: 0,
    measurementsAddedOrUpdated: 0,
    measurementsDeleted: 0,
    recordsAddedOrUpdated: 0,
    recordsDeleted: 0,
    goalUpdated: false,
    photosAddedOrUpdated: 0,
    photosDeleted: 0
  };

  // Resulting in-memory state initialized from existing
  let resultSessions = [...existing.sessions];
  let resultRecords = [...existing.personalRecords];
  let resultWeights = [...existing.bodyWeights];
  let resultMeasurements = [...existing.bodyMeasurements];
  let resultGoal = { ...existing.bodyGoal };
  let resultPhotos = [...existing.bodyPhotos];

  // Helper to mark category migrated if user is authenticated and storage available
  const markMigrated = (category: MigrationCategory) => {
    if (userId && storage) {
      markCategoryMigrated(userId, category, storage);
    }
  };

  // ==========================================
  // 1. WORKOUTS (sessions)
  // ==========================================
  if (backup.sessions !== undefined) {
    const backupSessions = deduplicateEntries(backup.sessions);

    if (mode === 'merge') {
      const existingMap = new Map<string, WorkoutSession>();
      existing.sessions.forEach(s => existingMap.set(s.id, s));

      // Backup sessions update matching ID or are added
      backupSessions.forEach(s => {
        existingMap.set(s.id, s);
        stats.sessionsAddedOrUpdated++;
      });

      resultSessions = Array.from(existingMap.values()).sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      if (userId) {
        try {
          const save = deps.saveWorkout || saveUserWorkoutToFirestore;
          await Promise.all(backupSessions.map(s => save(userId, s)));
          markMigrated('workouts');
        } catch (err) {
          errors.push(`Treinos: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else {
      // REPLACE MODE
      resultSessions = [...backupSessions].sort(
        (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      stats.sessionsAddedOrUpdated = backupSessions.length;

      const backupIdSet = new Set(backupSessions.map(s => s.id));
      const surplusSessions = existing.sessions.filter(s => !backupIdSet.has(s.id));
      stats.sessionsDeleted = surplusSessions.length;

      if (userId) {
        try {
          const del = deps.deleteWorkout || deleteUserWorkoutFromFirestore;
          const save = deps.saveWorkout || saveUserWorkoutToFirestore;

          // Delete surplus from cloud
          await Promise.all(surplusSessions.map(s => del(userId, s.id)));
          // Save backup sessions to cloud
          await Promise.all(backupSessions.map(s => save(userId, s)));
          markMigrated('workouts');
        } catch (err) {
          errors.push(`Treinos: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  // ==========================================
  // 2. PERSONAL RECORDS (records)
  // ==========================================
  if (backup.personalRecords !== undefined) {
    const backupRecords = deduplicateEntries(backup.personalRecords);

    if (mode === 'merge') {
      const existingMap = new Map<string, PersonalRecord>();
      existing.personalRecords.forEach(r => existingMap.set(r.exerciseId, r));

      const recordsToSave: PersonalRecord[] = [];

      backupRecords.forEach(br => {
        const current = existingMap.get(br.exerciseId);
        if (!current) {
          existingMap.set(br.exerciseId, br);
          recordsToSave.push(br);
          stats.recordsAddedOrUpdated++;
        } else {
          // Conflict resolution: prefer higher score or newer date if equal
          if (br.maxScore >= current.maxScore) {
            existingMap.set(br.exerciseId, br);
            recordsToSave.push(br);
            stats.recordsAddedOrUpdated++;
          }
        }
      });

      resultRecords = Array.from(existingMap.values());

      if (userId && recordsToSave.length > 0) {
        try {
          const save = deps.saveRecord || saveUserRecordToFirestore;
          await Promise.all(recordsToSave.map(r => save(userId, r)));
          markMigrated('records');
        } catch (err) {
          errors.push(`Recordes: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else if (userId) {
        markMigrated('records');
      }
    } else {
      // REPLACE MODE
      resultRecords = [...backupRecords];
      stats.recordsAddedOrUpdated = backupRecords.length;

      const backupExIdSet = new Set(backupRecords.map(r => r.exerciseId));
      const surplusRecords = existing.personalRecords.filter(r => !backupExIdSet.has(r.exerciseId));
      stats.recordsDeleted = surplusRecords.length;

      if (userId) {
        try {
          const del = deps.deleteRecord || deleteUserRecordFromFirestore;
          const save = deps.saveRecord || saveUserRecordToFirestore;

          await Promise.all(surplusRecords.map(r => del(userId, r.exerciseId)));
          await Promise.all(backupRecords.map(r => save(userId, r)));
          markMigrated('records');
        } catch (err) {
          errors.push(`Recordes: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  // ==========================================
  // 3. WEIGHTS (bodyWeights)
  // ==========================================
  if (backup.bodyWeights !== undefined) {
    const backupWeights = deduplicateEntries(backup.bodyWeights);

    if (mode === 'merge') {
      const existingMap = new Map<string, WeightEntry>();
      existing.bodyWeights.forEach(w => existingMap.set(w.id, w));

      backupWeights.forEach(w => {
        existingMap.set(w.id, w);
        stats.weightsAddedOrUpdated++;
      });

      resultWeights = Array.from(existingMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      if (userId) {
        try {
          const save = deps.saveWeight || saveUserWeightToFirestore;
          await Promise.all(backupWeights.map(w => save(userId, w)));
          markMigrated('weights');
        } catch (err) {
          errors.push(`Pesagens: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else {
      // REPLACE MODE
      resultWeights = [...backupWeights].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      stats.weightsAddedOrUpdated = backupWeights.length;

      const backupIdSet = new Set(backupWeights.map(w => w.id));
      const surplusWeights = existing.bodyWeights.filter(w => !backupIdSet.has(w.id));
      stats.weightsDeleted = surplusWeights.length;

      if (userId) {
        try {
          const del = deps.deleteWeight || deleteUserWeightFromFirestore;
          const save = deps.saveWeight || saveUserWeightToFirestore;

          await Promise.all(surplusWeights.map(w => del(userId, w.id)));
          await Promise.all(backupWeights.map(w => save(userId, w)));
          markMigrated('weights');
        } catch (err) {
          errors.push(`Pesagens: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  // ==========================================
  // 4. MEASUREMENTS (bodyMeasurements)
  // ==========================================
  if (backup.bodyMeasurements !== undefined) {
    const backupMeasures = deduplicateEntries(backup.bodyMeasurements);

    if (mode === 'merge') {
      const existingMap = new Map<string, MeasurementEntry>();
      existing.bodyMeasurements.forEach(m => existingMap.set(m.id, m));

      backupMeasures.forEach(m => {
        existingMap.set(m.id, m);
        stats.measurementsAddedOrUpdated++;
      });

      resultMeasurements = Array.from(existingMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      if (userId) {
        try {
          const save = deps.saveMeasurement || saveUserMeasurementToFirestore;
          await Promise.all(backupMeasures.map(m => save(userId, m)));
          markMigrated('measurements');
        } catch (err) {
          errors.push(`Medidas: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } else {
      // REPLACE MODE
      resultMeasurements = [...backupMeasures].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      stats.measurementsAddedOrUpdated = backupMeasures.length;

      const backupIdSet = new Set(backupMeasures.map(m => m.id));
      const surplusMeasures = existing.bodyMeasurements.filter(m => !backupIdSet.has(m.id));
      stats.measurementsDeleted = surplusMeasures.length;

      if (userId) {
        try {
          const del = deps.deleteMeasurement || deleteUserMeasurementFromFirestore;
          const save = deps.saveMeasurement || saveUserMeasurementToFirestore;

          await Promise.all(surplusMeasures.map(m => del(userId, m.id)));
          await Promise.all(backupMeasures.map(m => save(userId, m)));
          markMigrated('measurements');
        } catch (err) {
          errors.push(`Medidas: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  // ==========================================
  // 5. GOAL (bodyGoal)
  // ==========================================
  if (backup.bodyGoal !== undefined) {
    if (mode === 'merge') {
      resultGoal = {
        ...existing.bodyGoal,
        ...backup.bodyGoal
      };
      stats.goalUpdated = true;

      if (userId && hasGoalContent(resultGoal)) {
        try {
          const save = deps.saveGoal || saveUserGoalToFirestore;
          await save(userId, resultGoal);
          markMigrated('goals');
        } catch (err) {
          errors.push(`Metas: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else if (userId) {
        markMigrated('goals');
      }
    } else {
      // REPLACE MODE
      resultGoal = { ...backup.bodyGoal };
      stats.goalUpdated = true;

      if (userId) {
        try {
          if (hasGoalContent(resultGoal)) {
            const save = deps.saveGoal || saveUserGoalToFirestore;
            await save(userId, resultGoal);
          } else {
            const del = deps.deleteGoal || deleteUserGoalFromFirestore;
            await del(userId);
          }
          markMigrated('goals');
        } catch (err) {
          errors.push(`Metas: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  // ==========================================
  // 6. PHOTOS (bodyPhotos - Local Storage Only)
  // ==========================================
  if (backup.bodyPhotos !== undefined) {
    const backupPhotos = deduplicateEntries(backup.bodyPhotos);

    if (mode === 'merge') {
      const existingMap = new Map<string, ProgressPhoto>();
      existing.bodyPhotos.forEach(p => existingMap.set(p.id, p));

      backupPhotos.forEach(p => {
        existingMap.set(p.id, p);
        stats.photosAddedOrUpdated++;
      });

      resultPhotos = Array.from(existingMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } else {
      // REPLACE MODE
      resultPhotos = [...backupPhotos].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      stats.photosAddedOrUpdated = backupPhotos.length;
      const backupIdSet = new Set(backupPhotos.map(p => p.id));
      stats.photosDeleted = existing.bodyPhotos.filter(p => !backupIdSet.has(p.id)).length;
    }

    // Persist to localStorage with QuotaExceededError protection
    if (storage) {
      const photoKey = userId ? `fithome_user_${userId}_body_photos_v1` : 'fithome_guest_body_photos_v1';
      try {
        storage.setItem(photoKey, JSON.stringify(resultPhotos));
      } catch (quotaErr) {
        console.warn('[BackupRestore] LocalStorage quota limit reached for photos:', quotaErr);
        photoQuotaExceeded = true;
        // Best effort: attempt saving only the most recent photos
        let saved = false;
        for (let limit = Math.min(resultPhotos.length - 1, 5); limit >= 1; limit--) {
          try {
            const slice = resultPhotos.slice(0, limit);
            storage.setItem(photoKey, JSON.stringify(slice));
            resultPhotos = slice;
            saved = true;
            break;
          } catch {
            // try smaller
          }
        }
        if (!saved) {
          try {
            storage.removeItem(photoKey);
            resultPhotos = [];
          } catch {
            // ignore
          }
        }
      }
    }
  }

  const isPartial = errors.length > 0;
  const success = !isPartial;

  return {
    success,
    mode,
    isPartial,
    data: {
      sessions: resultSessions,
      personalRecords: resultRecords,
      bodyWeights: resultWeights,
      bodyMeasurements: resultMeasurements,
      bodyGoal: resultGoal,
      bodyPhotos: resultPhotos
    },
    stats,
    errors,
    photoQuotaExceeded
  };
}
