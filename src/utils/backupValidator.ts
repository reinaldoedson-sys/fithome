import { WorkoutSession, PersonalRecord, WorkoutExercise, WorkoutSet } from '../types/workout';
import { WeightEntry, MeasurementEntry, BodyGoal, ProgressPhoto, MeasurementKey } from '../types/bodyEvolution';

export interface FitHomeBackup {
  version?: string;
  sessions?: WorkoutSession[];
  personalRecords?: PersonalRecord[];
  bodyWeights?: WeightEntry[];
  bodyMeasurements?: MeasurementEntry[];
  bodyGoal?: BodyGoal;
  bodyPhotos?: ProgressPhoto[];
  exportedAt?: string;
}

export type ValidationResult =
  | { isValid: true; data: FitHomeBackup }
  | { isValid: false; error: string };

function isValidDateString(val: unknown): boolean {
  if (typeof val !== 'string' || !val.trim()) return false;
  const parsed = Date.parse(val);
  return !isNaN(parsed);
}

function isFiniteNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

/**
 * Validates a raw JSON string or object to ensure it strictly conforms
 * to the FitHome backup format based on actual production types.
 * 
 * Supports:
 * - Current production types (WorkoutSession with durationSeconds/totalSets/exercises, PersonalRecord with maxScore/metricLabel).
 * - Full validation of nested exercises and sets.
 * - Legacy backup compatibility (durationMinutes, maxWeightKg/maxReps, missing photos, etc.).
 * - Clear error messages indicating the exact section, index, and invalid field.
 */
