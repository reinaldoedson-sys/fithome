import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeBackupRestore, ExistingAppState } from '../../services/backupRestoreService';
import { validateFitHomeBackup } from '../backupValidator';
import { hasCategoryMigrated } from '../migrationUtils';
import { WorkoutSession, PersonalRecord } from '../../types/workout';
import { WeightEntry, MeasurementEntry, BodyGoal, ProgressPhoto } from '../../types/bodyEvolution';

describe('Production Backup Restoration Logic (Merge, Replace & Failure Protection)', () => {
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

  const createInitialState = (): ExistingAppState => ({
    sessions: [
      {
        id: 's-existing-1',
        title: 'Treino Existente 1',
        startTime: '2026-10-01T10:00:00Z',
        endTime: '2026-10-01T10:45:00Z',
        durationSeconds: 2700,
        totalVolumeKg: 1000,
        totalSets: 10,
        exercises: []
      },
      {
        id: 's-existing-2',
        title: 'Treino Existente 2 (Para Atualizar)',
        startTime: '2026-10-02T10:00:00Z',
        endTime: '2026-10-02T10:45:00Z',
        durationSeconds: 2700,
        totalVolumeKg: 1100,
        totalSets: 10,
        exercises: []
      }
    ],
    personalRecords: [
      {
        exerciseId: 'pushup',
        exerciseName: 'Flexão de Braço',
        maxScore: 20,
        metricLabel: 'reps',
        achievedAt: '2026-10-01'
      },
      {
        exerciseId: 'squat',
        exerciseName: 'Agachamento',
        maxScore: 50,
        metricLabel: 'reps',
        achievedAt: '2026-10-01'
      }
    ],
    bodyWeights: [
      {
        id: 'w-existing-1',
        date: '2026-10-01',
        weightKg: 80.0,
        createdAt: '2026-10-01T08:00:00Z'
      }
    ],
    bodyMeasurements: [
      {
        id: 'm-existing-1',
        date: '2026-10-01',
        measurements: { cintura: 85 },
        createdAt: '2026-10-01T08:00:00Z'
      }
    ],
    bodyGoal: {
      targetWeightKg: 75,
      heightCm: 180
    },
    bodyPhotos: [
      {
        id: 'photo-existing-1',
        date: '2026-10-01',
        photoDataUrl: 'data:image/jpeg;base64,existingPhoto',
        category: 'frente',
        createdAt: '2026-10-01T08:00:00Z'
      }
    ]
  });

  beforeEach(() => {
    mockStorage = {};
    vi.clearAllMocks();
  });

  // 1. Export and reimport realistic backup
  it('1. Exports and reimports a realistic FitHome backup without data loss', async () => {
    const existing = createInitialState();

    // Exported structure matching App.tsx handleExportData
    const exportedBackup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      sessions: existing.sessions,
      personalRecords: existing.personalRecords,
      bodyWeights: existing.bodyWeights,
      bodyMeasurements: existing.bodyMeasurements,
      bodyGoal: existing.bodyGoal,
      bodyPhotos: existing.bodyPhotos
    };

    const json = JSON.stringify(exportedBackup);
    const validation = validateFitHomeBackup(json);
    expect(validation.isValid).toBe(true);

    if (validation.isValid) {
      const res = await executeBackupRestore('replace', existing, validation.data, null, {
        storage: fakeStorage
      });
      expect(res.success).toBe(true);
      expect(res.data.sessions.length).toBe(2);
      expect(res.data.personalRecords.length).toBe(2);
      expect(res.data.bodyWeights.length).toBe(1);
      expect(res.data.bodyMeasurements.length).toBe(1);
      expect(res.data.bodyGoal.targetWeightKg).toBe(75);
    }
  });

  // 2. Import valid legacy backup
  it('2. Imports a valid legacy backup and normalizes fields safely', async () => {
    const existing = createInitialState();
    const legacyBackup = {
      version: '1.0',
      sessions: [
        {
          id: 'legacy-s1',
          date: '2025-05-01T10:00:00Z',
          durationMinutes: 30,
          totalVolumeKg: 500,
          totalReps: 50,
          exercises: []
        }
      ],
      personalRecords: [
        {
          exerciseId: 'dips',
          exerciseName: 'Mergulho em Paralelas',
          maxReps: 15,
          achievedAt: '2025-05-01'
        }
      ],
      bodyWeights: [
        {
          id: 'lw-1',
          date: '2025-05-01',
          weightKg: 83.5
        }
      ]
    };

    const validation = validateFitHomeBackup(legacyBackup);
    expect(validation.isValid).toBe(true);

    if (validation.isValid) {
      const res = await executeBackupRestore('merge', existing, validation.data, null, {
        storage: fakeStorage
      });
      expect(res.success).toBe(true);
      // Merged: 2 existing + 1 legacy = 3 sessions
      expect(res.data.sessions.length).toBe(3);
      // Legacy session has normalized durationSeconds (30 * 60 = 1800)
      const restoredLegacySession = res.data.sessions.find(s => s.id === 'legacy-s1');
      expect(restoredLegacySession?.durationSeconds).toBe(1800);

      // Legacy PR added with maxScore = 15
      const restoredPR = res.data.personalRecords.find(r => r.exerciseId === 'dips');
      expect(restoredPR?.maxScore).toBe(15);
      expect(restoredPR?.metricLabel).toBe('reps');
    }
  });

  // 3. Reject malformed exercise or set
  it('3. Rejects malformed exercises or sets with detailed error messages', () => {
    const backupWithBadSet = {
      sessions: [
        {
          id: 'bad-session',
          startTime: '2026-10-10T10:00:00Z',
          durationSeconds: 1800,
          totalVolumeKg: 500,
          totalSets: 1,
          exercises: [
            {
              id: 'ex-1',
              exerciseId: 'pushup',
              sets: [
                {
                  id: 'set-1',
                  setNumber: 1,
                  type: 'normal',
                  weightKg: -20, // Negative weight
                  repsOrSeconds: 10,
                  completed: true
                }
              ]
            }
          ]
        }
      ]
    };

    const validation = validateFitHomeBackup(backupWithBadSet);
    expect(validation.isValid).toBe(false);
    if (!validation.isValid) {
      expect(validation.error).toContain('sessions');
      expect(validation.error).toContain('weightKg');
    }
  });

  // 4. Merge without duplicating records
  it('4. Merges backup data without duplicating records and updates matching identities', async () => {
    const existing = createInitialState();
    const backup = {
      sessions: [
        // Updates existing session 's-existing-2'
        {
          id: 's-existing-2',
          title: 'Treino Existente 2 (ATUALIZADO PELO BACKUP)',
          startTime: '2026-10-02T10:00:00Z',
          endTime: '2026-10-02T11:00:00Z',
          durationSeconds: 3600,
          totalVolumeKg: 2000,
          totalSets: 12,
          exercises: []
        },
        // Adds brand new session 's-new-3'
        {
          id: 's-new-3',
          title: 'Treino Novo 3',
          startTime: '2026-10-03T10:00:00Z',
          endTime: '2026-10-03T10:45:00Z',
          durationSeconds: 2700,
          totalVolumeKg: 800,
          totalSets: 8,
          exercises: []
        }
      ],
      personalRecords: [
        // Better score for 'pushup' (was 20, now 30)
        {
          exerciseId: 'pushup',
          exerciseName: 'Flexão de Braço',
          maxScore: 30,
          metricLabel: 'reps',
          achievedAt: '2026-10-03'
        },
        // Worse score for 'squat' (was 50, now 40) -> conflict resolution preserves athlete's best
        {
          exerciseId: 'squat',
          exerciseName: 'Agachamento',
          maxScore: 40,
          metricLabel: 'reps',
          achievedAt: '2026-10-03'
        }
      ]
    };

    const res = await executeBackupRestore('merge', existing, backup, null, {
      storage: fakeStorage
    });

    expect(res.success).toBe(true);
    // Sessions: s-existing-1 preserved, s-existing-2 updated, s-new-3 added = 3 total (no duplicates!)
    expect(res.data.sessions.length).toBe(3);
    const updatedSession = res.data.sessions.find(s => s.id === 's-existing-2');
    expect(updatedSession?.title).toBe('Treino Existente 2 (ATUALIZADO PELO BACKUP)');
    expect(updatedSession?.totalVolumeKg).toBe(2000);

    // Records: pushup updated to 30, squat preserved at 50 (best performance preserved)
    const pushupPR = res.data.personalRecords.find(r => r.exerciseId === 'pushup');
    expect(pushupPR?.maxScore).toBe(30);
    const squatPR = res.data.personalRecords.find(r => r.exerciseId === 'squat');
    expect(squatPR?.maxScore).toBe(50);
  });

  // 5. Replace and delete surplus records when applicable
  it('5. Replaces data and removes surplus records from Firestore when applicable', async () => {
    const uid = 'athlete-replace-user';
    const existing = createInitialState();

    const deleteWorkout = vi.fn().mockResolvedValue(undefined);
    const saveWorkout = vi.fn().mockResolvedValue(undefined);
    const deleteWeight = vi.fn().mockResolvedValue(undefined);
    const saveWeight = vi.fn().mockResolvedValue(undefined);

    // Backup only contains 1 session ('s-new-1') and 1 weight ('w-new-1')
    // Therefore existing sessions 's-existing-1' and 's-existing-2' are surplus and MUST be deleted!
    const backup = {
      sessions: [
        {
          id: 's-new-1',
          title: 'Único Treino no Backup',
          startTime: '2026-10-10T10:00:00Z',
          endTime: '2026-10-10T10:45:00Z',
          durationSeconds: 2700,
          totalVolumeKg: 900,
          totalSets: 9,
          exercises: []
        }
      ],
      bodyWeights: [
        {
          id: 'w-new-1',
          date: '2026-10-10',
          weightKg: 77.0,
          createdAt: '2026-10-10T08:00:00Z'
        }
      ]
    };

    const res = await executeBackupRestore('replace', existing, backup, uid, {
      storage: fakeStorage,
      deleteWorkout,
      saveWorkout,
      deleteWeight,
      saveWeight
    });

    expect(res.success).toBe(true);
    expect(res.data.sessions.length).toBe(1);
    expect(res.data.sessions[0].id).toBe('s-new-1');
    expect(res.data.bodyWeights.length).toBe(1);
    expect(res.data.bodyWeights[0].id).toBe('w-new-1');

    // Verify surplus deletions were called for existing sessions 1 & 2
    expect(deleteWorkout).toHaveBeenCalledWith(uid, 's-existing-1');
    expect(deleteWorkout).toHaveBeenCalledWith(uid, 's-existing-2');
    expect(deleteWorkout).toHaveBeenCalledTimes(2);

    // Verify backup session was saved
    expect(saveWorkout).toHaveBeenCalledWith(uid, expect.objectContaining({ id: 's-new-1' }));

    // Verify surplus weight 'w-existing-1' was deleted and new weight saved
    expect(deleteWeight).toHaveBeenCalledWith(uid, 'w-existing-1');
    expect(saveWeight).toHaveBeenCalledWith(uid, expect.objectContaining({ id: 'w-new-1' }));

    // Verify migration flags were marked
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);
    expect(hasCategoryMigrated(uid, 'weights', fakeStorage)).toBe(true);
  });

  // 6. Restore empty category
  it('6. Restores an empty category ([]) correctly in Replace mode by wiping existing items and deleting cloud surplus', async () => {
    const uid = 'athlete-empty-cat';
    const existing = createInitialState();
    const deleteWorkout = vi.fn().mockResolvedValue(undefined);

    // Backup explicitly has sessions: []
    const backup = {
      sessions: []
    };

    const res = await executeBackupRestore('replace', existing, backup, uid, {
      storage: fakeStorage,
      deleteWorkout
    });

    expect(res.success).toBe(true);
    expect(res.data.sessions.length).toBe(0);
    // Deleted both existing workouts from cloud
    expect(deleteWorkout).toHaveBeenCalledTimes(2);
    expect(deleteWorkout).toHaveBeenCalledWith(uid, 's-existing-1');
    expect(deleteWorkout).toHaveBeenCalledWith(uid, 's-existing-2');
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(true);
  });

  // 7. Simulate write failure and delete failure
  it('7. Handles write failure and delete failure without crashing', async () => {
    const uid = 'athlete-failure-test';
    const existing = createInitialState();

    const deleteWorkout = vi.fn().mockResolvedValue(undefined);
    const saveWorkout = vi.fn().mockRejectedValue(new Error('Permission denied'));
    const deleteWeight = vi.fn().mockRejectedValue(new Error('Network offline'));

    const backup = {
      sessions: [
        {
          id: 's-new',
          title: 'Treino Test',
          startTime: '2026-10-10T10:00:00Z',
          endTime: '2026-10-10T10:45:00Z',
          durationSeconds: 2700,
          totalVolumeKg: 500,
          totalSets: 5,
          exercises: []
        }
      ],
      bodyWeights: []
    };

    const res = await executeBackupRestore('replace', existing, backup, uid, {
      storage: fakeStorage,
      deleteWorkout,
      saveWorkout,
      deleteWeight
    });

    expect(res.success).toBe(false);
    expect(res.isPartial).toBe(true);
    expect(res.errors.length).toBe(2);
    expect(res.errors[0]).toContain('Treinos: Permission denied');
    expect(res.errors[1]).toContain('Pesagens: Network offline');
  });

  // 8. Confirm failures do NOT announce restoration as complete
  it('8. Confirms failures do NOT mark categories as migrated', async () => {
    const uid = 'athlete-unmigrated-test';
    const existing = createInitialState();

    const saveWorkout = vi.fn().mockRejectedValue(new Error('Write quota exceeded'));

    const backup = {
      sessions: [
        {
          id: 's-quota',
          title: 'Treino',
          startTime: '2026-10-10T10:00:00Z',
          endTime: '2026-10-10T10:45:00Z',
          durationSeconds: 2700,
          totalVolumeKg: 500,
          totalSets: 5,
          exercises: []
        }
      ]
    };

    const res = await executeBackupRestore('merge', existing, backup, uid, {
      storage: fakeStorage,
      saveWorkout
    });

    expect(res.success).toBe(false);
    // Category MUST NOT be marked migrated!
    expect(hasCategoryMigrated(uid, 'workouts', fakeStorage)).toBe(false);
  });

  // 9. Verify that other users' data remains intact (isolation)
  it('9. Enforces strict user isolation so other users data remains completely untouched', async () => {
    const userA = 'user-alice';
    const userB = 'user-bob';

    const existingA = createInitialState();
    const existingB = createInitialState();

    const saveWorkout = vi.fn().mockResolvedValue(undefined);

    const backup = {
      sessions: [
        {
          id: 's-alice-only',
          title: 'Treino Alice',
          startTime: '2026-10-10T10:00:00Z',
          endTime: '2026-10-10T10:45:00Z',
          durationSeconds: 2700,
          totalVolumeKg: 500,
          totalSets: 5,
          exercises: []
        }
      ]
    };

    // Restore for Alice
    await executeBackupRestore('merge', existingA, backup, userA, {
      storage: fakeStorage,
      saveWorkout
    });

    expect(saveWorkout).toHaveBeenCalledWith(userA, expect.anything());
    expect(saveWorkout).not.toHaveBeenCalledWith(userB, expect.anything());

    expect(hasCategoryMigrated(userA, 'workouts', fakeStorage)).toBe(true);
    expect(hasCategoryMigrated(userB, 'workouts', fakeStorage)).toBe(false);

    // Bob's data remains as existingB
    expect(existingB.sessions.length).toBe(2);
  });

  // 10. Test photo handling on local storage quota exceeded
  it('10. Handles photo quota exceeded (QuotaExceededError) safely without corrupting other categories', async () => {
    const existing = createInitialState();

    // Custom storage that throws on body_photos key
    let throwOnPhotos = true;
    const quotaLimitedStorage: Storage = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        if (key.includes('body_photos') && throwOnPhotos) {
          throw new Error('QuotaExceededError: DOM Exception 22');
        }
        mockStorage[key] = String(value);
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
      key: () => null,
      get length() {
        return Object.keys(mockStorage).length;
      }
    };

    const backup = {
      bodyWeights: [
        {
          id: 'w-new',
          date: '2026-10-12',
          weightKg: 79.0,
          createdAt: '2026-10-12T08:00:00Z'
        }
      ],
      bodyPhotos: [
        {
          id: 'heavy-photo-1',
          date: '2026-10-12',
          photoDataUrl: 'data:image/jpeg;base64,veryHeavyData...',
          createdAt: '2026-10-12T08:00:00Z'
        }
      ]
    };

    const res = await executeBackupRestore('merge', existing, backup, null, {
      storage: quotaLimitedStorage
    });

    // Weights were still restored successfully!
    expect(res.data.bodyWeights.length).toBe(2);
    // Quota warning triggered
    expect(res.photoQuotaExceeded).toBe(true);
  });
});
