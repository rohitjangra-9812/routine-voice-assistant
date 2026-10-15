import React from 'react';
import { AlertLogEntry } from '../types.ts';
import { Volume2, Bell, Clock, Trash2, CheckCircle } from 'lucide-react';

interface AlertHistoryLogProps {
  logs: AlertLogEntry[];
  onReplayAlert: (entry: AlertLogEntry) => void;
  onClearLogs: () => void;
}

export const AlertHistoryLog: React.FC<AlertHistoryLogProps> = ({
  logs,
  onReplayAlert,
  onClearLogs,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            Triggered Voice & Notification History
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of triggered voice reminders and browser notifications.
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Volume2 className="w-4 h-4" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{log.eventTitle}</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-700/40">
                    {log.eventTime}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {log.type === 'buffer' ? `${log.leadTimeMinutes}m Alert` : 'Exact Start'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-1 italic">"{log.spokenText}"</p>

                <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Triggered at {log.triggeredAt}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onReplayAlert(log)}
              className="px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Replay Voice</span>
            </button>
          </div>
        ))}

        {logs.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium">No alerts triggered yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              Triggered voice reminders will appear here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
