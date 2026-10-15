import React from 'react';
import { ScheduleEvent, CategoryType } from '../types.ts';
import { timeToMinutes, format12Hour } from '../utils/scheduleLogic.ts';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface TimelineViewProps {
  events: ScheduleEvent[];
  currentTime: Date;
  onSelectEvent?: (event: ScheduleEvent) => void;
}

const CATEGORY_COLORS: Record<CategoryType, { bg: string; border: string; text: string; badgeBg: string }> = {
  meeting: {
    bg: 'bg-indigo-900/40',
    border: 'border-indigo-500/60',
    text: 'text-indigo-200',
    badgeBg: 'bg-indigo-600',
  },
  routine: {
    bg: 'bg-emerald-900/40',
    border: 'border-emerald-500/60',
    text: 'text-emerald-200',
    badgeBg: 'bg-emerald-600',
  },
  focus: {
    bg: 'bg-amber-900/40',
    border: 'border-amber-500/60',
    text: 'text-amber-200',
    badgeBg: 'bg-amber-600',
  },
  break: {
    bg: 'bg-sky-900/40',
    border: 'border-sky-500/60',
    text: 'text-sky-200',
    badgeBg: 'bg-sky-600',
  },
  fitness: {
    bg: 'bg-rose-900/40',
    border: 'border-rose-500/60',
    text: 'text-rose-200',
    badgeBg: 'bg-rose-600',
  },
  personal: {
    bg: 'bg-purple-900/40',
    border: 'border-purple-500/60',
    text: 'text-purple-200',
    badgeBg: 'bg-purple-600',
  },
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  currentTime,
  onSelectEvent,
}) => {
  const currentMinutesMidnight = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentNeedlePercentage = (currentMinutesMidnight / 1440) * 100;

  // Generate 24 hours markers (00:00 to 23:00)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            24-Hour Visual Schedule Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time visual map of your daily routine. The red needle indicates current system time.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-300">
          {(Object.keys(CATEGORY_COLORS) as CategoryType[]).map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[cat].badgeBg}`} />
              <span className="capitalize text-slate-400 text-[11px]">{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Scrollable Container */}
      <div className="relative overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="min-w-[900px] relative">
          {/* Hour Labels */}
          <div className="grid grid-cols-24 gap-0 border-b border-slate-800 pb-2 mb-4 text-center text-[10px] font-mono text-slate-400">
            {hours.map((h) => (
              <div key={h} className="border-l border-slate-800/80 pl-0.5 text-left">
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Timeline Grid Track */}
          <div className="relative h-48 bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden">
            {/* Background Hour Columns */}
            <div className="absolute inset-0 grid grid-cols-24 pointer-events-none">
              {hours.map((h) => (
                <div key={h} className="border-r border-slate-800/40 h-full" />
              ))}
            </div>

            {/* Current Time Needle */}
            <div
              className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
              style={{ left: `${currentNeedlePercentage}%` }}
            >
              <div className="w-3 h-3 bg-rose-500 rounded-full shadow-lg shadow-rose-500/50 -mt-1.5 border border-white" />
              <div className="w-0.5 h-full bg-rose-500 shadow-sm" />
            </div>

            {/* Event Cards on Timeline */}
            {events.map((event) => {
              const startMins = timeToMinutes(event.time);
              const duration = Math.max(event.durationMinutes, 20); // min 20 min block for visibility
              const leftPercent = (startMins / 1440) * 100;
              const widthPercent = (duration / 1440) * 100;

              const styleProps = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.routine;

              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent?.(event)}
                  className={`absolute top-4 bottom-4 rounded-lg border p-2 text-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:z-30 shadow-md ${styleProps.bg} ${styleProps.border} ${styleProps.text}`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.max(widthPercent, 3.5)}%`,
                  }}
                  title={`${event.title} (${format12Hour(event.time)} - ${event.durationMinutes}m)`}
                >
                  <div className="font-bold line-clamp-1 leading-tight text-[11px]">
                    {event.title}
                  </div>
                  <div className="text-[10px] font-mono opacity-80 flex items-center justify-between mt-1">
                    <span>{format12Hour(event.time)}</span>
                    <span>{event.durationMinutes}m</span>
                  </div>
                </div>
              );
            })}

            {events.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>No events on timeline. Add your routine below!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
