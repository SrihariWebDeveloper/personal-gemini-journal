import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getJournalEntryById,
  deleteJournalEntry,
  updateJournalEntryTitle,
} from '../services/journalFirestore';
import { JournalEntry } from '../types';
import { MoodBadge } from '../components/MoodBadge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  Bot,
  User as UserIcon,
  Tag,
  Lightbulb,
  CheckCircle2,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface JournalDetailPageProps {
  entryId: string;
  onBack: () => void;
  navigate: (route: string) => void;
}

export const JournalDetailPage: React.FC<JournalDetailPageProps> = ({
  entryId,
  onBack,
  navigate,
}) => {
  const { user } = useAuth();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inline title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // Deletion
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEntry = useCallback(async () => {
    if (!user?.uid || !entryId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getJournalEntryById(user.uid, entryId);
      if (!data) {
        setError('Journal entry not found or you do not have permission to access it.');
      } else {
        setEntry(data);
        setEditedTitle(data.title);
      }
    } catch (err) {
      console.error('Fetch entry error:', err);
      setError('Failed to load entry.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, entryId]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  const handleSaveTitle = async () => {
    if (!user?.uid || !entryId || !editedTitle.trim()) return;
    setIsSavingTitle(true);
    try {
      await updateJournalEntryTitle(user.uid, entryId, editedTitle.trim());
      setEntry((prev) => (prev ? { ...prev, title: editedTitle.trim() } : null));
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Update title error:', err);
      alert('Failed to update title.');
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleDelete = async () => {
    if (!user?.uid || !entryId) return;
    if (!window.confirm('Are you sure you want to permanently delete this journal entry? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteJournalEntry(user.uid, entryId);
      onBack();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete entry.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-700">Loading journal details from Firestore...</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Entry Unavailable</h2>
        <p className="text-xs text-slate-600 max-w-sm mx-auto">{error || 'Unable to display entry.'}</p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-950 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Delete Entry</span>
          </button>
        </div>
      </div>

      {/* Entry Title & Metadata */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MoodBadge mood={entry.mood} size="lg" />

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(entry.createdAt).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {new Date(entry.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        {/* Title editing */}
        <div className="pt-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1 px-3 py-2 text-lg font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              <button
                onClick={handleSaveTitle}
                disabled={isSavingTitle}
                className="p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                {isSavingTitle ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => {
                  setEditedTitle(entry.title);
                  setIsEditingTitle(false);
                }}
                className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {entry.title}
              </h1>
              <button
                onClick={() => setIsEditingTitle(true)}
                title="Edit Title"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Topics chips */}
        {Array.isArray(entry.topics) && entry.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {entry.topics.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
              >
                <Tag className="w-3 h-3 text-slate-400" />
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AI Analysis Summary Box */}
      <div className="bg-slate-50/80 rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">Gemini Reflection Synthesis</h2>
        </div>

        {/* Summary text */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Executive Summary
          </span>
          <p className="text-sm text-slate-800 font-normal leading-relaxed bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            {entry.summary || 'Summary not recorded for this session.'}
          </p>
        </div>

        {/* Grid: Insights & Next Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
          {/* Key Insights */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-indigo-600" />
              Key Insights
            </span>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
              {Array.isArray(entry.insights) && entry.insights.length > 0 ? (
                entry.insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{insight}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No specific insights extracted.</p>
              )}
            </div>
          </div>

          {/* Suggested Next Action */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Suggested Next Action
            </span>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 shadow-2xs space-y-1.5">
              <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                {entry.nextAction || 'Continue your reflective momentum tomorrow.'}
              </p>
              <p className="text-[11px] text-emerald-700 font-normal">
                A mindful micro-step recommended by Gemini based on your reflections.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Conversation Transcript */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h2 className="text-base font-bold text-slate-900">Conversation Transcript</h2>
          </div>
          <span className="text-xs text-slate-500">
            {entry.messages?.length || 0} messages exchanged
          </span>
        </div>

        <div className="space-y-4 pt-1">
          {entry.messages?.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id || index}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold mt-0.5 ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 border border-slate-200 text-indigo-700'
                  }`}
                >
                  {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-slate-900 text-slate-100 rounded-tr-xs shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div
                    className={`mt-1 text-[10px] ${
                      isUser ? 'text-slate-400 text-right' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
