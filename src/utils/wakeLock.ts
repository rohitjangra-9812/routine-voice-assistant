/**
 * Utility for managing Screen Wake Lock API so phone screen stays on
 */
let wakeLockSentinel: any = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
    console.warn('Screen Wake Lock API not supported on this browser.');
    return false;
  }

  try {
    wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
    console.log('Screen Wake Lock acquired: phone display will stay awake.');

    wakeLockSentinel.addEventListener('release', () => {
      console.log('Screen Wake Lock released.');
      wakeLockSentinel = null;
    });

    return true;
  } catch (err) {
    console.warn('Failed to acquire Screen Wake Lock:', err);
    return false;
  }
}

export async function releaseScreenWakeLock(): Promise<void> {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    } catch (err) {
      console.warn('Failed to release Screen Wake Lock:', err);
    }
  }
}

export function isWakeLockActive(): boolean {
  return wakeLockSentinel !== null && !wakeLockSentinel.released;
}
