import React, { useState, useEffect, useRef } from 'react';
import {
  ScheduleEvent,
  VoiceSettings,
  AlertLogEntry,
} from './types.ts';
import {
  getSampleEvents,
  evaluateAlertTriggers,
  getUpcomingEvents,
} from './utils/scheduleLogic.ts';
import { speakText } from './utils/audioSynthesis.ts';
import {
  requestNotificationPermission,
  sendDesktopNotification,
} from './utils/notification.ts';
import {
  unlockMobileAudio,
  vibrateMobile,
} from './utils/mobileAudioUnlock.ts';
import {
  requestScreenWakeLock,
  releaseScreenWakeLock,
} from './utils/wakeLock.ts';

import { Navbar } from './components/Navbar.tsx';
import { ClockHeader } from './components/ClockHeader.tsx';
import { TimelineView } from './components/TimelineView.tsx';
import { ScheduleManager } from './components/ScheduleManager.tsx';
import { VoiceSettingsPanel } from './components/VoiceSettingsPanel.tsx';
import { AlertHistoryLog } from './components/AlertHistoryLog.tsx';
import { AIBriefingModal } from './components/AIBriefingModal.tsx';
import { TriggeredAlertBanner } from './components/TriggeredAlertBanner.tsx';
import { MobileAlertPrompt } from './components/MobileAlertPrompt.tsx';

const LOCAL_STORAGE_KEY_EVENTS = 'voxroutine_events_v1';
const LOCAL_STORAGE_KEY_SETTINGS = 'voxroutine_settings_v1';

