import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Tag,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Lightbulb,
  HeartHandshake,
} from 'lucide-react';
import { JournalEntry } from '../types';
import { MoodBadge } from './MoodBadge';

interface MoodTimelineProps {
  entries: JournalEntry[];
  onSelectEntry: (entryId: string) => void;
  onFilterTopic?: (topic: string) => void;
}

export const MoodTimeline: React.FC<MoodTimelineProps> = ({
  entries,
  onSelectEntry,
  onFilterTopic,
}) => {
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const toggleActionCompleted = (actionKey: string) => {
    setCompletedActions((prev) => ({
      ...prev,
      [actionKey]: !prev[actionKey],
    }));
  };

  if (!entries || entries.length === 0) {
    return null;
  }

  // Calculate mood frequency
  const moodCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
  });

  const topMoods = Object.entries(moodCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Calculate top topics
  const topicCounts: Record<string, number> = {};
  entries.forEach((entry) => {
    if (Array.isArray(entry.topics)) {
      entry.topics.forEach((topic) => {
        if (topic && topic.trim().length > 0) {
          const t = topic.trim();
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        }
      });
    }
  });

  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // Extract recent insights
  const recentInsights: Array<{
    entryId: string;
    entryTitle: string;
    date: string;
    insight: string;
    mood: string;
  }> = [];

  entries.forEach((entry) => {
    if (Array.isArray(entry.insights) && entry.insights.length > 0) {
      entry.insights.forEach((insight) => {
        if (insight && recentInsights.length < 5) {
          recentInsights.push({
            entryId: entry.id || '',
            entryTitle: entry.title,
            date: entry.createdAt,
            insight,
            mood: entry.mood,
          });
        }
      });
    }
  });

  // Extract suggested next actions
  const nextActionsList: Array<{
    entryId: string;
    entryTitle: string;
    date: string;
    action: string;
  }> = [];

  entries.forEach((entry) => {
    if (entry.nextAction && entry.nextAction.trim().length > 0 && nextActionsList.length < 5) {
      nextActionsList.push({
        entryId: entry.id || '',
        entryTitle: entry.title,
        date: entry.createdAt,
        action: entry.nextAction.trim(),
      });
    }
  });

  return (
    <div id="ai-mood-insight-timeline" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI Mood & Insight Timeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic psychological patterns extracted from your private journal reflections
          </p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full border border-slate-200">
            {entries.length} {entries.length === 1 ? 'Session' : 'Sessions'} Analyzed
          </span>
        </div>
      </div>

      {/* Grid: Mood Breakdown & Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood Distribution Card */}
        <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Emotional Landscape</h3>
            </div>
            <span className="text-xs text-slate-500">Frequency across entries</span>
          </div>

          <div className="space-y-3">
            {topMoods.length > 0 ? (
              topMoods.map(([mood, count]) => {
                const percentage = Math.round((count / entries.length) * 100);
                return (
                  <div key={mood} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <MoodBadge mood={mood} size="sm" />
                      <span className="font-semibold text-slate-600">
                        {count} {count === 1 ? 'time' : 'times'} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-800 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 italic">No mood data recorded yet.</p>
            )}
          </div>

          {/* Chronological Recent Mood Stream */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Recent Session Trajectory
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {entries.slice(0, 6).map((entry, idx) => (
                <button
                  key={entry.id || idx}
                  onClick={() => entry.id && onSelectEntry(entry.id)}
                  title={`${entry.title} (${new Date(entry.createdAt).toLocaleDateString()})`}
                  className="hover:scale-105 transition transform"
                >
                  <MoodBadge mood={entry.mood} size="sm" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Frequently Discussed Topics Card */}
        <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Frequent Focus Themes</h3>
              </div>
              <span className="text-xs text-slate-500">{topTopics.length} distinct tags</span>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Key topics identified by Gemini from your reflections:
            </p>

            <div className="flex flex-wrap gap-2">
              {topTopics.length > 0 ? (
                topTopics.map(([topic, count]) => (
                  <button
                    key={topic}
                    onClick={() => onFilterTopic && onFilterTopic(topic)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition"
                  >
                    <span>{topic}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                      {count}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No topics extracted yet.</p>
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-slate-400" /> Topic trends update automatically
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Recent Insights & Suggested Next Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Key Insights Card */}
        <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent AI Insights</h3>
            </div>
            <span className="text-xs text-slate-500">Self-realizations</span>
          </div>

          <div className="space-y-3">
            {recentInsights.length > 0 ? (
              recentInsights.map((item, idx) => (
                <div
                  key={`${item.entryId}-${idx}`}
                  className="bg-white rounded-lg p-3 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition"
                >
                  <p className="text-xs text-slate-800 font-normal leading-relaxed italic">
                    "{item.insight}"
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 truncate max-w-[170px]">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      {new Date(item.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' · '}
                      <span className="font-medium text-slate-700 truncate">{item.entryTitle}</span>
                    </span>
                    {item.entryId && (
                      <button
                        onClick={() => onSelectEntry(item.entryId)}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 font-semibold hover:underline text-[11px]"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No insights generated yet.</p>
            )}
          </div>
        </div>

        {/* Suggested Next Actions Checklist Card */}
        <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Suggested Next Actions</h3>
            </div>
            <span className="text-xs text-slate-500">Actionable steps</span>
          </div>

          <div className="space-y-3">
            {nextActionsList.length > 0 ? (
              nextActionsList.map((item, idx) => {
                const actionKey = `${item.entryId}-${idx}`;
                const isDone = completedActions[actionKey];

                return (
                  <div
                    key={actionKey}
                    onClick={() => toggleActionCompleted(actionKey)}
                    className={`cursor-pointer bg-white rounded-lg p-3 border shadow-2xs transition flex items-start gap-3 ${
                      isDone
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white hover:border-slate-500'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs leading-relaxed transition ${
                          isDone ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                        }`}
                      >
                        {item.action}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          From "{item.entryTitle}" ·{' '}
                          {new Date(item.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {item.entryId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEntry(item.entryId);
                            }}
                            className="text-slate-600 hover:text-slate-900 font-medium hover:underline inline-flex items-center gap-0.5"
                          >
                            Entry
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 italic">No actions recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
