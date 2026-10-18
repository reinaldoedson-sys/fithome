import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pt } from '../../i18n/translations/pt';
import { en } from '../../i18n/translations/en';
import { es } from '../../i18n/translations/es';
import { speakVoiceAlert, setVoiceEnabled } from '../audio';
import { MUSCLE_LABELS, HOME_EQUIPMENT_LABELS } from '../../data/exercises';
import { HomeEquipment, MuscleGroup } from '../../types/workout';

describe('FitHome Multi-Language (i18n) Test Suite', () => {
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

  class MockUtterance {
    text: string;
    lang = '';
    rate = 1;
    pitch = 1;
    voice: unknown = null;
    constructor(text: string) {
      this.text = text;
    }
  }

  let cancelMock = vi.fn();
  let speakMock = vi.fn();

  beforeEach(() => {
    mockStorage = {};
    vi.restoreAllMocks();

    cancelMock = vi.fn();
    speakMock = vi.fn();

    const mockWindow = {
      localStorage: fakeStorage,
      speechSynthesis: {
        cancel: cancelMock,
        speak: speakMock,
        getVoices: () => [
          { lang: 'pt-BR', name: 'Portuguese Voice' },
          { lang: 'en-US', name: 'English Voice' },
          { lang: 'es-ES', name: 'Spanish Voice' }
        ]
      }
    };

    (globalThis as any).window = mockWindow;
    (globalThis as any).localStorage = fakeStorage;
    (globalThis as any).SpeechSynthesisUtterance = MockUtterance;
  });

  it('1. Verifies that all 3 language dictionaries (pt, en, es) provide complete and non-empty translation structures', () => {
    const dicts = [
      { name: 'pt', dict: pt },
      { name: 'en', dict: en },
      { name: 'es', dict: es }
    ];

    dicts.forEach(({ name, dict }) => {
      expect(dict.nav.progress, `${name} nav.progress`).toBeTruthy();
      expect(dict.nav.evolution, `${name} nav.evolution`).toBeTruthy();
      expect(dict.nav.exercises, `${name} nav.exercises`).toBeTruthy();
      expect(dict.nav.routines, `${name} nav.routines`).toBeTruthy();
      expect(dict.nav.history, `${name} nav.history`).toBeTruthy();
      expect(dict.nav.historyCount(3), `${name} nav.historyCount`).toContain('3');

      expect(dict.common.save, `${name} common.save`).toBeTruthy();
      expect(dict.common.cancel, `${name} common.cancel`).toBeTruthy();
      expect(dict.common.delete, `${name} common.delete`).toBeTruthy();
      expect(dict.common.startWorkout, `${name} common.startWorkout`).toBeTruthy();
      expect(dict.common.cloudActive, `${name} common.cloudActive`).toBeTruthy();

      expect(dict.pwa.installButton, `${name} pwa.installButton`).toBeTruthy();
      expect(dict.restTimer.title, `${name} restTimer.title`).toBeTruthy();
      expect(dict.restTimer.voiceFinishMessage, `${name} restTimer.voiceFinishMessage`).toBeTruthy();

      expect(dict.routines.title, `${name} routines.title`).toBeTruthy();
      expect(dict.routines.tabPresets, `${name} routines.tabPresets`).toBeTruthy();
      expect(dict.routines.tabCustom, `${name} routines.tabCustom`).toBeTruthy();

      expect(dict.streak.activeStreak, `${name} streak.activeStreak`).toBeTruthy();
      expect(dict.streak.longestStreak, `${name} streak.longestStreak`).toBeTruthy();

      expect(dict.workoutActive.finish, `${name} workoutActive.finish`).toBeTruthy();
      expect(dict.workoutActive.addExercise, `${name} workoutActive.addExercise`).toBeTruthy();
      expect(dict.workoutActive.warmup, `${name} workoutActive.warmup`).toBeTruthy();
      expect(dict.workoutActive.normal, `${name} workoutActive.normal`).toBeTruthy();
      expect(dict.workoutActive.dropset, `${name} workoutActive.dropset`).toBeTruthy();
      expect(dict.workoutActive.failure, `${name} workoutActive.failure`).toBeTruthy();
    });
  });

  it('2. Verifies that muscle labels and equipment labels contain valid translations for pt, en, and es', () => {
    const muscles: MuscleGroup[] = ['chest', 'lats', 'shoulders', 'biceps', 'abs', 'quads', 'glutes'];
    muscles.forEach(m => {
      const label = MUSCLE_LABELS[m];
      expect(label.pt, `Muscle ${m} pt`).toBeTruthy();
      expect(label.en, `Muscle ${m} en`).toBeTruthy();
      expect(label.es, `Muscle ${m} es`).toBeTruthy();
    });

    const equipmentList: HomeEquipment[] = ['bodyweight', 'chair', 'backpack', 'resistance_band', 'towel', 'wall', 'dumbbell'];
    equipmentList.forEach(eq => {
      const label = HOME_EQUIPMENT_LABELS[eq];
      expect(label.pt, `Equipment ${eq} pt`).toBeTruthy();
      expect(label.en, `Equipment ${eq} en`).toBeTruthy();
      expect(label.es, `Equipment ${eq} es`).toBeTruthy();
      expect(label.icon, `Equipment ${eq} icon`).toBeTruthy();
    });
  });

  it('3. Verifies voice speech synthesizer handles pt, en, and es calls gracefully without crashing', () => {
    setVoiceEnabled(true);

    expect(() => speakVoiceAlert('Descanso finalizado!', 'pt')).not.toThrow();
    expect(speakMock).toHaveBeenCalled();

    expect(() => speakVoiceAlert('Rest finished!', 'en')).not.toThrow();
    expect(() => speakVoiceAlert('¡Descanso terminado!', 'es')).not.toThrow();
  });
});
