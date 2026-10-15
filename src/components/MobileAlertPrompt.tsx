import React, { useState } from 'react';
import { unlockMobileAudio, vibrateMobile } from '../utils/mobileAudioUnlock.ts';
import { requestNotificationPermission } from '../utils/notification.ts';
import { requestScreenWakeLock } from '../utils/wakeLock.ts';
import { BellRing, Smartphone, ShieldCheck, Check, Sparkles } from 'lucide-react';

interface MobileAlertPromptProps {
  onPermissionsGranted: (perm: NotificationPermission) => void;
  isWakeLockOn: boolean;
  setIsWakeLockOn: (active: boolean) => void;
}

export const MobileAlertPrompt: React.FC<MobileAlertPromptProps> = ({
  onPermissionsGranted,
  isWakeLockOn,
  setIsWakeLockOn,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  if (isDismissed) return null;

  const handleEnableMobileAlerts = async () => {
    // 1. Unlock mobile Web Audio & Speech synthesis
    unlockMobileAudio();

    // 2. Request Notification permissions
    const perm = await requestNotificationPermission();
    onPermissionsGranted(perm);

    // 3. Test vibration pattern [200, 100, 200]
    vibrateMobile([200, 100, 200]);

    // 4. Request Screen Wake Lock
    const wakeLockSuccess = await requestScreenWakeLock();
    setIsWakeLockOn(wakeLockSuccess);

    setIsActivated(true);
    setTimeout(() => {
      setIsDismissed(true);
    }, 2500);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-y border-indigo-800/60 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
            <Smartphone className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Enable Mobile Alerts & Voice Synthesizer</h4>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                Mobile Recommended
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Tap to unlock mobile audio playback, grant background push notifications with vibration pattern <code className="font-mono text-indigo-300">[200, 100, 200]</code>, and keep screen awake.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {isActivated ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-4 py-2 rounded-xl">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Mobile Audio & Alerts Unlocked!</span>
            </div>
          ) : (
            <button
              onClick={handleEnableMobileAlerts}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-950/80 transition-all hover:scale-105"
            >
              <BellRing className="w-4 h-4 text-white" />
              <span>Enable Mobile Alerts</span>
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
