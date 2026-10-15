import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall.ts';
import { Download, Smartphone, X, Share } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
        title="Add VoxRoutine to Home Screen"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                  <Share className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Install on iOS Safari</h3>
              </div>

              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>1. Tap the <strong>Share</strong> icon in the Safari navigation bar.</p>
                <p>2. Scroll down and select <strong>"Add to Home Screen"</strong>.</p>
                <p>3. Tap <strong>Add</strong> in the top right corner.</p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
