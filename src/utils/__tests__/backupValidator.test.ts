import { describe, it, expect } from 'vitest';
import { validateFitHomeBackup } from '../backupValidator';

describe('validateFitHomeBackup', () => {
  const sampleValidBackup = {
    version: '2.0',
    sessions: [
      {
        id: 's1',
        date: '2026-10-10T10:00:00Z',
        exercises: [],
        durationMinutes: 45,
        totalVolumeKg: 1200,
        totalReps: 150
      }
    ],
    personalRecords: [
      {
        exerciseId: 'pushup',
        exerciseName: 'Flexão de Braço',
        maxWeightKg: 0,
        maxReps: 35,
        maxHoldSeconds: 0,
        achievedAt: '2026-10-10'
      }
    ],
    bodyWeights: [
      {
        id: 'w1',
        date: '2026-10-10',
        weightKg: 78.5,
        createdAt: '2026-10-10T10:00:00Z'
      }
    ],
    bodyMeasurements: [
      {
        id: 'm1',
        date: '2026-10-10',
        measurements: { cintura: 82, bracoDireito: 37 },
        createdAt: '2026-10-10T10:00:00Z'
      }
    ],
    bodyGoal: {
      targetWeightKg: 72,
      heightCm: 178
    },
    bodyPhotos: [
      {
        id: 'p1',
        date: '2026-10-10',
        photoDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        category: 'frente' as const,
        createdAt: '2026-10-10T10:00:00Z'
      }
    ]
  };

  it('validates a complete backup with bodyPhotos', () => {
    const res = validateFitHomeBackup(JSON.stringify(sampleValidBackup));
    expect(res.isValid).toBe(true);
    if (res.isValid) {
      expect(res.data.bodyPhotos?.length).toBe(1);
      expect(res.data.bodyWeights?.length).toBe(1);
    }
  });

  it('preserves backward compatibility with legacy backups lacking bodyPhotos', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { bodyPhotos, ...legacyBackup } = sampleValidBackup;
    const res = validateFitHomeBackup(legacyBackup);
    expect(res.isValid).toBe(true);
    if (res.isValid) {
      expect(res.data.bodyPhotos).toBeUndefined();
      expect(res.data.bodyWeights?.length).toBe(1);
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
    expect(validateFitHomeBackup(JSON.stringify({ randomKey: 'val' })).isValid).toBe(false);
  });

  it('enforces all-or-nothing validation when any element is corrupt', () => {
    // Corrupt weight entry with negative weight
    const corruptPayload = {
      ...sampleValidBackup,
      bodyWeights: [
        {
          id: 'w1',
          date: '2026-10-10',
          weightKg: -78.5, // INVALID!
          createdAt: '2026-10-10T10:00:00Z'
        }
      ]
    };

    const res = validateFitHomeBackup(JSON.stringify(corruptPayload));
    expect(res.isValid).toBe(false);
    if (!res.isValid) {
      expect(res.error).toContain('peso');
    }
  });

  it('rejects invalid photo elements', () => {
    const corruptPhotoPayload = {
      ...sampleValidBackup,
      bodyPhotos: [
        {
          id: 'p1',
          date: '2026-10-10',
          photoDataUrl: '', // INVALID empty URL!
          createdAt: '2026-10-10T10:00:00Z'
        }
      ]
    };

    const res = validateFitHomeBackup(corruptPhotoPayload);
    expect(res.isValid).toBe(false);
  });
});
