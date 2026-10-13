export interface WeightEntry {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  weightKg: number;
  notes?: string;
  createdAt: string;
}

export interface BodyMeasurements {
  cintura?: number;
  abdomen?: number;
  peito?: number;
  quadril?: number;
  pescoco?: number;
  bracoEsquerdo?: number;
  bracoDireito?: number;
  antebracoEsquerdo?: number;
  antebracoDireito?: number;
  coxaEsquerda?: number;
  coxaDireita?: number;
  panturrilhaEsquerda?: number;
  panturrilhaDireita?: number;
}

export type MeasurementKey = keyof BodyMeasurements;

export interface MeasurementEntry {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  measurements: BodyMeasurements;
  notes?: string;
  createdAt: string;
}

export interface BodyGoal {
  targetWeightKg?: number;
  targetDate?: string;
  customInitialWeightKg?: number; // Optional override for reference baseline
  notes?: string;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  photoDataUrl: string;
  category?: 'frente' | 'costas' | 'lado' | 'outro';
  notes?: string;
  createdAt: string;
}

export const MEASUREMENT_LABELS: Record<MeasurementKey, { name: string; short: string }> = {
  cintura: { name: 'Cintura', short: 'Cintura' },
  abdomen: { name: 'Abdômen', short: 'Abdômen' },
  peito: { name: 'Peito / Tórax', short: 'Peito' },
  quadril: { name: 'Quadril', short: 'Quadril' },
  pescoco: { name: 'Pescoço', short: 'Pescoço' },
  bracoEsquerdo: { name: 'Braço Esquerdo', short: 'Braço Esq.' },
  bracoDireito: { name: 'Braço Direito', short: 'Braço Dir.' },
  antebracoEsquerdo: { name: 'Antebraço Esquerdo', short: 'Anteb. Esq.' },
  antebracoDireito: { name: 'Antebraço Direito', short: 'Anteb. Dir.' },
  coxaEsquerda: { name: 'Coxa Esquerda', short: 'Coxa Esq.' },
  coxaDireita: { name: 'Coxa Direita', short: 'Coxa Dir.' },
  panturrilhaEsquerda: { name: 'Panturrilha Esquerda', short: 'Panturr. Esq.' },
  panturrilhaDireita: { name: 'Panturrilha Direita', short: 'Panturr. Dir.' }
};
