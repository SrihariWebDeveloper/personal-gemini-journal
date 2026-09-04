import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onRedirectToLogin: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onRedirectToLogin,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-4 border border-stone-200">
          <Loader2 className="w-6 h-6 text-stone-700 animate-spin" />
        </div>
        <h3 className="text-base font-semibold text-stone-900">Verifying Secure Session</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-xs">
          Authenticating with Firebase and validating Firestore authorization rules...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-700">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">Authentication Required</h2>
        <p className="text-sm text-stone-600 mt-2 max-w-md">
          To ensure personal privacy and strict data isolation, you must sign in with your Google account.
        </p>
        <button
          onClick={onRedirectToLogin}
          className="mt-5 px-5 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition shadow-xs"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
