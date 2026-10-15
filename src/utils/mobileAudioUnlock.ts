/**
 * Unlocks Web Audio API and SpeechSynthesis on mobile browsers via user gesture
 */
let isUnlocked = false;

export function unlockMobileAudio(): void {
  if (isUnlocked || typeof window === 'undefined') return;

  try {
    // 1. Unlock Web Audio Context
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    }

    // 2. Warm up SpeechSynthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      window.speechSynthesis.speak(silentUtterance);
    }

    isUnlocked = true;
    console.log('Mobile audio context & speech synthesis unlocked successfully');
  } catch (err) {
    console.warn('Mobile audio unlock attempt failed:', err);
  }
}

/**
 * Triggers mobile device haptic vibration pattern
 */
export function vibrateMobile(pattern: number[] = [200, 100, 200]): boolean {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
      return true;
    } catch (err) {
      console.warn('Vibration API error:', err);
    }
  }
  return false;
}
