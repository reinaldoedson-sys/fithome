import { WorkoutSession, PersonalRecord } from '../types/workout';
import { WeightEntry, MeasurementEntry, BodyGoal, ProgressPhoto } from '../types/bodyEvolution';

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

/**
 * Validates a raw JSON string or object to ensure it strictly conforms
 * to the FitHome backup format. Ensures all-or-nothing data integrity.
 * Preserves backward compatibility with backups that lack bodyPhotos.
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
      if (
        typeof s !== 'object' ||
        s === null ||
        typeof s.id !== 'string' ||
        !s.id ||
        typeof s.date !== 'string' ||
        !s.date ||
        !Array.isArray(s.exercises) ||
        typeof s.durationMinutes !== 'number' ||
        !Number.isFinite(s.durationMinutes) ||
        typeof s.totalVolumeKg !== 'number' ||
        !Number.isFinite(s.totalVolumeKg) ||
        typeof s.totalReps !== 'number' ||
        !Number.isFinite(s.totalReps)
      ) {
        return {
          isValid: false,
          error: `O treino no índice ${i} contém campos ausentes ou inválidos.`
        };
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
      if (
        typeof pr !== 'object' ||
        pr === null ||
        typeof pr.exerciseId !== 'string' ||
        !pr.exerciseId ||
        typeof pr.exerciseName !== 'string' ||
        typeof pr.maxWeightKg !== 'number' ||
        !Number.isFinite(pr.maxWeightKg) ||
        typeof pr.maxReps !== 'number' ||
        !Number.isFinite(pr.maxReps) ||
        typeof pr.maxHoldSeconds !== 'number' ||
        !Number.isFinite(pr.maxHoldSeconds) ||
        typeof pr.achievedAt !== 'string'
      ) {
        return {
          isValid: false,
          error: `O recorde pessoal no índice ${i} contém campos inválidos.`
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
      if (
        typeof w !== 'object' ||
        w === null ||
        typeof w.id !== 'string' ||
        !w.id ||
        typeof w.date !== 'string' ||
        !w.date ||
        typeof w.weightKg !== 'number' ||
        !Number.isFinite(w.weightKg) ||
        w.weightKg <= 0
      ) {
        return {
          isValid: false,
          error: `O registro de peso no índice ${i} possui valor inválido ou peso não positivo.`
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
      if (
        typeof m !== 'object' ||
        m === null ||
        typeof m.id !== 'string' ||
        !m.id ||
        typeof m.date !== 'string' ||
        !m.date ||
        typeof m.measurements !== 'object' ||
        m.measurements === null
      ) {
        return {
          isValid: false,
          error: `O registro de medidas no índice ${i} possui estrutura inválida.`
        };
      }

      // Check numeric fields in measurements
      for (const [key, val] of Object.entries(m.measurements)) {
        if (val !== undefined && (typeof val !== 'number' || !Number.isFinite(val) || val < 0)) {
          return {
            isValid: false,
            error: `A medida "${key}" no índice ${i} contém valor numérico inválido.`
          };
        }
      }
    }
  }

  // 5. Validate bodyGoal
  if ('bodyGoal' in obj && obj.bodyGoal !== undefined && obj.bodyGoal !== null) {
    if (typeof obj.bodyGoal !== 'object' || Array.isArray(obj.bodyGoal)) {
      return { isValid: false, error: 'A seção de metas ("bodyGoal") deve ser um objeto.' };
    }
    const g = obj.bodyGoal as Record<string, unknown>;
    if (
      g.targetWeightKg !== undefined &&
      (typeof g.targetWeightKg !== 'number' || !Number.isFinite(g.targetWeightKg) || g.targetWeightKg <= 0)
    ) {
      return { isValid: false, error: 'A meta de peso ("targetWeightKg") deve ser um número positivo.' };
    }
    if (
      g.customInitialWeightKg !== undefined &&
      (typeof g.customInitialWeightKg !== 'number' || !Number.isFinite(g.customInitialWeightKg) || g.customInitialWeightKg <= 0)
    ) {
      return { isValid: false, error: 'O peso inicial de referência deve ser um número positivo.' };
    }
    if (
      g.heightCm !== undefined &&
      (typeof g.heightCm !== 'number' || !Number.isFinite(g.heightCm) || g.heightCm < 50 || g.heightCm > 280)
    ) {
      return { isValid: false, error: 'A altura ("heightCm") deve ser um valor numérico entre 50 e 280 cm.' };
    }
  }

  // 6. Validate bodyPhotos (backward compatible: optional!)
  if ('bodyPhotos' in obj && obj.bodyPhotos !== undefined && obj.bodyPhotos !== null) {
    if (!Array.isArray(obj.bodyPhotos)) {
      return { isValid: false, error: 'A seção de fotos ("bodyPhotos") deve ser uma lista.' };
    }
    for (let i = 0; i < obj.bodyPhotos.length; i++) {
      const p = obj.bodyPhotos[i];
      if (
        typeof p !== 'object' ||
        p === null ||
        typeof p.id !== 'string' ||
        !p.id ||
        typeof p.date !== 'string' ||
        !p.date ||
        typeof p.photoDataUrl !== 'string' ||
        !p.photoDataUrl
      ) {
        return {
          isValid: false,
          error: `A foto no índice ${i} contém campos obrigatórios ausentes ou inválidos.`
        };
      }
    }
  }

  return {
    isValid: true,
    data: obj as FitHomeBackup
  };
}
