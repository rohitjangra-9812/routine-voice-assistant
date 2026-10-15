import React from 'react';
import { Play, Pause, BellRing, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { ScheduleEvent, VoiceSettings } from '../types.ts';
import { format12Hour, formatCountdown } from '../utils/scheduleLogic.ts';

interface ClockHeaderProps {
  currentTime: Date;
  isTracking: boolean;
  onToggleTracking: () => void;
  voiceSettings: VoiceSettings;
  onUpdateGlobalBuffer: (minutes: number) => void;
  nextEvent: { event: ScheduleEvent; remainingSeconds: number } | null;
  onTriggerInstantAlert: (event: ScheduleEvent) => void;
}

export const ClockHeader: React.FC<ClockHeaderProps> = ({
  currentTime,
  isTracking,
  onToggleTracking,
  voiceSettings,
  onUpdateGlobalBuffer,
  nextEvent,
  onTriggerInstantAlert,
}) => {
  const hours = currentTime.getHours().toString().padStart(2, '0');
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  const seconds = currentTime.getSeconds().toString().padStart(2, '0');

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-6 text-slate-100">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Digital Clock & Tracking Toggle */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Live System Time
            </span>
            <button
              onClick={onToggleTracking}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                isTracking
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/60'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {isTracking ? (
                <>
                  <Pause className="w-3 h-3 text-emerald-400" />
                  <span>Tracking Active</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-slate-400" />
                  <span>Paused</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-baseline gap-3">
            <div className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums tracking-tight text-white">
              {hours}:{minutes}:<span className="text-indigo-400 text-3xl sm:text-4xl">{seconds}</span>
            </div>
            <span className="text-sm font-semibold text-slate-400 font-mono">
              {currentTime.getHours() >= 12 ? 'PM' : 'AM'}
            </span>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>{formattedDate}</span>
            <span>·</span>
            <span>Local Time</span>
          </div>
        </div>

        {/* Global Alert Buffer Quick Selector */}
        <div className="lg:col-span-3 flex flex-col gap-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-indigo-400" />
              Default Alert Trigger
            </span>
            <span className="text-[11px] text-slate-400">Before event</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-1">
            {[10, 15, 20].map((mins) => {
              const isSelected = voiceSettings.globalLeadTimeMinutes === mins;
              return (
                <button
                  key={mins}
                  onClick={() => onUpdateGlobalBuffer(mins)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {mins} min
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
            Voice and browser push alerts fire {voiceSettings.globalLeadTimeMinutes}m before scheduled items.
          </p>
        </div>

        {/* Next Event Spotlight Card */}
        <div className="lg:col-span-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-4 flex flex-col justify-between min-h-[110px]">
          {nextEvent ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Next Event Spotlight
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-1 line-clamp-1">
                    {nextEvent.event.title}
                  </h4>
                </div>
                <span className="text-xs font-bold font-mono text-indigo-300 bg-indigo-900/50 border border-indigo-700/50 px-2 py-0.5 rounded">
                  {format12Hour(nextEvent.event.time)}
                </span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="text-slate-400">Starts in:</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {formatCountdown(nextEvent.remainingSeconds)}
                  </span>
                </div>

                <button
                  onClick={() => onTriggerInstantAlert(nextEvent.event)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                >
                  Preview Alert
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-3 text-center">
              <AlertCircle className="w-5 h-5 text-slate-600 mb-1" />
              <p className="text-xs font-medium text-slate-400">No upcoming events scheduled for today.</p>
              <p className="text-[11px] text-slate-500">Add schedule items below to activate voice reminders.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
