export type CategoryType = 'meeting' | 'routine' | 'focus' | 'break' | 'fitness' | 'personal';

export type PriorityType = 'low' | 'medium' | 'high';

export interface ScheduleEvent {
  id: string;
  title: string;
  category: CategoryType;
  time: string; // HH:MM in 24h format, e.g. "09:30"
  durationMinutes: number; // Duration in minutes e.g. 30
  leadTimeMinutes?: number; // Custom lead time override (e.g. 15), or uses global buffer
  priority: PriorityType;
  notes?: string;
  location?: string;
  completed?: boolean;
  enabled: boolean; // Whether alert is active for this item
}

export interface VoiceSettings {
  enabled: boolean;
  voiceURI: string | null;
  language: string; // 'all' | 'en' | 'hi' | 'es' | 'fr' | 'de' | 'ja' | 'zh'
  rate: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 1.5
  volume: number; // 0 - 1
  chimeSound: boolean; // Play Web Audio chime before speaking
  vibratePattern: number[]; // e.g. [200, 100, 200]
  keepAwake: boolean; // Keep Screen Awake Lock
  globalLeadTimeMinutes: number; // 10, 15, 20
  repeatAlertOnExactTime: boolean; // Also alert when 0 mins remaining
}

export interface AlertLogEntry {
  id: string;
  eventId: string;
  eventTitle: string;
  category: CategoryType;
  eventTime: string;
  triggeredAt: string; // ISO or formatted HH:MM:SS
  leadTimeMinutes: number;
  type: 'buffer' | 'exact';
  spokenText: string;
}

export interface AIBriefing {
  spokenBriefing: string;
  summary: string;
  tips: string[];
  workloadLevel: 'Light' | 'Moderate' | 'Busy' | 'Intense';
}

export interface ScheduleConflict {
  eventA: ScheduleEvent;
  eventB: ScheduleEvent;
  overlapMinutes: number;
}
