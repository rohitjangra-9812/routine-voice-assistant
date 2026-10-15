import React, { useState } from 'react';
import { ScheduleEvent, AIBriefing, VoiceSettings } from '../types.ts';
import { speakText } from '../utils/audioSynthesis.ts';
import { Sparkles, Volume2, CheckCircle2, AlertCircle, X, Lightbulb, BarChart3, RefreshCw } from 'lucide-react';

interface AIBriefingModalProps {
  events: ScheduleEvent[];
  isOpen: boolean;
  onClose: () => void;
  voiceSettings: VoiceSettings;
}

export const AIBriefingModal: React.FC<AIBriefingModalProps> = ({
  events,
  isOpen,
  onClose,
  voiceSettings,
}) => {
  const [briefing, setBriefing] = useState<AIBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!isOpen) return null;

  const generateBriefing = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch AI briefing from server');
      }

      const data: AIBriefing = await res.json();
      setBriefing(data);
    } catch (err: any) {
      console.warn('Backend API error, generating local smart briefing fallback:', err);
      // Fallback smart analysis
      const meetingCount = events.filter((e) => e.category === 'meeting').length;
      const totalMinutes = events.reduce((sum, e) => sum + e.durationMinutes, 0);

      let workload: 'Light' | 'Moderate' | 'Busy' | 'Intense' = 'Light';
      if (totalMinutes > 300) workload = 'Intense';
      else if (totalMinutes > 180) workload = 'Busy';
      else if (totalMinutes > 90) workload = 'Moderate';

      const fallbackBriefing: AIBriefing = {
        spokenBriefing: `Good day! You have ${events.length} items scheduled today, including ${meetingCount} meetings totaling ${Math.round(
          totalMinutes / 60
        )} hours. Your workload level is ${workload}. Stay focused and remember to take scheduled hydration breaks!`,
        summary: `Today includes ${events.length} total events (${meetingCount} meetings, ${
          events.length - meetingCount
        } focus/routine items). Total scheduled duration: ${Math.round(totalMinutes / 60)}h ${
          totalMinutes % 60
        }m.`,
        tips: [
          'Buffer 5–10 minutes between back-to-back meetings to recharge focus.',
          'Protect deep work focus blocks by muting non-essential notifications.',
          'Review high priority items early in the morning when mental energy is peak.',
        ],
        workloadLevel: workload,
      };

      setBriefing(fallbackBriefing);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakBriefing = async () => {
    if (!briefing) return;
    setIsSpeaking(true);
    await speakText(briefing.spokenBriefing, voiceSettings, () => {
      setIsSpeaking(false);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-700/60 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Voice Briefing & Schedule Optimizer</h3>
            <p className="text-xs text-slate-400">
              Powered by Gemini AI to synthesize spoken briefing and schedule insights.
            </p>
          </div>
        </div>

        {!briefing && !isLoading && (
          <div className="py-8 text-center space-y-4">
            <p className="text-xs text-slate-300">
              Click below to generate a smart verbal daily summary and optimization recommendations based on your {events.length} scheduled items.
            </p>
            <button
              onClick={generateBriefing}
              className="px-5 py-2.5 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition-colors inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Daily Briefing</span>
            </button>
          </div>
        )}

        {isLoading && (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-400" />
            <p className="text-xs font-medium">Analyzing daily schedule & crafting voice script...</p>
          </div>
        )}

        {briefing && (
          <div className="space-y-4">
            {/* Spoken Script Box */}
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-100 space-y-2">
              <div className="flex items-center justify-between font-bold text-amber-300">
                <span className="uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  Spoken Verbal Briefing
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60 text-amber-200">
                  Workload: {briefing.workloadLevel}
                </span>
              </div>
              <p className="italic leading-relaxed text-slate-200">"{briefing.spokenBriefing}"</p>

              <button
                onClick={handleSpeakBriefing}
                disabled={isSpeaking}
                className="mt-2 w-full py-2 px-3 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isSpeaking ? 'Speaking Briefing...' : 'Speak Briefing Aloud'}</span>
              </button>
            </div>

            {/* AI Tips */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Optimization Tips
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {briefing.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={generateBriefing}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate Briefing</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