export function validateFitHomeBackup(input: unknown): ValidationResult {
  let parsed: unknown = input;

  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      return {
        isValid: false,
        error: 'O arquivo selecionado não contém uma estrutura JSON válida.'
      };
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      isValid: false,
      error: 'Formato de backup inválido: o conteúdo raiz deve ser um objeto estruturado.'
    };
  }

  const obj = parsed as Record<string, unknown>;

  const hasAnyKnownSection =
    'sessions' in obj ||
    'personalRecords' in obj ||
    'bodyWeights' in obj ||
    'bodyMeasurements' in obj ||
    'bodyGoal' in obj ||
    'bodyPhotos' in obj;

  if (!hasAnyKnownSection) {
    return {
      isValid: false,
      error: 'O arquivo fornecido não contém seções reconhecidas de dados do FitHome.'
    };
  }

  // 1. Validate sessions
  if ('sessions' in obj && obj.sessions !== undefined && obj.sessions !== null) {
    if (!Array.isArray(obj.sessions)) {
      return { isValid: false, error: 'A seção de treinos ("sessions") deve ser uma lista.' };
    }

    for (let i = 0; i < obj.sessions.length; i++) {
      const s = obj.sessions[i];
      if (typeof s !== 'object' || s === null || Array.isArray(s)) {
        return {
          isValid: false,
          error: `A seção de treinos ("sessions") contém um registro inválido no índice ${i}.`
        };
      }

      if (typeof s.id !== 'string' || !s.id.trim()) {
        return {
          isValid: false,
          error: `A seção de treinos ("sessions") no índice ${i} contém o campo "id" ausente ou inválido.`
        };
      }

      // Title: fallback to id or 'Treino' if not set in old versions
      if (s.title !== undefined && typeof s.title !== 'string') {
        return {
          isValid: false,
          error: `A seção de treinos ("sessions") no treino "${s.id}" contém o campo "title" inválido.`
        };
      }

      // startTime or date (legacy)
      const hasStartTime = isValidDateString(s.startTime);
      const hasLegacyDate = isValidDateString(s.date);
      if (!hasStartTime && !hasLegacyDate) {
        return {
          isValid: false,
          error: `A seção de treinos ("sessions") no treino "${s.id}" contém o campo de data/hora de início ("startTime") inválido.`
        };
      }

      if (s.endTime !== undefined && s.endTime !== null && !isValidDateString(s.endTime)) {
        return {
          isValid: false,
          error: `A seção de treinos ("sessions") no treino "${s.id}" contém o campo "endTime" com formato de data inválido.`
        };
      }

      // Duration: durationSeconds (production) or durationMinutes (legacy)
      const hasSeconds = isFiniteNumber(s.durationSeconds) && s.durationSeconds >= 0;
      const hasMinutes = isFiniteNumber(s.durationMinutes) && s.durationMinutes >= 0;
      if (!hasSeconds && !hasMinutes) {
        return {
          isValid: false,
          error: `A seção de treinos ("sessions") no treino "${s.id}" contém o campo "durationSeconds" com valor numérico inválido.`
        };
      }

      // totalVolumeKg
      if (!isFiniteNumber(s.totalVolumeKg) || s.totalVolumeKg < 0) {
        return {
          isValid: false,
          error: `A seção de treinos ("sessions") no treino "${s.id}" contém o campo "totalVolumeKg" com valor numérico inválido.`
        };
      }

      // totalSets (production) or totalReps (legacy)
      const hasSets = isFiniteNumber(s.totalSets) && s.totalSets >= 0;
      const hasReps = isFiniteNumber(s.totalReps) && s.totalReps >= 0;
      if (!hasSets && !hasReps) {
        return {
          isValid: false,
          error: `A seção de treinos ("sessions") no treino "${s.id}" contém o campo "totalSets" com valor numérico inválido.`
        };
      }

      // Exercises
      if (!Array.isArray(s.exercises)) {
        return {
          isValid: false,
          error: `A seção de treinos ("sessions") no treino "${s.id}" contém a lista "exercises" ausente ou inválida.`
        };
      }

      // Validate nested exercises and sets
      for (let j = 0; j < s.exercises.length; j++) {
        const ex = s.exercises[j];
        if (typeof ex !== 'object' || ex === null || Array.isArray(ex)) {
          return {
            isValid: false,
            error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j} contém estrutura inválida.`
          };
        }

        if (typeof ex.id !== 'string' || !ex.id.trim()) {
          return {
            isValid: false,
            error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j} contém o campo "id" ausente ou inválido.`
          };
        }

        if (typeof ex.exerciseId !== 'string' || !ex.exerciseId.trim()) {
          return {
            isValid: false,
            error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j} contém o campo "exerciseId" ausente ou inválido.`
          };
        }

        if (!Array.isArray(ex.sets)) {
          return {
            isValid: false,
            error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j} deve conter uma lista "sets".`
          };
        }

        for (let k = 0; k < ex.sets.length; k++) {
          const st = ex.sets[k];
          if (typeof st !== 'object' || st === null || Array.isArray(st)) {
            return {
              isValid: false,
              error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j}, série ${k} contém estrutura inválida.`
            };
          }

          if (typeof st.id !== 'string' || !st.id.trim()) {
            return {
              isValid: false,
              error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j}, série ${k} contém o campo "id" ausente ou inválido.`
            };
          }

          if (!isFiniteNumber(st.setNumber) || st.setNumber < 0) {
            return {
              isValid: false,
              error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j}, série ${k} contém o campo "setNumber" inválido.`
            };
          }

          if (typeof st.type !== 'string' || !st.type.trim()) {
            return {
              isValid: false,
              error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j}, série ${k} contém o campo "type" inválido.`
            };
          }

          if (!isFiniteNumber(st.weightKg) || st.weightKg < 0) {
            return {
              isValid: false,
              error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j}, série ${k} contém o campo "weightKg" com valor numérico negativo ou inválido.`
            };
          }

          // repsOrSeconds (production) or reps (legacy)
          const repsVal = st.repsOrSeconds !== undefined ? st.repsOrSeconds : st.reps;
          if (!isFiniteNumber(repsVal) || repsVal < 0) {
            return {
              isValid: false,
              error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j}, série ${k} contém o campo "repsOrSeconds" com valor numérico negativo ou inválido.`
            };
          }

          if (typeof st.completed !== 'boolean') {
            return {
              isValid: false,
              error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j}, série ${k} contém o campo "completed" com valor booleano inválido.`
            };
          }

          if (st.rpe !== undefined && st.rpe !== null && (!isFiniteNumber(st.rpe) || st.rpe < 0 || st.rpe > 10)) {
            return {
              isValid: false,
              error: `A seção de treinos ("sessions") no treino "${s.id}", exercício ${j}, série ${k} contém o campo "rpe" com valor fora da faixa 0-10.`
            };
          }
        }
      }
    }
  }

  // 2. Validate personalRecords
  if ('personalRecords' in obj && obj.personalRecords !== undefined && obj.personalRecords !== null) {
    if (!Array.isArray(obj.personalRecords)) {
      return { isValid: false, error: 'A seção de recordes ("personalRecords") deve ser uma lista.' };
    }

    for (let i = 0; i < obj.personalRecords.length; i++) {
      const pr = obj.personalRecords[i];
      if (typeof pr !== 'object' || pr === null || Array.isArray(pr)) {
        return {
          isValid: false,
          error: `A seção de recordes ("personalRecords") contém um registro inválido no índice ${i}.`
        };
      }

      if (typeof pr.exerciseId !== 'string' || !pr.exerciseId.trim()) {
        return {
          isValid: false,
          error: `A seção de recordes ("personalRecords") no índice ${i} contém o campo "exerciseId" ausente ou inválido.`
        };
      }

      if (typeof pr.exerciseName !== 'string' || !pr.exerciseName.trim()) {
        return {
          isValid: false,
          error: `A seção de recordes ("personalRecords") no índice ${i} contém o campo "exerciseName" ausente ou inválido.`
        };
      }

      // maxScore (production) or maxWeightKg / maxReps (legacy)
      const score =
        pr.maxScore !== undefined
          ? pr.maxScore
          : pr.maxWeightKg !== undefined
          ? pr.maxWeightKg
          : pr.maxReps;

      if (!isFiniteNumber(score) || score < 0) {
        return {
          isValid: false,
          error: `A seção de recordes ("personalRecords") no índice ${i} ("${pr.exerciseName}") contém o campo "maxScore" com valor numérico inválido.`
        };
      }

      if (pr.metricLabel !== undefined && typeof pr.metricLabel !== 'string') {
        return {
          isValid: false,
          error: `A seção de recordes ("personalRecords") no índice ${i} contém o campo "metricLabel" inválido.`
        };
      }

      if (!isValidDateString(pr.achievedAt)) {
        return {
          isValid: false,
          error: `A seção de recordes ("personalRecords") no índice ${i} contém o campo "achievedAt" com formato de data inválido.`
        };
      }
    }
  }

  // 3. Validate bodyWeights
  if ('bodyWeights' in obj && obj.bodyWeights !== undefined && obj.bodyWeights !== null) {
    if (!Array.isArray(obj.bodyWeights)) {
      return { isValid: false, error: 'A seção de pesagens ("bodyWeights") deve ser uma lista.' };
    }

    for (let i = 0; i < obj.bodyWeights.length; i++) {
      const w = obj.bodyWeights[i];
      if (typeof w !== 'object' || w === null || Array.isArray(w)) {
        return {
          isValid: false,
          error: `A seção de pesagens ("bodyWeights") contém um registro inválido no índice ${i}.`
        };
      }

      if (typeof w.id !== 'string' || !w.id.trim()) {
        return {
          isValid: false,
          error: `A seção de pesagens ("bodyWeights") no índice ${i} contém o campo "id" ausente ou inválido.`
        };
      }

      if (!isValidDateString(w.date)) {
        return {
          isValid: false,
          error: `A seção de pesagens ("bodyWeights") no índice ${i} contém o campo "date" com formato de data inválido.`
        };
      }

      if (!isFiniteNumber(w.weightKg) || w.weightKg <= 0 || w.weightKg > 500) {
        return {
          isValid: false,
          error: `A seção de pesagens ("bodyWeights") no índice ${i} contém o campo "weightKg" com valor inválido (deve ser maior que zero e até 500 kg).`
        };
      }

      if (w.createdAt !== undefined && !isValidDateString(w.createdAt)) {
        return {
          isValid: false,
          error: `A seção de pesagens ("bodyWeights") no índice ${i} contém o campo "createdAt" com formato de data inválido.`
        };
      }
    }
  }

  // 4. Validate bodyMeasurements
  if ('bodyMeasurements' in obj && obj.bodyMeasurements !== undefined && obj.bodyMeasurements !== null) {
    if (!Array.isArray(obj.bodyMeasurements)) {
      return { isValid: false, error: 'A seção de medidas ("bodyMeasurements") deve ser uma lista.' };
    }

    for (let i = 0; i < obj.bodyMeasurements.length; i++) {
      const m = obj.bodyMeasurements[i];
      if (typeof m !== 'object' || m === null || Array.isArray(m)) {
        return {
          isValid: false,
          error: `A seção de medidas ("bodyMeasurements") contém um registro inválido no índice ${i}.`
        };
      }

      if (typeof m.id !== 'string' || !m.id.trim()) {
        return {
          isValid: false,
          error: `A seção de medidas ("bodyMeasurements") no índice ${i} contém o campo "id" ausente ou inválido.`
        };
      }

      if (!isValidDateString(m.date)) {
        return {
          isValid: false,
          error: `A seção de medidas ("bodyMeasurements") no índice ${i} contém o campo "date" com formato de data inválido.`
        };
      }

      if (typeof m.measurements !== 'object' || m.measurements === null || Array.isArray(m.measurements)) {
        return {
          isValid: false,
          error: `A seção de medidas ("bodyMeasurements") no índice ${i} contém a estrutura "measurements" inválida.`
        };
      }

      for (const [key, val] of Object.entries(m.measurements)) {
        if (val !== undefined && val !== null) {
          if (!isFiniteNumber(val) || val < 0 || val > 500) {
            return {
              isValid: false,
              error: `A seção de medidas ("bodyMeasurements") no índice ${i} contém o campo "${key}" com valor numérico inválido.`
            };
          }
        }
      }

      if (m.createdAt !== undefined && !isValidDateString(m.createdAt)) {
        return {
          isValid: false,
          error: `A seção de medidas ("bodyMeasurements") no índice ${i} contém o campo "createdAt" com formato de data inválido.`
        };
      }
    }
  }

  // 5. Validate bodyGoal
  if ('bodyGoal' in obj && obj.bodyGoal !== undefined && obj.bodyGoal !== null) {
    if (typeof obj.bodyGoal !== 'object' || Array.isArray(obj.bodyGoal)) {
      return { isValid: false, error: 'A seção de metas ("bodyGoal") deve ser um objeto.' };
    }

    const g = obj.bodyGoal as Record<string, unknown>;

    if (g.targetWeightKg !== undefined && g.targetWeightKg !== null) {
      if (!isFiniteNumber(g.targetWeightKg) || g.targetWeightKg <= 0 || g.targetWeightKg > 500) {
        return {
          isValid: false,
          error: 'A seção de metas ("bodyGoal") contém o campo "targetWeightKg" com valor numérico positivo inválido.'
        };
      }
    }

    if (g.customInitialWeightKg !== undefined && g.customInitialWeightKg !== null) {
      if (!isFiniteNumber(g.customInitialWeightKg) || g.customInitialWeightKg <= 0 || g.customInitialWeightKg > 500) {
        return {
          isValid: false,
          error: 'A seção de metas ("bodyGoal") contém o campo "customInitialWeightKg" com valor numérico positivo inválido.'
        };
      }
    }

    if (g.heightCm !== undefined && g.heightCm !== null) {
      if (!isFiniteNumber(g.heightCm) || g.heightCm < 50 || g.heightCm > 280) {
        return {
          isValid: false,
          error: 'A seção de metas ("bodyGoal") contém o campo "heightCm" fora da faixa aceita (entre 50 e 280 cm).'
        };
      }
    }

    if (g.targetDate !== undefined && g.targetDate !== null && typeof g.targetDate === 'string' && g.targetDate.trim() !== '') {
      if (!isValidDateString(g.targetDate)) {
        return {
          isValid: false,
          error: 'A seção de metas ("bodyGoal") contém o campo "targetDate" com formato de data inválido.'
        };
      }
    }
  }

  // 6. Validate bodyPhotos (optional for backward compatibility)
  if ('bodyPhotos' in obj && obj.bodyPhotos !== undefined && obj.bodyPhotos !== null) {
    if (!Array.isArray(obj.bodyPhotos)) {
      return { isValid: false, error: 'A seção de fotos ("bodyPhotos") deve ser uma lista.' };
    }

    for (let i = 0; i < obj.bodyPhotos.length; i++) {
      const p = obj.bodyPhotos[i];
      if (typeof p !== 'object' || p === null || Array.isArray(p)) {
        return {
          isValid: false,
          error: `A seção de fotos ("bodyPhotos") contém um registro inválido no índice ${i}.`
        };
      }

      if (typeof p.id !== 'string' || !p.id.trim()) {
        return {
          isValid: false,
          error: `A seção de fotos ("bodyPhotos") no índice ${i} contém o campo "id" ausente ou inválido.`
        };
      }

      if (!isValidDateString(p.date)) {
        return {
          isValid: false,
          error: `A seção de fotos ("bodyPhotos") no índice ${i} contém o campo "date" com formato de data inválido.`
        };
      }

      if (typeof p.photoDataUrl !== 'string' || !p.photoDataUrl.trim()) {
        return {
          isValid: false,
          error: `A seção de fotos ("bodyPhotos") no índice ${i} contém o campo "photoDataUrl" ausente ou inválido.`
        };
      }

      if (p.createdAt !== undefined && !isValidDateString(p.createdAt)) {
        return {
          isValid: false,
          error: `A seção de fotos ("bodyPhotos") no índice ${i} contém o campo "createdAt" com formato de data inválido.`
        };
      }
    }
  }

  // Normalization pass for legacy field names to current schema without altering valid data
  const normalizedData: FitHomeBackup = {
    version: typeof obj.version === 'string' ? obj.version : '2.0',
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString()
  };

  if (Array.isArray(obj.sessions)) {
    normalizedData.sessions = obj.sessions.map((s: Record<string, unknown>) => {
      const startTime = typeof s.startTime === 'string' ? s.startTime : String(s.date || new Date().toISOString());
      const endTime = typeof s.endTime === 'string' ? s.endTime : startTime;
      const durationSeconds = typeof s.durationSeconds === 'number'
        ? s.durationSeconds
        : typeof s.durationMinutes === 'number'
        ? s.durationMinutes * 60
        : 0;

      const exercises = Array.isArray(s.exercises)
        ? (s.exercises as Array<Record<string, unknown>>).map((ex, exIdx) => ({
            id: String(ex.id || `ex-${exIdx}`),
            exerciseId: String(ex.exerciseId || ''),
            notes: typeof ex.notes === 'string' ? ex.notes : undefined,
            sets: Array.isArray(ex.sets)
              ? (ex.sets as Array<Record<string, unknown>>).map((st, stIdx) => ({
                  id: String(st.id || `set-${stIdx}`),
                  setNumber: typeof st.setNumber === 'number' ? st.setNumber : stIdx + 1,
                  type: (st.type as WorkoutSet['type']) || 'normal',
                  weightKg: typeof st.weightKg === 'number' ? st.weightKg : 0,
                  repsOrSeconds: typeof st.repsOrSeconds === 'number' ? st.repsOrSeconds : typeof st.reps === 'number' ? st.reps : 0,
                  completed: Boolean(st.completed),
                  rpe: typeof st.rpe === 'number' ? st.rpe : undefined,
                  previousRecord: typeof st.previousRecord === 'number' ? st.previousRecord : undefined
                }))
              : []
          }))
        : [];

      return {
        id: String(s.id),
        title: typeof s.title === 'string' && s.title.trim() ? s.title : 'Treino',
        startTime,
        endTime,
        durationSeconds,
        totalVolumeKg: typeof s.totalVolumeKg === 'number' ? s.totalVolumeKg : 0,
        totalSets: typeof s.totalSets === 'number' ? s.totalSets : typeof s.totalReps === 'number' ? s.totalReps : exercises.reduce((acc, e) => acc + e.sets.length, 0),
        exercises,
        notes: typeof s.notes === 'string' ? s.notes : undefined
      };
    });
  }

  if (Array.isArray(obj.personalRecords)) {
    normalizedData.personalRecords = obj.personalRecords.map((pr: Record<string, unknown>) => {
      const maxScore = typeof pr.maxScore === 'number'
        ? pr.maxScore
        : typeof pr.maxWeightKg === 'number' && pr.maxWeightKg > 0
        ? pr.maxWeightKg
        : typeof pr.maxReps === 'number'
        ? pr.maxReps
        : 0;

      const metricLabel = typeof pr.metricLabel === 'string'
        ? pr.metricLabel
        : typeof pr.maxWeightKg === 'number' && pr.maxWeightKg > 0
        ? 'kg'
        : 'reps';

      return {
        exerciseId: String(pr.exerciseId),
        exerciseName: String(pr.exerciseName || pr.exerciseId),
        maxScore,
        metricLabel,
        achievedAt: String(pr.achievedAt || new Date().toISOString())
      };
    });
  }

  if (Array.isArray(obj.bodyWeights)) {
    normalizedData.bodyWeights = obj.bodyWeights.map((w: Record<string, unknown>) => ({
      id: String(w.id),
      date: String(w.date),
      weightKg: Number(w.weightKg),
      notes: typeof w.notes === 'string' ? w.notes : undefined,
      createdAt: typeof w.createdAt === 'string' ? w.createdAt : String(w.date)
    }));
  }

  if (Array.isArray(obj.bodyMeasurements)) {
    normalizedData.bodyMeasurements = obj.bodyMeasurements.map((m: Record<string, unknown>) => ({
      id: String(m.id),
      date: String(m.date),
      measurements: (m.measurements as Record<MeasurementKey, number>) || {},
      notes: typeof m.notes === 'string' ? m.notes : undefined,
      createdAt: typeof m.createdAt === 'string' ? m.createdAt : String(m.date)
    }));
  }

  if (obj.bodyGoal && typeof obj.bodyGoal === 'object' && !Array.isArray(obj.bodyGoal)) {
    const g = obj.bodyGoal as Record<string, unknown>;
    normalizedData.bodyGoal = {
      targetWeightKg: typeof g.targetWeightKg === 'number' ? g.targetWeightKg : undefined,
      customInitialWeightKg: typeof g.customInitialWeightKg === 'number' ? g.customInitialWeightKg : undefined,
      heightCm: typeof g.heightCm === 'number' ? g.heightCm : undefined,
      targetDate: typeof g.targetDate === 'string' ? g.targetDate : undefined,
      notes: typeof g.notes === 'string' ? g.notes : undefined
    };
  }

  if (Array.isArray(obj.bodyPhotos)) {
    normalizedData.bodyPhotos = obj.bodyPhotos.map((p: Record<string, unknown>) => ({
      id: String(p.id),
      date: String(p.date),
      photoDataUrl: String(p.photoDataUrl),
      category: p.category as ProgressPhoto['category'],
      notes: typeof p.notes === 'string' ? p.notes : undefined,
      createdAt: typeof p.createdAt === 'string' ? p.createdAt : String(p.date)
    }));
  }

  return {
    isValid: true,
    data: normalizedData
  };
}
