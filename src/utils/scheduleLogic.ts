import { ScheduleEvent, ScheduleConflict, CategoryType } from '../types.ts';

/**
 * Converts "HH:MM" (e.g., "09:30" or "14:15") to total minutes from midnight (0..1439)
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map((val) => parseInt(val, 10) || 0);
  return h * 60 + m;
}

/**
 * Formats total minutes from midnight back to "HH:MM" 24h format
 */
export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Formats "HH:MM" into readable 12-hour format "9:30 AM" or "2:15 PM"
 */
export function format12Hour(timeStr: string): string {
  const totalMins = timeToMinutes(timeStr);
  const h24 = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calculates remaining seconds until an event starting at eventTimeStr based on current HH:MM:SS
 */
export function getRemainingSeconds(eventTimeStr: string, now: Date = new Date()): number {
  const eventMinutes = timeToMinutes(eventTimeStr);
  const eventSecondsMidnight = eventMinutes * 60;

  const currentSecondsMidnight =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  let diff = eventSecondsMidnight - currentSecondsMidnight;
  // If event is earlier today (negative), assume next day or past event
  return diff;
}

/**
 * Formats seconds into "14m 22s" or "1h 10m" or "Started 5m ago"
 */
export function formatCountdown(seconds: number): string {
  if (seconds < 0) {
    const pastSeconds = Math.abs(seconds);
    if (pastSeconds < 60) return 'Just started';
    const pastMins = Math.floor(pastSeconds / 60);
    if (pastMins < 60) return `Started ${pastMins}m ago`;
    const pastHours = Math.floor(pastMins / 60);
    return `Started ${pastHours}h ${pastMins % 60}m ago`;
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const totalMins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (totalMins < 60) {
    return `${totalMins}m ${secs}s`;
  }

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Determines which events are currently due for an alert buffer check
 */
export function evaluateAlertTriggers(
  events: ScheduleEvent[],
  now: Date,
  globalLeadTimeMinutes: number,
  alreadyTriggeredSet: Set<string>, // Keys like `eventId:buffer` or `eventId:exact`
  repeatOnExactTime: boolean = true
): { event: ScheduleEvent; triggerType: 'buffer' | 'exact'; leadTimeMinutes: number }[] {
  const triggers: { event: ScheduleEvent; triggerType: 'buffer' | 'exact'; leadTimeMinutes: number }[] = [];

  const currentSecondsMidnight =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  for (const event of events) {
    if (!event.enabled || event.completed) continue;

    const eventMins = timeToMinutes(event.time);
    const eventSecsMidnight = eventMins * 60;
    const diffSeconds = eventSecsMidnight - currentSecondsMidnight;

    const leadMins = event.leadTimeMinutes ?? globalLeadTimeMinutes;
    const leadSecs = leadMins * 60;

    const bufferKey = `${event.id}:buffer:${leadMins}`;
    const exactKey = `${event.id}:exact`;

    // Buffer trigger condition: within [leadSecs - 30, leadSecs + 30] window
    if (
      diffSeconds <= leadSecs &&
      diffSeconds >= leadSecs - 45 &&
      !alreadyTriggeredSet.has(bufferKey)
    ) {
      triggers.push({ event, triggerType: 'buffer', leadTimeMinutes: leadMins });
      alreadyTriggeredSet.add(bufferKey);
    }

    // Exact start condition: within [-15, 30] seconds of starting
    if (
      repeatOnExactTime &&
      diffSeconds <= 30 &&
      diffSeconds >= -15 &&
      !alreadyTriggeredSet.has(exactKey)
    ) {
      triggers.push({ event, triggerType: 'exact', leadTimeMinutes: 0 });
      alreadyTriggeredSet.add(exactKey);
    }
  }

  return triggers;
}

/**
 * Finds upcoming events sorted by start time
 */
export function getUpcomingEvents(
  events: ScheduleEvent[],
  now: Date = new Date()
): { event: ScheduleEvent; remainingSeconds: number }[] {
  const currentSecondsMidnight =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  return events
    .map((event) => {
      const eventSecs = timeToMinutes(event.time) * 60;
      const remainingSeconds = eventSecs - currentSecondsMidnight;
      return { event, remainingSeconds };
    })
    .filter((item) => item.remainingSeconds > -item.event.durationMinutes * 60) // Show ongoing or future
    .sort((a, b) => a.remainingSeconds - b.remainingSeconds);
}

/**
 * Detects schedule overlaps
 */
export function findScheduleConflicts(events: ScheduleEvent[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const sorted = [...events].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const startA = timeToMinutes(sorted[i].time);
      const endA = startA + sorted[i].durationMinutes;
      const startB = timeToMinutes(sorted[j].time);
      const endB = startB + sorted[j].durationMinutes;

      if (startB < endA && startA < endB) {
        const overlapStart = Math.max(startA, startB);
        const overlapEnd = Math.min(endA, endB);
        conflicts.push({
          eventA: sorted[i],
          eventB: sorted[j],
          overlapMinutes: overlapEnd - overlapStart,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Pre-loaded sample routine templates
 */
export function getSampleEvents(): ScheduleEvent[] {
  const today = new Date();
  const currentHour = today.getHours();

  // Dynamically offset sample times relative to current time so user sees upcoming alerts right away!
  const pad = (n: number) => n.toString().padStart(2, '0');

  const t1 = `${pad((currentHour + 0) % 24)}:15`;
  const t2 = `${pad((currentHour + 1) % 24)}:00`;
  const t3 = `${pad((currentHour + 2) % 24)}:30`;
  const t4 = `${pad((currentHour + 4) % 24)}:00`;
  const t5 = `${pad((currentHour + 6) % 24)}:30`;

  return [
    {
      id: 'sample-1',
      title: 'Morning Sync & Focus Block',
      category: 'routine',
      time: t1,
      durationMinutes: 45,
      leadTimeMinutes: 10,
      priority: 'high',
      notes: 'Review daily targets and clear high priority inbox items.',
      location: 'Workstation / Slack',
      enabled: true,
      completed: false,
    },
    {
      id: 'sample-2',
      title: 'Engineering Team Standup',
      category: 'meeting',
      time: t2,
      durationMinutes: 30,
      leadTimeMinutes: 15,
      priority: 'high',
      notes: 'Sprint progress update & obstacle review.',
      location: 'Google Meet / Conference Room A',
      enabled: true,
      completed: false,
    },
    {
      id: 'sample-3',
      title: 'Lunch & Screen-Free Recharge',
      category: 'break',
      time: t3,
      durationMinutes: 60,
      leadTimeMinutes: 10,
      priority: 'medium',
      notes: 'Step away from screen, hydration, and healthy lunch.',
      enabled: true,
      completed: false,
    },
    {
      id: 'sample-4',
      title: 'Deep Architecture & Design Session',
      category: 'focus',
      time: t4,
      durationMinutes: 90,
      leadTimeMinutes: 20,
      priority: 'high',
      notes: 'Focus mode active. Block notifications for deep work.',
      enabled: true,
      completed: false,
    },
    {
      id: 'sample-5',
      title: 'Evening Fitness Workout',
      category: 'fitness',
      time: t5,
      durationMinutes: 45,
      leadTimeMinutes: 15,
      priority: 'medium',
      notes: '30-min cardio + stretching routine.',
      enabled: true,
      completed: false,
    },
  ];
}
