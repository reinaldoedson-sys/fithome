import { RoutineTemplate } from '../types/workout';

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'full-body-home-zero',
    name: 'Full Body Casa - Zero Equipamento (20 min)',
    description: 'Treino completo para o corpo todo usando apenas o peso corporal no chão da sala. Excelente para começar hoje mesmo.',
    targetMuscles: ['quads', 'chest', 'abs', 'traps'],
    equipmentNeeded: ['bodyweight', 'wall'],
    durationMinutes: 20,
    apartmentFriendly: true,
    exercises: [
      { exerciseId: 'air-squat', defaultSets: 3, defaultTarget: 15 },
      { exerciseId: 'pushup-standard', defaultSets: 3, defaultTarget: 10 },
      { exerciseId: 'wall-sit-isometric', defaultSets: 3, defaultTarget: 40 }, // 40 segundos
      { exerciseId: 'scapular-ytw-prone', defaultSets: 3, defaultTarget: 10 },
      { exerciseId: 'plank-forearms', defaultSets: 3, defaultTarget: 35 } // 35 segundos
    ]
  },
  {
    id: 'upper-body-home',
    name: 'Superior em Casa - Peito, Costas & Braços',
    description: 'Estimule peitoral, dorsais, ombros e braços usando flexões, mesa firme e o sofá.',
    targetMuscles: ['chest', 'lats', 'triceps', 'shoulders', 'biceps'],
    equipmentNeeded: ['bodyweight', 'chair', 'towel'],
    durationMinutes: 25,
    apartmentFriendly: true,
    exercises: [
      { exerciseId: 'pushup-standard', defaultSets: 4, defaultTarget: 12 },
      { exerciseId: 'table-inverted-row', defaultSets: 3, defaultTarget: 10 },
      { exerciseId: 'chair-dips', defaultSets: 3, defaultTarget: 12 },
      { exerciseId: 'superman-towel-pulldown', defaultSets: 3, defaultTarget: 12 },
      { exerciseId: 'pike-pushup', defaultSets: 3, defaultTarget: 8 },
      { exerciseId: 'diamond-pushup', defaultSets: 3, defaultTarget: 8 }
    ]
  },
  {
    id: 'legs-glutes-home',
    name: 'Pernas & Glúteos em Casa (Coxas Firmes)',
    description: 'Hipertrofia de quadríceps, posteriores e glúteos combinando sofá, parede e toalha no chão.',
    targetMuscles: ['quads', 'glutes', 'hamstrings', 'calves'],
    equipmentNeeded: ['chair', 'wall', 'towel', 'bodyweight'],
    durationMinutes: 25,
    apartmentFriendly: true,
    exercises: [
      { exerciseId: 'bulgarian-split-squat-couch', defaultSets: 3, defaultTarget: 12 },
      { exerciseId: 'couch-hip-thrust', defaultSets: 4, defaultTarget: 15 },
      { exerciseId: 'wall-sit-isometric', defaultSets: 3, defaultTarget: 45 },
      { exerciseId: 'towel-hamstring-curls', defaultSets: 3, defaultTarget: 10 },
      { exerciseId: 'calf-raise-stairs', defaultSets: 4, defaultTarget: 15 }
    ]
  },
  {
    id: 'core-abs-apartment',
    name: 'Core & Abdômen Definido (Silencioso p/ Apartamento)',
    description: 'Sequência intensa de abdômen e estabilidade lombar sem saltos, sem barulho e sem impacto no piso.',
    targetMuscles: ['abs', 'lower_back'],
    equipmentNeeded: ['bodyweight'],
    durationMinutes: 15,
    apartmentFriendly: true,
    exercises: [
      { exerciseId: 'plank-forearms', defaultSets: 3, defaultTarget: 45 },
      { exerciseId: 'bicycle-crunches', defaultSets: 3, defaultTarget: 20 },
      { exerciseId: 'mountain-climbers-silent', defaultSets: 3, defaultTarget: 20 },
      { exerciseId: 'side-plank', defaultSets: 3, defaultTarget: 30 },
      { exerciseId: 'hollow-body-hold', defaultSets: 3, defaultTarget: 25 }
    ]
  },
  {
    id: 'backpack-strength-home',
    name: 'Força em Casa com Mochila Carregada',
    description: 'Sobrecarga progressiva caseira: use uma mochila cheia de livros ou garrafas para treinar pesado na sala.',
    targetMuscles: ['lats', 'quads', 'biceps', 'chest', 'shoulders'],
    equipmentNeeded: ['backpack', 'bodyweight'],
    durationMinutes: 30,
    apartmentFriendly: true,
    exercises: [
      { exerciseId: 'backpack-bent-over-row', defaultSets: 4, defaultTarget: 12 },
      { exerciseId: 'air-squat', defaultSets: 4, defaultTarget: 15 },
      { exerciseId: 'pushup-standard', defaultSets: 4, defaultTarget: 12 },
      { exerciseId: 'backpack-biceps-curl', defaultSets: 3, defaultTarget: 12 },
      { exerciseId: 'lateral-raise-bottles', defaultSets: 3, defaultTarget: 15 }
    ]
  }
];
