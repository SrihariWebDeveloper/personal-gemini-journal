import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserJournalEntries } from '../services/journalFirestore';
import {
  ShieldCheck,
  User,
  Download,
  Key,
  Database,
  Lock,
  LogOut,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface SettingsPageProps {
  navigate: (route: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ navigate }) => {
  const { user, logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  const handleCopyUid = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleExportData = async () => {
    if (!user?.uid) return;
    setIsExporting(true);

    try {
      const entries = await getUserJournalEntries(user.uid);
      const exportBlob = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
              },
              journalEntriesCount: entries.length,
              journalEntries: entries,
            },
            null,
            2
          ),
        ],
        { type: 'application/json' }
      );

      const url = URL.createObjectURL(exportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `personal-gemini-journal-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export entries. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Security</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your authenticated identity, view data isolation guarantees, and export records
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Profile'}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full border-2 border-slate-200 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-bold text-xl flex items-center justify-center">
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </div>
          )}

          <div className="space-y-1 min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              {user?.displayName || 'Personal Journaler'}
            </h2>
            <p className="text-xs text-slate-500 font-mono">{user?.email || 'Authenticated User'}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Firebase Authenticated (Google Sign-In)
            </span>
          </div>
        </div>

        {/* UID Display */}
        <div className="pt-4 border-t border-slate-100 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Cryptographic User ID (UID)
          </label>
          <div className="flex items-center gap-2">
            <div className="bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 flex-1 truncate select-all">
              {user?.uid || 'Not available'}
            </div>
            <button
              onClick={handleCopyUid}
              className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition"
            >
              {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUid ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            This immutable identifier is verified from Firebase tokens on every server call.
          </p>
        </div>
      </div>

      {/* Security Architecture Guarantees */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Security Architecture & Isolation</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-slate-700" /> Firestore Isolation Boundary
            </div>
            <p className="text-slate-600 leading-relaxed">
              Your journals are kept strictly at <code className="text-slate-800 font-mono">/users/{user?.uid ? user.uid.slice(0, 8) + '...' : '{uid}'}/journalEntries</code>.
              Database rules enforce <code className="text-slate-800 font-mono">request.auth.uid == uid</code>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-slate-700" /> Secret Manager Protection
            </div>
            <p className="text-slate-600 leading-relaxed">
              Gemini API keys are protected in Google Cloud Secret Manager on the server.
              The client browser never receives or handles AI API credentials.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-700" /> Token-Derived Authorization
            </div>
            <p className="text-slate-600 leading-relaxed">
              Backend endpoints do not trust client-supplied user parameters. The caller identity
              is verified cryptographically from the signed Firebase bearer token.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-700" /> Prompt Injection Safeguards
            </div>
            <p className="text-slate-600 leading-relaxed">
              Journal contents are treated as untrusted text strings. System instructions strictly
              prevent user entries from modifying application logic or models.
            </p>
          </div>
        </div>
      </div>

      {/* Data Export & Account Actions */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Data Portability & Management</h2>
            <p className="text-xs text-slate-500">Download a full JSON archive of all your personal journals</p>
          </div>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition disabled:opacity-50 shadow-xs"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-indigo-300" />
            )}
            <span>Export All Data (JSON)</span>
          </button>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900">End Session</div>
            <div className="text-xs text-slate-500">Sign out of Personal Gemini Journal on this device</div>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
