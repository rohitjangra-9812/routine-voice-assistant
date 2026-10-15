import React from 'react';
import { Volume2, Bell, Sparkles, Clock, Calendar, Sun } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton.tsx';

interface NavbarProps {
  activeTab: 'dashboard' | 'timeline' | 'voice-settings' | 'history';
  setActiveTab: (tab: 'dashboard' | 'timeline' | 'voice-settings' | 'history') => void;
  onTestVoiceAndNotification: () => void;
  onOpenAIBriefing: () => void;
  isTracking: boolean;
  permissionState: NotificationPermission | 'unsupported';
  isWakeLockOn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onTestVoiceAndNotification,
  onOpenAIBriefing,
  isTracking,
  permissionState,
  isWakeLockOn,
}) => {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800 bg-slate-950 text-slate-100">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
          <Volume2 className="w-5 h-5" />
        </div>
        <div>
          <a href="#" className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 block">
            VoxRoutine
          </a>
          <div className="text-[11px] text-slate-400 font-medium leading-none flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{isTracking ? 'Assistant Active' : 'Paused'}</span>
            </span>
            {isWakeLockOn && (
              <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                <Sun className="w-3 h-3 text-amber-400" />
                <span>Awake</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'timeline'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('voice-settings')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'voice-settings'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Voice & Mobile</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Alert Logs</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action & Install Button */}
      <div className="flex items-center gap-2 shrink-0">
        {/* In-App PWA Install Prompt */}
        <PWAInstallButton />

        <button
          onClick={onOpenAIBriefing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-lg hover:bg-amber-900/40 transition-colors whitespace-nowrap shrink-0"
          title="AI Voice Briefing & Schedule Optimizer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">AI Briefing</span>
        </button>

        <button
          onClick={onTestVoiceAndNotification}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Test Alert</span>
        </button>
      </div>
    </header>
  );
};