export default function App() {
  // State Initialization
  const [events, setEvents] = useState<ScheduleEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_EVENTS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved events:', e);
        }
      }
    }
    return getSampleEvents();
  });

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved voice settings:', e);
        }
      }
    }
    return {
      enabled: true,
      voiceURI: null,
      language: 'all',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.9,
      chimeSound: true,
      vibratePattern: [200, 100, 200],
      keepAwake: false,
      globalLeadTimeMinutes: 15,
      repeatAlertOnExactTime: true,
    };
  });

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isTracking, setIsTracking] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timeline' | 'voice-settings' | 'history'>('dashboard');
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('default');
  const [alertLogs, setAlertLogs] = useState<AlertLogEntry[]>([]);
  const [isAIBriefingOpen, setIsAIBriefingOpen] = useState<boolean>(false);
  const [isWakeLockOn, setIsWakeLockOn] = useState<boolean>(false);

  const [activeAlert, setActiveAlert] = useState<{
    event: ScheduleEvent;
    triggerType: 'buffer' | 'exact';
    leadTimeMinutes: number;
    spokenText: string;
  } | null>(null);

  const triggeredSetRef = useRef<Set<string>>(new Set());

  // Save state
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_EVENTS, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(voiceSettings));
  }, [voiceSettings]);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    } else {
      setPermissionState('unsupported');
    }
  }, []);

  // Unlock mobile audio on first global user tap
  useEffect(() => {
    const handleFirstTouch = () => {
      unlockMobileAudio();
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };

    window.addEventListener('touchstart', handleFirstTouch, { passive: true });
    window.addEventListener('click', handleFirstTouch, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };
  }, []);

  // Handle Visibility Change for Screen Wake Lock re-acquisition
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && voiceSettings.keepAwake) {
        const success = await requestScreenWakeLock();
        setIsWakeLockOn(success);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [voiceSettings.keepAwake]);

  // Main background timer loop
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (isTracking && voiceSettings.enabled) {
        const triggered = evaluateAlertTriggers(
          events,
          now,
          voiceSettings.globalLeadTimeMinutes,
          triggeredSetRef.current,
          voiceSettings.repeatAlertOnExactTime
        );

        for (const trig of triggered) {
          fireAlert(trig.event, trig.triggerType, trig.leadTimeMinutes);
        }
      }
    }, 1000);

    return () => clearInterval(clockInterval);
  }, [events, isTracking, voiceSettings]);

  // Fires voice announcement + high-priority mobile vibration + desktop notification
  const fireAlert = (
    event: ScheduleEvent,
    triggerType: 'buffer' | 'exact',
    leadTimeMinutes: number
  ) => {
    const spokenText =
      triggerType === 'buffer'
        ? `Reminder: ${event.title} starts in ${leadTimeMinutes} minutes.`
        : `Reminder: ${event.title} is starting now.`;

    // 1. Mobile Vibration Pattern [200, 100, 200]
    vibrateMobile(voiceSettings.vibratePattern || [200, 100, 200]);

    // 2. Speak text aloud (with double chime if enabled)
    speakText(spokenText, voiceSettings);

    // 3. Desktop / Mobile system notification
    sendDesktopNotification(
      `VoxRoutine Alert: ${event.title}`,
      spokenText,
      `alert-${event.id}-${triggerType}`
    );

    // 4. Log entry
    const newEntry: AlertLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      eventId: event.id,
      eventTitle: event.title,
      category: event.category,
      eventTime: event.time,
      triggeredAt: new Date().toLocaleTimeString(),
      leadTimeMinutes,
      type: triggerType,
      spokenText,
    };

    setAlertLogs((prev) => [newEntry, ...prev]);

    // 5. Active popover banner
    setActiveAlert({
      event,
      triggerType,
      leadTimeMinutes,
      spokenText,
    });
  };

  const handleTestVoiceAndNotification = async () => {
    unlockMobileAudio();
    vibrateMobile([200, 100, 200]);

    const perm = await requestNotificationPermission();
    setPermissionState(perm);

    const sampleEvent: ScheduleEvent = {
      id: 'test-event',
      title: 'Engineering Team Standup',
      category: 'meeting',
      time: `${currentTime.getHours().toString().padStart(2, '0')}:${(currentTime.getMinutes() + 15) % 60}`,
      durationMinutes: 15,
      leadTimeMinutes: 15,
      priority: 'high',
      enabled: true,
    };

    fireAlert(sampleEvent, 'buffer', 15);
  };

  const handleTriggerInstantAlertForEvent = (event: ScheduleEvent) => {
    unlockMobileAudio();
    fireAlert(event, 'buffer', event.leadTimeMinutes ?? voiceSettings.globalLeadTimeMinutes);
  };

  // Schedule CRUD
  const handleAddEvent = (newEvent: Omit<ScheduleEvent, 'id'>) => {
    const created: ScheduleEvent = {
      ...newEvent,
      id: `event-${Date.now()}`,
    };
    setEvents((prev) => [...prev, created]);
  };

  const handleUpdateEvent = (updated: ScheduleEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleLoadSampleEvents = () => {
    setEvents(getSampleEvents());
    triggeredSetRef.current.clear();
  };

  const handleSnooze = (minutes: number) => {
    if (!activeAlert) return;
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const newMins = currentMins + minutes;
    const h = Math.floor(newMins / 60) % 24;
    const m = newMins % 60;
    const newTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    const snoozedEvent: ScheduleEvent = {
      ...activeAlert.event,
      id: `${activeAlert.event.id}-snoozed-${Date.now()}`,
      title: `${activeAlert.event.title} (Snoozed ${minutes}m)`,
      time: newTime,
    };

    setEvents((prev) => [...prev, snoozedEvent]);
    setActiveAlert(null);
  };

  const upcomingList = getUpcomingEvents(events, currentTime);
  const nextEvent = upcomingList.length > 0 ? upcomingList[0] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white pb-12">
      {/* Top Bar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onTestVoiceAndNotification={handleTestVoiceAndNotification}
        onOpenAIBriefing={() => setIsAIBriefingOpen(true)}
        isTracking={isTracking}
        permissionState={permissionState}
        isWakeLockOn={isWakeLockOn}
      />

      {/* Prominent Mobile Alert & Audio Unlock Banner */}
      <MobileAlertPrompt
        onPermissionsGranted={setPermissionState}
        isWakeLockOn={isWakeLockOn}
        setIsWakeLockOn={setIsWakeLockOn}
      />

      {/* Clock Banner & Global Lead Buffer Selector */}
      <ClockHeader
        currentTime={currentTime}
        isTracking={isTracking}
        onToggleTracking={() => setIsTracking(!isTracking)}
        voiceSettings={voiceSettings}
        onUpdateGlobalBuffer={(mins) =>
          setVoiceSettings({ ...voiceSettings, globalLeadTimeMinutes: mins })
        }
        nextEvent={nextEvent}
        onTriggerInstantAlert={handleTriggerInstantAlertForEvent}
      />

      {/* Main Container Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <TimelineView
              events={events}
              currentTime={currentTime}
              onSelectEvent={handleTriggerInstantAlertForEvent}
            />

            <ScheduleManager
              events={events}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              onLoadSampleEvents={handleLoadSampleEvents}
              onTriggerTestEventAlert={handleTriggerInstantAlertForEvent}
              globalLeadTimeMinutes={voiceSettings.globalLeadTimeMinutes}
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            events={events}
            currentTime={currentTime}
            onSelectEvent={handleTriggerInstantAlertForEvent}
          />
        )}

        {activeTab === 'voice-settings' && (
          <VoiceSettingsPanel
            settings={voiceSettings}
            onUpdateSettings={setVoiceSettings}
            permissionState={permissionState}
            onRequestPermission={async () => {
              const perm = await requestNotificationPermission();
              setPermissionState(perm);
            }}
            isWakeLockOn={isWakeLockOn}
            setIsWakeLockOn={setIsWakeLockOn}
          />
        )}

        {activeTab === 'history' && (
          <AlertHistoryLog
            logs={alertLogs}
            onReplayAlert={(entry) => speakText(entry.spokenText, voiceSettings)}
            onClearLogs={() => setAlertLogs([])}
          />
        )}
      </main>

      {/* AI Daily Briefing Modal */}
      <AIBriefingModal
        events={events}
        isOpen={isAIBriefingOpen}
        onClose={() => setIsAIBriefingOpen(false)}
        voiceSettings={voiceSettings}
      />

      {/* Triggered Real-Time Popover Alert */}
      <TriggeredAlertBanner
        activeAlert={activeAlert}
        onDismiss={() => setActiveAlert(null)}
        onSnooze={handleSnooze}
        onReplaySpeech={() =>
          activeAlert && speakText(activeAlert.spokenText, voiceSettings)
        }
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>VoxRoutine — Progressive Web App (PWA) Voice & Meeting Alert System</p>
      </footer>
    </div>
  );
}
