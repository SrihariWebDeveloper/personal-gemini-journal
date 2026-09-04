import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserJournalEntries, deleteJournalEntry } from '../services/journalFirestore';
import { JournalEntry } from '../types';
import { MoodBadge } from '../components/MoodBadge';
import {
  Search,
  Filter,
  Calendar,
  Trash2,
  ArrowRight,
  Loader2,
  Sparkles,
  Tag,
  PenSquare,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

interface HistoryPageProps {
  onOpenEntry: (entryId: string) => void;
  navigate: (route: string) => void;
  initialTopicFilter?: string;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onOpenEntry,
  navigate,
  initialTopicFilter = '',
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopicFilter);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserJournalEntries(user.uid);
      setEntries(data);
    } catch (err: unknown) {
      console.error('Error fetching history:', err);
      setError('Failed to load journal history.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Extract all distinct moods and topics from current entries
  const allMoods = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (e.mood) set.add(e.mood);
    });
    return Array.from(set);
  }, [entries]);

  const allTopics = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => {
      if (Array.isArray(e.topics)) {
        e.topics.forEach((t) => t && set.add(t));
      }
    });
    return Array.from(set);
  }, [entries]);

  // Filtered and sorted entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Mood filter
        if (selectedMood !== 'all' && entry.mood !== selectedMood) {
          return false;
        }

        // Topic filter
        if (
          selectedTopic &&
          (!Array.isArray(entry.topics) ||
            !entry.topics.some((t) => t.toLowerCase() === selectedTopic.toLowerCase()))
        ) {
          return false;
        }

        // Search text
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchesTitle = entry.title?.toLowerCase().includes(query);
          const matchesSummary = entry.summary?.toLowerCase().includes(query);
          const matchesTopics = entry.topics?.some((t) => t.toLowerCase().includes(query));
          const matchesMessages = entry.messages?.some((m) =>
            m.content.toLowerCase().includes(query)
          );

          return matchesTitle || matchesSummary || matchesTopics || matchesMessages;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [entries, searchQuery, selectedMood, selectedTopic, sortOrder]);

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (!user?.uid || !entryId) return;

    if (!window.confirm('Are you sure you want to permanently delete this journal entry?')) {
      return;
    }

    setDeletingId(entryId);
    try {
      await deleteJournalEntry(user.uid, entryId);
      setEntries((prev) => prev.filter((item) => item.id !== entryId));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete entry. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Journal History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, and review all your previous reflective conversations
          </p>
        </div>

        <button
          onClick={() => navigate('/journal')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs self-start sm:self-auto"
        >
          <PenSquare className="w-3.5 h-3.5 text-indigo-300" />
          <span>New Journal</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchEntries} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="history-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections by title, summary, keyword..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Mood Filter */}
          <div className="sm:col-span-3">
            <select
              id="mood-filter-select"
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            >
              <option value="all">All Moods ({entries.length})</option>
              {allMoods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="sm:col-span-3">
            <select
              id="sort-order-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Active Filters / Topic Tags Bar */}
        {(selectedTopic || selectedMood !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">Active filters:</span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-slate-950 font-bold ml-1">
                  ×
                </button>
              </span>
            )}

            {selectedMood !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                Mood: {selectedMood}
                <button onClick={() => setSelectedMood('all')} className="hover:text-slate-950 font-bold ml-1">
                  ×
                </button>
              </span>
            )}

            {selectedTopic && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                Topic: {selectedTopic}
                <button onClick={() => setSelectedTopic('')} className="hover:text-slate-950 font-bold ml-1">
                  ×
                </button>
              </span>
            )}

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMood('all');
                setSelectedTopic('');
              }}
              className="text-slate-500 hover:text-slate-900 underline ml-auto text-[11px]"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-200/90 text-center flex flex-col items-center justify-center shadow-xs">
          <Loader2 className="w-8 h-8 text-slate-600 animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-700">Loading your private archive...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200/90 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">No matching entries</h3>
            <p className="text-xs text-slate-500">
              {entries.length === 0
                ? 'You have not saved any journal reflections yet.'
                : 'No journal entries matched your current search or filter criteria.'}
            </p>
          </div>
          {entries.length === 0 ? (
            <button
              onClick={() => navigate('/journal')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-xs"
            >
              <PenSquare className="w-3.5 h-3.5 text-indigo-300" />
              Create First Entry
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMood('all');
                setSelectedTopic('');
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Journal Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => entry.id && onOpenEntry(entry.id)}
              className="cursor-pointer bg-white rounded-xl p-5 border border-slate-200/90 hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <MoodBadge mood={entry.mood} size="sm" />
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition line-clamp-2">
                  {entry.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {entry.summary || entry.messages?.[0]?.content || 'Reflection session transcript'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                {/* Topics chips */}
                {Array.isArray(entry.topics) && entry.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.topics.slice(0, 3).map((topic, i) => (
                      <span
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTopic(topic);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition"
                      >
                        #{topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer meta & actions */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {entry.messages?.length || 0} msgs
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => entry.id && handleDelete(e, entry.id)}
                      disabled={deletingId === entry.id}
                      title="Delete Entry"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      {deletingId === entry.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <span className="inline-flex items-center gap-1 font-semibold text-slate-800 group-hover:text-slate-950 text-xs">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
