import { Language } from '../i18n/types';
import { Exercise, RoutineTemplate } from '../types/workout';

export const getLocaleCode = (lang: Language): string => {
  switch (lang) {
    case 'en':
      return 'en-US';
    case 'es':
      return 'es-ES';
    case 'pt':
    default:
      return 'pt-BR';
  }
};

export const getExerciseName = (exercise: Exercise, lang: Language): string => {
  if (lang === 'en') return exercise.name;
  if (lang === 'es') return (exercise as any).nameEs || exercise.name;
  return exercise.namePt || exercise.name;
};

// Localized preset template names and descriptions
const TEMPLATE_TRANSLATIONS: Record<
  string,
  {
    en: { name: string; desc: string };
    es: { name: string; desc: string };
  }
> = {
  'full-body-home-zero': {
    en: {
      name: 'Full Body Home - Zero Equipment (20 min)',
      desc: 'Complete full-body workout using only bodyweight on the living room floor. Great to start today.'
    },
    es: {
      name: 'Cuerpo Completo en Casa - Sin Equipamiento (20 min)',
      desc: 'Entrenamiento completo para todo el cuerpo usando solo el peso corporal. Excelente para empezar hoy mismo.'
    }
  },
  'upper-body-home': {
    en: {
      name: 'Upper Body Home - Chest, Back & Arms',
      desc: 'Stimulate chest, back, shoulders, and arms using push-ups, sturdy table, and couch.'
    },
    es: {
      name: 'Tren Superior en Casa - Pecho, Espalda y Brazos',
      desc: 'Estimula pectoral, dorsales, hombros y brazos usando flexiones, mesa firme y sofá.'
    }
  },
  'legs-glutes-home': {
    en: {
      name: 'Legs & Glutes Home (Firm Thighs)',
      desc: 'Quad, hamstring, and glute hypertrophy combining couch, wall, and towel on the floor.'
    },
    es: {
      name: 'Piernas y Glúteos en Casa (Piernas Firmes)',
      desc: 'Hipertrofia de cuádriceps, isquiotibiales y glúteos combinando sofá, pared y toalla en el suelo.'
    }
  },
  'core-abs-apartment': {
    en: {
      name: 'Core & Defined Abs (Silent for Apartment)',
      desc: 'Intense sequence for abdominal and core stability without jumps, noise, or floor impact.'
    },
    es: {
      name: 'Core y Abdomen Definido (Silencioso para Piso)',
      desc: 'Secuencia intensa para abdomen y estabilidad lumbar sin saltos, sin ruido y sin impacto.'
    }
  }
};

export const getTemplateName = (template: RoutineTemplate, lang: Language): string => {
  if (template.isCustom || lang === 'pt') return template.name;
  const translation = TEMPLATE_TRANSLATIONS[template.id]?.[lang];
  return translation ? translation.name : template.name;
};

export const getTemplateDescription = (template: RoutineTemplate, lang: Language): string => {
  if (template.isCustom || lang === 'pt') return template.description;
  const translation = TEMPLATE_TRANSLATIONS[template.id]?.[lang];
  return translation ? translation.desc : template.description;
};

export const formatDateLocalized = (
  date: Date | string,
  lang: Language,
  options?: Intl.DateTimeFormatOptions
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocaleCode(lang);
  return d.toLocaleDateString(locale, options);
};

export const formatDurationLocalized = (totalSecs: number, lang: Language): string => {
  const mins = Math.round(totalSecs / 60);
  if (lang === 'en') return `${mins} min`;
  if (lang === 'es') return `${mins} min`;
  return `${mins} min`;
};
