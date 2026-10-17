import { describe, it, expect } from 'vitest';
import { validateFitHomeBackup } from '../backupValidator';
import { WorkoutSession, PersonalRecord } from '../../types/workout';
import { WeightEntry, MeasurementEntry, BodyGoal, ProgressPhoto } from '../../types/bodyEvolution';

describe('validateFitHomeBackup (Contract & Nested Schema Validation)', () => {
  // Realistic production backup created from actual application types
  const realisticProductionBackup = {
    version: '2.0',
    exportedAt: '2026-10-15T12:00:00.000Z',
    sessions: [
      {
        id: 'session-101',
        title: 'Treino A - Peito e Tríceps',
        startTime: '2026-10-15T09:00:00.000Z',
        endTime: '2026-10-15T09:45:00.000Z',
        durationSeconds: 2700,
        totalVolumeKg: 1450,
        totalSets: 6,
        notes: 'Treino rendeu bem, excelente intensidade.',
        exercises: [
          {
            id: 'ex-item-1',
            exerciseId: 'pushup',
            notes: 'Execução estrita',
            sets: [
              {
                id: 'set-1',
                setNumber: 1,
                type: 'normal' as const,
                weightKg: 0,
                repsOrSeconds: 20,
                completed: true,
                rpe: 8
              },
              {
                id: 'set-2',
                setNumber: 2,
                type: 'normal' as const,
                weightKg: 0,
                repsOrSeconds: 18,
                completed: true,
                rpe: 9
              }
            ]
          }
        ]
      }
    ] as WorkoutSession[],
    personalRecords: [
      {
        exerciseId: 'pushup',
        exerciseName: 'Flexão de Braço',
        maxScore: 35,
        metricLabel: 'reps',
        achievedAt: '2026-10-15T09:45:00.000Z'
      }
    ] as PersonalRecord[],
    bodyWeights: [
      {
        id: 'w-101',
        date: '2026-10-15',
        weightKg: 78.5,
        notes: 'Em jejum',
        createdAt: '2026-10-15T07:00:00.000Z'
      }
    ] as WeightEntry[],
    bodyMeasurements: [
      {
        id: 'm-101',
        date: '2026-10-15',
        measurements: {
          cintura: 82,
          bracoDireito: 37,
          peito: 102
        },
        notes: 'Pela manhã',
        createdAt: '2026-10-15T07:05:00.000Z'
      }
    ] as MeasurementEntry[],
    bodyGoal: {
      targetWeightKg: 72,
      customInitialWeightKg: 85,
      heightCm: 178,
      targetDate: '2026-12-31',
      notes: 'Foco em perda de gordura'
    } as BodyGoal,
    bodyPhotos: [
      {
        id: 'p-101',
        date: '2026-10-15',
        photoDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        category: 'frente' as const,
        notes: 'Foto frontal de acompanhamento',
        createdAt: '2026-10-15T07:10:00.000Z'
      }
    ] as ProgressPhoto[]
  };

  it('validates a complete realistic production backup without data loss (Roundtrip Test)', () => {
    const jsonString = JSON.stringify(realisticProductionBackup);
    const res = validateFitHomeBackup(jsonString);

    expect(res.isValid).toBe(true);
    if (res.isValid) {
      expect(res.data.sessions?.length).toBe(1);
      expect(res.data.sessions?.[0].title).toBe('Treino A - Peito e Tríceps');
      expect(res.data.sessions?.[0].durationSeconds).toBe(2700);
      expect(res.data.sessions?.[0].exercises[0].sets.length).toBe(2);
      expect(res.data.sessions?.[0].exercises[0].sets[0].repsOrSeconds).toBe(20);

      expect(res.data.personalRecords?.[0].maxScore).toBe(35);
      expect(res.data.personalRecords?.[0].metricLabel).toBe('reps');

      expect(res.data.bodyWeights?.[0].weightKg).toBe(78.5);
      expect(res.data.bodyMeasurements?.[0].measurements.cintura).toBe(82);
      expect(res.data.bodyGoal?.targetWeightKg).toBe(72);
      expect(res.data.bodyPhotos?.[0].category).toBe('frente');
    }
  });

  it('preserves backward compatibility with legacy backups lacking bodyPhotos and using legacy field names', () => {
    const legacyBackup = {
      version: '1.0',
      sessions: [
        {
          id: 'legacy-s1',
          date: '2026-01-10T10:00:00Z',
          durationMinutes: 40,
          totalVolumeKg: 900,
          totalReps: 80,
          exercises: []
        }
      ],
      personalRecords: [
        {
          exerciseId: 'pullup',
          exerciseName: 'Barra Fixa',
          maxWeightKg: 0,
          maxReps: 12,
          achievedAt: '2026-01-10'
        }
      ],
      bodyWeights: [
        {
          id: 'lw-1',
          date: '2026-01-10',
          weightKg: 82.0
        }
      ]
    };

    const res = validateFitHomeBackup(legacyBackup);
    expect(res.isValid).toBe(true);
    if (res.isValid) {
      expect(res.data.bodyPhotos).toBeUndefined();
      expect(res.data.sessions?.length).toBe(1);
      // Normalized durationSeconds from durationMinutes
      expect(res.data.sessions?.[0].durationSeconds).toBe(2400);
      // Normalized maxScore from maxReps
      expect(res.data.personalRecords?.[0].maxScore).toBe(12);
      expect(res.data.personalRecords?.[0].metricLabel).toBe('reps');
    }
  });

  it('rejects a malformed exercise within a workout session and identifies the exact section and index', () => {
    const corruptBackup = {
      ...realisticProductionBackup,
      sessions: [
        {
          ...realisticProductionBackup.sessions[0],
          exercises: [
            {
              id: 'ex-1',
              exerciseId: '', // INVALID empty exerciseId!
              sets: []
            }
          ]
        }
      ]
    };

    const res = validateFitHomeBackup(corruptBackup);
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.error).toContain('sessions');
      expect(res.error).toContain('exerciseId');
    }
  });

  it('rejects a malformed set within an exercise and identifies the exact section and invalid field', () => {
    const corruptBackup = {
      ...realisticProductionBackup,
      sessions: [
        {
          ...realisticProductionBackup.sessions[0],
          exercises: [
            {
              id: 'ex-1',
              exerciseId: 'pushup',
              sets: [
                {
                  id: 'set-1',
                  setNumber: 1,
                  type: 'normal',
                  weightKg: -10, // INVALID negative weight!
                  repsOrSeconds: 15,
                  completed: true
                }
              ]
            }
          ]
        }
      ]
    };

    const res = validateFitHomeBackup(corruptBackup);
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.error).toContain('sessions');
      expect(res.error).toContain('weightKg');
    }
  });

  it('rejects an invalid set with negative reps or seconds', () => {
    const corruptBackup = {
      ...realisticProductionBackup,
      sessions: [
        {
          ...realisticProductionBackup.sessions[0],
          exercises: [
            {
              id: 'ex-1',
              exerciseId: 'pushup',
              sets: [
                {
                  id: 'set-1',
                  setNumber: 1,
                  type: 'normal',
                  weightKg: 0,
                  repsOrSeconds: -5, // INVALID negative reps!
                  completed: true
                }
              ]
            }
          ]
        }
      ]
    };

    const res = validateFitHomeBackup(corruptBackup);
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.error).toContain('repsOrSeconds');
    }
  });

  it('rejects invalid JSON syntax', () => {
    const res = validateFitHomeBackup('{ invalid json: true');
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.error).toContain('JSON');
    }
  });

  it('rejects empty or non-FitHome root structures', () => {
    expect(validateFitHomeBackup('[]').isValid).toBe(false);
    expect(validateFitHomeBackup('null').isValid).toBe(false);
    expect(validateFitHomeBackup('{}').isValid).toBe(false);
    expect(validateFitHomeBackup(JSON.stringify({ unrelatedField: 'data' })).isValid).toBe(false);
  });

  it('rejects non-finite or invalid measurement values', () => {
    const corruptMeasurements = {
      ...realisticProductionBackup,
      bodyMeasurements: [
        {
          id: 'm-1',
          date: '2026-10-15',
          measurements: {
            cintura: NaN // INVALID!
          }
        }
      ]
    };

    const res = validateFitHomeBackup(corruptMeasurements);
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.error).toContain('bodyMeasurements');
      expect(res.error).toContain('cintura');
    }
  });

  it('rejects out-of-range body goals', () => {
    const corruptGoal = {
      ...realisticProductionBackup,
      bodyGoal: {
        heightCm: 350 // INVALID height > 280cm!
      }
    };

    const res = validateFitHomeBackup(corruptGoal);
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.error).toContain('bodyGoal');
      expect(res.error).toContain('heightCm');
    }
  });

  it('rejects empty photo data URLs', () => {
    const corruptPhoto = {
      ...realisticProductionBackup,
      bodyPhotos: [
        {
          id: 'p-1',
          date: '2026-10-15',
          photoDataUrl: '   ' // INVALID empty!
        }
      ]
    };

    const res = validateFitHomeBackup(corruptPhoto);
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.error).toContain('bodyPhotos');
      expect(res.error).toContain('photoDataUrl');
    }
  });
});
