import { VoiceSettings } from '../types.ts';

/**
 * Plays a pleasant modern double chime sound using Web Audio API (no external asset needed)
 */
export function playChimeSound(volume: number = 0.8): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }

      const ctx = new AudioCtx();
      
      // First high frequency tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(volume * 0.3, ctx.currentTime + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Second harmonizing tone delayed by 150ms
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.35); // D6
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
      gain2.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.45);

      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.65);

      setTimeout(() => {
        ctx.close();
        resolve();
      }, 700);
    } catch (e) {
      console.warn('AudioContext chime error:', e);
      resolve();
    }
  });
}

/**
 * Gets available Web Speech API voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Speaks text using Web Speech API with configured settings
 */
export async function speakText(
  text: string,
  settings: VoiceSettings,
  onEnd?: () => void
): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis API not supported in this browser.');
    onEnd?.();
    return;
  }

  // Optionally play chime first
  if (settings.chimeSound) {
    await playChimeSound(settings.volume);
  }

  window.speechSynthesis.cancel(); // Stop any pending speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;

  const voices = getAvailableVoices();
  if (settings.voiceURI && voices.length > 0) {
    const selected = voices.find((v) => v.voiceURI === settings.voiceURI);
    if (selected) {
      utterance.voice = selected;
    }
  }

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.error('Speech error:', e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}
