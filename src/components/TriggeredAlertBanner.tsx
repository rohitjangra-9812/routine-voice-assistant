import React from 'react';
import { ScheduleEvent } from '../types.ts';
import { format12Hour } from '../utils/scheduleLogic.ts';
import { Volume2, BellRing, Clock, X, Check, RotateCcw } from 'lucide-react';

interface TriggeredAlertBannerProps {
  activeAlert: {
    event: ScheduleEvent;
    triggerType: 'buffer' | 'exact';
    leadTimeMinutes: number;
    spokenText: string;
  } | null;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
  onReplaySpeech: () => void;
}

export const TriggeredAlertBanner: React.FC<TriggeredAlertBannerProps> = ({
  activeAlert,
  onDismiss,
  onSnooze,
  onReplaySpeech,
}) => {
  if (!activeAlert) return null;

  const { event, triggerType, leadTimeMinutes, spokenText } = activeAlert;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 border-2 border-indigo-500 rounded-2xl p-5 shadow-2xl shadow-indigo-950/80 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 animate-bounce">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>{triggerType === 'buffer' ? `${leadTimeMinutes} Minute Alert Buffer` : 'Starting Now!'}</span>
            </div>
            <h4 className="text-base font-bold text-white line-clamp-1">{event.title}</h4>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-200">
        <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Scheduled: {format12Hour(event.time)}
          </span>
          <span className="capitalize text-indigo-300 font-semibold">{event.category}</span>
        </div>

        <p className="italic text-indigo-100 font-medium text-xs mt-1">"{spokenText}"</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-slate-800">
        <button
          onClick={onReplaySpeech}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-lg transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Replay Voice</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSnooze(5)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Snooze 5m</span>
          </button>

          <button
            onClick={onDismiss}
            className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Acknowledge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
