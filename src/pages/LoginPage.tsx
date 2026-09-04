import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Database,
  KeyRound,
  AlertCircle,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { signInWithGoogle, error: authError, clearError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setLocalError(null);
    clearError();

    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setLocalError(message);
    } finally {
      setIsSigningIn(false);
    }
  };

  const securityPoints = [
    {
      icon: ShieldCheck,
      title: 'Per-User Firestore Isolation',
      desc: 'Entries are saved strictly under /users/{uid}/journalEntries with security rules preventing cross-user access.',
    },
    {
      icon: KeyRound,
      title: 'Secret Manager & Server-Side AI',
      desc: 'Gemini API keys are protected in Google Cloud Secret Manager and never exposed to the client browser.',
    },
    {
      icon: Lock,
      title: 'Cryptographic Token Verification',
      desc: 'Every backend request strictly validates Firebase ID token claims rather than client-supplied UIDs.',
    },
    {
      icon: Database,
      title: 'Prompt Injection Defense',
      desc: 'Journal entries are sanitized and segregated from system instructions to prevent adversarial overriding.',
    },
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left column: Branding & Security Architecture */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Production-Grade AI Journal
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Personal Gemini Journal
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              A private, reflective space powered by Gemini AI. Converse naturally about your thoughts,
              receive thoughtful guided reflections, and track your mood trends with zero data leakage.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {securityPoints.map((pt, idx) => {
              const Icon = pt.icon;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-slate-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900">{pt.title}</h2>
                    <p className="text-xs text-slate-500 leading-normal mt-0.5">{pt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Sign-In Box */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6 text-indigo-300" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Secure Sign In</h2>
            <p className="text-xs text-slate-500">
              Sign in with your Google account to access your personal, encrypted journal space.
            </p>
          </div>

          {(localError || authError) && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <span className="font-semibold">Sign In Notice: </span>
                {localError || authError}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <button
              id="google-signin-btn"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold shadow-xs transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              {isSigningIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                  <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
                </>
              )}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-600">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Strictly isolated per-user storage</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>No shared or public journal collections</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero client exposure of AI API credentials</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
