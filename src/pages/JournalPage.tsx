import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sendChatMessage, analyzeSession } from '../services/api';
import { saveJournalEntry } from '../services/journalFirestore';
import { JournalMessage, JournalAnalysis } from '../types';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Loader2,
  Tag,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { MoodBadge } from '../components/MoodBadge';

interface JournalPageProps {
  onEntrySaved: (entryId: string) => void;
  navigate: (route: string) => void;
}

const DEFAULT_WELCOME_PROMPT =
  "Hello. I'm your private Gemini Journal companion. How are you feeling today, and what's on your mind?";

export const JournalPage: React.FC<JournalPageProps> = ({ onEntrySaved, navigate }) => {
  const { user } = useAuth();

  // Chat conversation state
  const [messages, setMessages] = useState<JournalMessage[]>([
    {
      id: 'msg-init-0',
      role: 'model',
      content: DEFAULT_WELCOME_PROMPT,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputContent, setInputContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ending / Saving Session modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingToFirestore, setIsSavingToFirestore] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [analysisResult, setAnalysisResult] = useState<JournalAnalysis | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Handle sending message to Gemini
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = inputContent.trim();
    if (!trimmed || isSending) return;

    if (trimmed.length > 4000) {
      setError('Message exceeds maximum limit of 4,000 characters.');
      return;
    }

    setError(null);
    const userMessage: JournalMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInputContent('');
    setIsSending(true);

    try {
      // Backend expects: Array<{ role: 'user' | 'model', content: string }>
      const apiPayload = updatedHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const replyData = await sendChatMessage(apiPayload);

      const modelMessage: JournalMessage = {
        id: `msg-model-${Date.now()}`,
        role: 'model',
        content: replyData.content,
        timestamp: replyData.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const message = err instanceof Error ? err.message : 'Failed to connect to Gemini.';
      setError(message);
    } finally {
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  // Open Save & End Session Modal
  const handleInitiateEndSession = async () => {
    // Only allow saving if user has contributed at least one message
    const userMessages = messages.filter((m) => m.role === 'user');
    if (userMessages.length === 0) {
      setError('Please share at least one reflection before ending and saving the session.');
      return;
    }

    const defaultTitle = `Reflection · ${new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;
    setSessionTitle(defaultTitle);
    setShowSaveModal(true);
    setSaveError(null);
    setIsAnalyzing(true);

    try {
      const apiPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await analyzeSession(apiPayload);
      setAnalysisResult(res.analysis);
    } catch (err: unknown) {
      console.error('Session analysis error:', err);
      setSaveError('AI analysis generation failed. You can still save your journal transcript.');
      // Safe fallback
      setAnalysisResult({
        summary: 'Journal session completed.',
        mood: 'Reflective',
        topics: ['Daily Reflection'],
        insights: ['Mindful time dedicated to personal thoughts.'],
        nextAction: 'Take a brief mindful pause.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Commit journal entry to Firestore under /users/{uid}/journalEntries/{entryId}
  const handleConfirmSave = async () => {
    if (!user?.uid) {
      setSaveError('Authentication session lost. Please sign in again.');
      return;
    }

    setIsSavingToFirestore(true);
    setSaveError(null);

    try {
      const finalTitle = sessionTitle.trim() || 'Untitled Reflection';
      const fallbackAnalysis: JournalAnalysis = analysisResult || {
        summary: 'Session completed.',
        mood: 'Reflective',
        topics: ['Journaling'],
        insights: ['Valuable self-reflection time.'],
        nextAction: 'Review your thoughts when ready.',
      };

      const now = new Date().toISOString();

      const newEntryId = await saveJournalEntry(user.uid, {
        title: finalTitle,
        messages: messages,
        summary: fallbackAnalysis.summary,
        mood: fallbackAnalysis.mood,
        topics: fallbackAnalysis.topics,
        insights: fallbackAnalysis.insights,
        nextAction: fallbackAnalysis.nextAction,
        createdAt: now,
        updatedAt: now,
      });

      setShowSaveModal(false);
      onEntrySaved(newEntryId);
    } catch (err: unknown) {
      console.error('Save to Firestore error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save to Firestore database.';
      setSaveError(msg);
    } finally {
      setIsSavingToFirestore(false);
    }
  };

  const handleResetConversation = () => {
    if (
      messages.length > 1 &&
      !window.confirm('Start a new session? Unsaved messages in this session will be cleared.')
    ) {
      return;
    }
    setMessages([
      {
        id: `msg-init-${Date.now()}`,
        role: 'model',
        content: DEFAULT_WELCOME_PROMPT,
        timestamp: new Date().toISOString(),
      },
    ]);
    setError(null);
  };

  const userMessagesCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Session Top Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              Active Journal Session
            </h1>
            <p className="text-xs text-slate-500">
              {userMessagesCount} {userMessagesCount === 1 ? 'user message' : 'user messages'} in context
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetConversation}
            title="Clear and start new conversation"
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>

          <button
            id="end-save-session-btn"
            onClick={handleInitiateEndSession}
            disabled={userMessagesCount === 0 || isSending}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-indigo-300" />
            <span>End & Analyze Session</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="flex-1">
            <span className="font-semibold">Error: </span>
            {error}
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-700">
            ×
          </button>
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="bg-slate-50/70 rounded-2xl border border-slate-200/90 p-4 sm:p-6 min-h-[55vh] max-h-[65vh] overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id || index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold mt-0.5 ${
                  isUser
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-indigo-600 shadow-2xs'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-slate-100 rounded-tr-xs shadow-xs'
                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs'
                }`}
              >
                {/* Safe text display protecting against XSS */}
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <div
                  className={`mt-1.5 text-[10px] ${
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

        {/* Typing indicator */}
        {isSending && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg shrink-0 bg-white border border-slate-200 text-indigo-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
              <div
                className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: '0.15s' }}
              />
              <div
                className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
                style={{ animationDelay: '0.3s' }}
              />
              <span className="text-xs text-slate-500 ml-1">Reflecting with Gemini...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs space-y-2">
        <form onSubmit={handleSendMessage} className="space-y-2">
          <textarea
            ref={textareaRef}
            id="journal-chat-input"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Write your thoughts, feelings, or ask Gemini for reflection guidance... (Press Enter to send, Shift+Enter for newline)"
            rows={3}
            disabled={isSending}
            maxLength={4000}
            className="w-full resize-none bg-transparent border-0 focus:ring-0 focus:outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed p-1"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>
                {inputContent.length} / 4000 chars
              </span>
              <span className="hidden sm:inline">· Shift+Enter for new line</span>
            </div>

            <button
              type="submit"
              id="send-message-btn"
              disabled={!inputContent.trim() || isSending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs"
            >
              {isSending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>

      {/* Save & Analyze Session Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl p-6 sm:p-7 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    End Session & Generate AI Insights
                  </h2>
                  <p className="text-xs text-slate-500">
                    Extract structured reflections and save to your isolated Firestore
                  </p>
                </div>
              </div>
              {!isAnalyzing && !isSavingToFirestore && (
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {saveError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Session Title Input */}
            <div className="space-y-1.5">
              <label htmlFor="session-title" className="block text-xs font-semibold text-slate-700">
                Journal Entry Title
              </label>
              <input
                id="session-title"
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="Give your reflection session a title..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
              />
            </div>

            {/* AI Analysis Preview or Loading State */}
            {isAnalyzing ? (
              <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 text-center space-y-3">
                <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mx-auto" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900">
                    Gemini is analyzing your conversation...
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Synthesizing emotional tone, identifying recurrent themes, and formulating
                    gentle self-realizations.
                  </p>
                </div>
              </div>
            ) : analysisResult ? (
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    Identified Mood
                  </span>
                  <MoodBadge mood={analysisResult.mood} size="sm" />
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    AI Summary
                  </span>
                  <p className="text-slate-800 leading-relaxed font-normal bg-white p-3 rounded-lg border border-slate-200/80 shadow-2xs">
                    {analysisResult.summary}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Extracted Topics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px] font-medium"
                      >
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                    Key Insights
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-slate-700 text-xs">
                    {analysisResult.insights.map((insight, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

                {analysisResult.nextAction && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Suggested Next Action
                    </span>
                    <p className="text-emerald-950 font-medium text-xs">
                      {analysisResult.nextAction}
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setShowSaveModal(false)}
                disabled={isSavingToFirestore || isAnalyzing}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
              >
                Back to Chat
              </button>

              <button
                id="confirm-save-entry-btn"
                onClick={handleConfirmSave}
                disabled={isSavingToFirestore || isAnalyzing}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold transition inline-flex items-center gap-1.5 shadow-xs"
              >
                {isSavingToFirestore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Writing to Firestore...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save to Private Journal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
