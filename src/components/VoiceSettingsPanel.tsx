import React, { useState, useEffect } from 'react';
import { VoiceSettings } from '../types.ts';
import { getAvailableVoices, speakText } from '../utils/audioSynthesis.ts';
import { vibrateMobile } from '../utils/mobileAudioUnlock.ts';
import { requestScreenWakeLock, releaseScreenWakeLock } from '../utils/wakeLock.ts';
import {
  Volume2,
  Mic,
  Bell,
  CheckCircle2,
  AlertCircle,
  Play,
  Globe,
  Sun,
  Smartphone,
  Zap,
} from 'lucide-react';

interface VoiceSettingsPanelProps {
  settings: VoiceSettings;
  onUpdateSettings: (newSettings: VoiceSettings) => void;
  permissionState: NotificationPermission | 'unsupported';
  onRequestPermission: () => void;
  isWakeLockOn: boolean;
  setIsWakeLockOn: (active: boolean) => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'all', label: 'All Installed Languages' },
  { code: 'en', label: 'English (en)' },
  { code: 'hi', label: 'Hindi (hi)' },
  { code: 'es', label: 'Spanish (es)' },
  { code: 'fr', label: 'French (fr)' },
  { code: 'de', label: 'German (de)' },
  { code: 'ja', label: 'Japanese (ja)' },
  { code: 'zh', label: 'Chinese (zh)' },
];

export const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  permissionState,
  onRequestPermission,
  isWakeLockOn,
  setIsWakeLockOn,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testPhrase, setTestPhrase] = useState(
    'Reminder: Engineering Team Standup starts in 15 minutes.'
  );
  const [isSpeakingTest, setIsSpeakingTest] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const available = getAvailableVoices();
      setVoices(available);
      if (available.length > 0 && !settings.voiceURI) {
        const defaultVoice =
          available.find((v) => v.lang.startsWith('en') && v.default) || available[0];
        onUpdateSettings({ ...settings, voiceURI: defaultVoice.voiceURI });
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleTestVoice = async () => {
    setIsSpeakingTest(true);
    vibrateMobile([200, 100, 200]);
    await speakText(testPhrase, settings, () => {
      setIsSpeakingTest(false);
    });
  };

  const handleToggleWakeLock = async () => {
    if (isWakeLockOn) {
      await releaseScreenWakeLock();
      setIsWakeLockOn(false);
      onUpdateSettings({ ...settings, keepAwake: false });
    } else {
      const success = await requestScreenWakeLock();
      setIsWakeLockOn(success);
      onUpdateSettings({ ...settings, keepAwake: success });
    }
  };

  // Filter voices by selected language code
  const filteredVoices = voices.filter((v) => {
    if (settings.language === 'all') return true;
    return v.lang.toLowerCase().startsWith(settings.language.toLowerCase());
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-indigo-400" />
          Voice (TTS), Wake Lock & Mobile Settings
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Customize speech synthesis voice, pick languages, toggle Keep Awake lock, and test vibration alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voice Selection & Language Filter */}
        <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Mic className="w-4 h-4" />
            Speech Voice & Language
          </h4>

          {/* Language Selector Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Language Filter
            </label>
            <select
              value={settings.language || 'all'}
              onChange={(e) => {
                const newLang = e.target.value;
                const matching = voices.filter((v) =>
                  newLang === 'all' ? true : v.lang.toLowerCase().startsWith(newLang.toLowerCase())
                );
                const newVoiceURI = matching.length > 0 ? matching[0].voiceURI : settings.voiceURI;
                onUpdateSettings({ ...settings, language: newLang, voiceURI: newVoiceURI });
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Voice URI Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Phone / System Installed Voice ({filteredVoices.length} available)
            </label>
            <select
              value={settings.voiceURI || ''}
              onChange={(e) =>
                onUpdateSettings({ ...settings, voiceURI: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {filteredVoices.length > 0 ? (
                filteredVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))
              ) : (
                <option value="">Default System Voice</option>
              )}
            </select>
          </div>

          {/* Volume Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Speech Volume</span>
              <span className="font-mono">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) =>
                onUpdateSettings({ ...settings, volume: parseFloat(e.target.value) })
              }
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Speed Rate Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Speaking Speed (Rate)</span>
              <span className="font-mono">{settings.rate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.8}
              step={0.05}
              value={settings.rate}
              onChange={(e) =>
                onUpdateSettings({ ...settings, rate: parseFloat(e.target.value) })
              }
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Mobile Display & Alert Controls */}
        <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              Screen Wake Lock & Mobile Vibrations
            </h4>

            {/* Wake Lock API Toggle Button */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" />
                  Keep Screen Awake (Wake Lock)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Prevents phone display from sleeping so timers don't freeze
                </div>
              </div>

              <button
                onClick={handleToggleWakeLock}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                  isWakeLockOn
                    ? 'bg-amber-500 border-amber-400 text-amber-950'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {isWakeLockOn ? 'Awake Active' : 'Enable Wake Lock'}
              </button>
            </div>

            {/* Vibration Test */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  Haptic Vibration Pattern
                </div>
                <div className="text-[11px] font-mono text-indigo-300 mt-0.5">
                  Pattern: [200ms pulse, 100ms pause, 200ms pulse]
                </div>
              </div>

              <button
                onClick={() => vibrateMobile([200, 100, 200])}
                className="px-3 py-1.5 text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-800 text-indigo-300 rounded-lg transition-colors"
              >
                Test Vibrate
              </button>
            </div>

            {/* Test Phrase Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Voice Test Script
              </label>
              <input
                type="text"
                value={testPhrase}
                onChange={(e) => setTestPhrase(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleTestVoice}
            disabled={isSpeakingTest}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors mt-4"
          >
            <Play className="w-4 h-4" />
            <span>{isSpeakingTest ? 'Speaking Reminder...' : 'Test Voice Announcement & Vibration'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
