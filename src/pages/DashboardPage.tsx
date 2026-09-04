import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserJournalEntries } from '../services/journalFirestore';
import { JournalEntry } from '../types';
import { MoodBadge } from '../components/MoodBadge';
import { MoodTimeline } from '../components/MoodTimeline';
import {
  PenSquare,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';

interface DashboardPageProps {
  navigate: (route: string) => void;
  onOpenEntry: (entryId: string) => void;
  onFilterTopicInHistory?: (topic: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  navigate,
  onOpenEntry,
  onFilterTopicInHistory,
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserJournalEntries(user.uid);
      setEntries(data);
    } catch (err: unknown) {
      console.error('Error loading dashboard entries:', err);
      setError('Unable to load your journal entries. Please check network connection.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Statistics calculation
  const totalEntries = entries.length;
  const latestEntry = entries[0];
  const mostFrequentMood = (() => {
    if (entries.length === 0) return 'None yet';
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return sorted[0] ? sorted[0][0] : 'Reflective';
  })();

  const totalInsightsCount = entries.reduce(
    (acc, e) => acc + (Array.isArray(e.insights) ? e.insights.length : 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Isolated Firestore Space
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Journaler'}
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Here is your private sanctuary for mindful reflection. Your entries, insights,
            and conversation transcripts are cryptographically protected and strictly isolated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            id="start-journal-btn"
            onClick={() => navigate('/journal')}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          >
            <PenSquare className="w-4 h-4 text-indigo-300" />
            <span>Start New Journal</span>
          </button>
        </div>
      </div>

      {/* Error state if fetch failed */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadEntries}
            className="underline font-semibold hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Statistics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Sessions</span>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalEntries}</div>
          <p className="text-[11px] text-slate-400">All-time conversations</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Primary Mood</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {totalEntries > 0 ? (
              <MoodBadge mood={mostFrequentMood} size="sm" />
            ) : (
              <span className="text-slate-400 text-sm">No entries yet</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">Most frequent emotional tone</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Insights</span>
            <FileText className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalInsightsCount}</div>
          <p className="text-[11px] text-slate-400">Extracted self-realizations</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Latest Reflection</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {latestEntry
              ? new Date(latestEntry.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Never'}
          </div>
          <p className="text-[11px] text-slate-400">
            {latestEntry ? latestEntry.title : 'Ready for your first session'}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/90 text-center flex flex-col items-center justify-center shadow-xs">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-700">Loading your private journal data...</p>
        </div>
      ) : (
        <>
          {/* AI Mood & Insight Timeline (Original Feature) */}
          {entries.length > 0 && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
              <MoodTimeline
                entries={entries}
                onSelectEntry={(id) => onOpenEntry(id)}
                onFilterTopic={(topic) => {
                  if (onFilterTopicInHistory) {
                    onFilterTopicInHistory(topic);
                  }
                  navigate('/history');
                }}
              />
            </div>
          )}

          {/* Recent Journal Entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent Journal Entries</h2>
                <p className="text-xs text-slate-500">Your latest conversations and summaries</p>
              </div>
              {entries.length > 0 && (
                <button
                  onClick={() => navigate('/history')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950 transition"
                >
                  View All ({entries.length}) <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {entries.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 border border-slate-200/90 text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto border border-indigo-100">
                  <PenSquare className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-slate-900">No journal sessions yet</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Begin a conversation with Gemini about your day, goals, challenges, or thoughts.
                    When finished, you can generate an AI summary and save it to your private archive.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/journal')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
                >
                  <PenSquare className="w-3.5 h-3.5 text-indigo-300" />
                  Start Your First Session
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {entries.slice(0, 3).map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => entry.id && onOpenEntry(entry.id)}
                    className="cursor-pointer bg-white rounded-xl p-5 border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <MoodBadge mood={entry.mood} size="sm" />
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {entry.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {entry.summary ||
                          entry.messages?.[0]?.content ||
                          'No summary available.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex flex-wrap gap-1 max-w-[180px] overflow-hidden">
                        {entry.topics?.slice(0, 2).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 hover:text-slate-950 text-xs">
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
