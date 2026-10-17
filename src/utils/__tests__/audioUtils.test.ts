import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isSoundEnabled,
  setSoundEnabled,
  isVoiceEnabled,
  setVoiceEnabled,
  playCountdownBeep,
  playTimerBeep,
  speakVoiceAlert
} from '../audio';

describe('Audio and Voice Utilities', () => {
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

  beforeEach(() => {
    mockStorage = {};
    vi.restoreAllMocks();

    const mockWindow = {
      AudioContext: vi.fn().mockImplementation(() => ({
        currentTime: 0,
        destination: {},
        createOscillator: () => ({
          type: 'sine',
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn()
        }),
        createGain: () => ({
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
          },
          connect: vi.fn()
        })
      })),
      localStorage: fakeStorage
    };

    (global as unknown as { window: unknown }).window = mockWindow;
    (global as unknown as { localStorage: Storage }).localStorage = fakeStorage;
  });

  it('1. Defaults sound and voice to enabled when not set in localStorage', () => {
    expect(isSoundEnabled()).toBe(true);
    expect(isVoiceEnabled()).toBe(true);
  });

  it('2. Updates and persists sound enabled preference', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    expect(mockStorage['fithome_sound_enabled']).toBe('false');

    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
    expect(mockStorage['fithome_sound_enabled']).toBe('true');
  });

  it('3. Updates and persists voice enabled preference', () => {
    setVoiceEnabled(false);
    expect(isVoiceEnabled()).toBe(false);
    expect(mockStorage['fithome_voice_enabled']).toBe('false');

    setVoiceEnabled(true);
    expect(isVoiceEnabled()).toBe(true);
    expect(mockStorage['fithome_voice_enabled']).toBe('true');
  });

  it('4. Executes countdown beeps and timer chimes safely without crashing in node/browser', () => {
    expect(() => {
      playCountdownBeep(3);
      playCountdownBeep(2);
      playCountdownBeep(1);
      playTimerBeep(false);
      playTimerBeep(true);
    }).not.toThrow();
  });

  it('5. Executes voice alert safely with speech synthesis mock', () => {
    const cancelMock = vi.fn();
    const speakMock = vi.fn();
    const getVoicesMock = vi.fn().mockReturnValue([
      { lang: 'pt-BR', name: 'Portuguese Voice' },
      { lang: 'en-US', name: 'English Voice' }
    ]);

    // Mock SpeechSynthesisUtterance
    class MockUtterance {
      text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      voice = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    (global as unknown as { SpeechSynthesisUtterance: typeof MockUtterance }).SpeechSynthesisUtterance = MockUtterance;

    // Attach speechSynthesis to window
    (global.window as unknown as { speechSynthesis: unknown }).speechSynthesis = {
      cancel: cancelMock,
      speak: speakMock,
      getVoices: getVoicesMock
    };

    speakVoiceAlert('Descanso finalizado!');
    expect(cancelMock).toHaveBeenCalled();
    expect(speakMock).toHaveBeenCalled();

    // When voice is disabled, speech is not called
    setVoiceEnabled(false);
    speakMock.mockClear();
    speakVoiceAlert('Não deve falar');
    expect(speakMock).not.toHaveBeenCalled();
  });
});
