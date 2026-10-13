export type MuscleGroup =
  | 'chest'
  | 'lats'
  | 'traps'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'lower_back';

export type HomeEquipment =
  | 'bodyweight'       // Apenas peso do corpo (zero equipamento)
  | 'chair'            // Cadeira, sofá ou degrau
  | 'backpack'         // Mochila com livros ou garrafas (sobrecarga caseira)
  | 'resistance_band'  // Faixa elástica / Extensor
  | 'towel'            // Toalha (para puxadas e deslizamento)
  | 'wall'             // Parede
  | 'dumbbell';        // Halteres caseiros / Pesinhos

export interface Exercise {
  id: string;
  name: string;
  namePt: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: HomeEquipment;
  measurementType: 'reps' | 'seconds'; // repetições ou tempo sob tensão / isometria
  apartmentFriendly: boolean; // sem barulho / sem saltos para quem mora em apartamento
  difficulty: 'iniciante' | 'intermediario' | 'avancado';
  instructions: string[];
  homeTips: string[];
}

export type SetType = 'warmup' | 'normal' | 'dropset' | 'failure';

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weightKg: number; // 0 para apenas peso do corpo, ou kg da mochila/peso
  repsOrSeconds: number; // número de reps ou segundos (ex: 45s de prancha)
  completed: boolean;
  rpe?: number;
  previousRecord?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  durationSeconds: number;
  exercises: WorkoutExercise[];
  totalVolumeKg: number;
  totalSets: number;
  notes?: string;
}

export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  targetMuscles: MuscleGroup[];
  equipmentNeeded: HomeEquipment[];
  durationMinutes: number;
  apartmentFriendly: boolean;
  exercises: {
    exerciseId: string;
    defaultSets: number;
    defaultTarget: number; // reps ou segundos
  }[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxScore: number; // reps ou kg ou segundos
  metricLabel: string; // 'reps', 'kg' ou 'segundos'
  achievedAt: string;
}
