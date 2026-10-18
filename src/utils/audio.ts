// Web Audio API chime & countdown synthesizer and Voice Alerts for FitHome

const SOUND_PREF_KEY = 'fithome_sound_enabled';
const VOICE_PREF_KEY = 'fithome_voice_enabled';

export const isSoundEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(SOUND_PREF_KEY);
  return stored !== null ? stored === 'true' : true;
};

export const setSoundEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SOUND_PREF_KEY, String(enabled));
};

export const isVoiceEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(VOICE_PREF_KEY);
  return stored !== null ? stored === 'true' : true;
};

export const setVoiceEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(VOICE_PREF_KEY, String(enabled));
};

// Web Audio API single tone synthesizer
export const playTone = (frequency: number, durationSec: number = 0.15, type: OscillatorType = 'sine', gainVal: number = 0.2): void => {
  if (!isSoundEnabled()) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationSec + 0.05);
  } catch {
    // Audio context may be restricted before user gesture
  }
};

// Countdown beep for 3, 2, 1
export const playCountdownBeep = (secondsLeft: number): void => {
  if (!isSoundEnabled()) return;
  // Ascending frequency as time runs out: 3s -> 520Hz, 2s -> 660Hz, 1s -> 880Hz
  const freqMap: Record<number, number> = {
    3: 523.25,
    2: 659.25,
    1: 783.99
  };
  const freq = freqMap[secondsLeft] || 600;
  playTone(freq, 0.12, 'triangle', 0.2);
};

// Completion chime or tick
export const playTimerBeep = (isFinished = false): void => {
  if (!isSoundEnabled()) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (isFinished) {
      // 3 ascending energetic chime tones: C5, E5, G5, High C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);

        gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.1);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + index * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + index * 0.1);
        osc.stop(ctx.currentTime + index * 0.1 + 0.4);
      });
    } else {
      playTone(880, 0.08, 'triangle', 0.15);
    }
  } catch {
    // Audio context may be blocked by browser policy
  }
};

// Web SpeechSynthesis voice announcement with multi-language support (pt, en, es)
export const speakVoiceAlert = (text: string, langCode: 'pt' | 'en' | 'es' = 'pt'): void => {
  if (!isVoiceEnabled()) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (langCode === 'en') {
      utterance.lang = 'en-US';
    } else if (langCode === 'es') {
      utterance.lang = 'es-ES';
    } else {
      utterance.lang = 'pt-BR';
    }
    
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    let matchingVoice;
    if (langCode === 'en') {
      matchingVoice = voices.find(v => v.lang.startsWith('en') || v.lang.includes('US'));
    } else if (langCode === 'es') {
      matchingVoice = voices.find(v => v.lang.startsWith('es'));
    } else {
      matchingVoice = voices.find(v => v.lang.startsWith('pt') || v.lang.includes('BR'));
    }

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech synthesis might be restricted
  }
};
