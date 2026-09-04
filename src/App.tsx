import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { JournalPage } from './pages/JournalPage';
import { HistoryPage } from './pages/HistoryPage';
import { JournalDetailPage } from './pages/JournalDetailPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { user, loading } = useAuth();

  // Simple, robust client router that supports deep links and browser history
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname === '/' || window.location.pathname === ''
      ? '/dashboard'
      : window.location.pathname;
  });

  const [initialTopicFilter, setInitialTopicFilter] = useState<string>('');

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/dashboard';
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Redirect to login if user is not authenticated once loading completes
  useEffect(() => {
    if (!loading) {
      if (!user && currentPath !== '/login') {
        navigate('/login');
      } else if (user && currentPath === '/login') {
        navigate('/dashboard');
      }
    }
  }, [user, loading, currentPath]);

  // Route matching:
  // Check for /journal/:id
  const journalDetailMatch = currentPath.match(/^\/journal\/([a-zA-Z0-9_-]+)$/);
  const activeJournalEntryId = journalDetailMatch ? journalDetailMatch[1] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Show Navbar when authenticated or outside /login */}
      {user && currentPath !== '/login' && (
        <Navbar currentRoute={currentPath} navigate={navigate} />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPath === '/login' ? (
          <LoginPage onSuccess={() => navigate('/dashboard')} />
        ) : activeJournalEntryId ? (
          <ProtectedRoute onRedirectToLogin={() => navigate('/login')}>
            <JournalDetailPage
              entryId={activeJournalEntryId}
              onBack={() => navigate('/history')}
              navigate={navigate}
            />
          </ProtectedRoute>
        ) : currentPath === '/journal' ? (
          <ProtectedRoute onRedirectToLogin={() => navigate('/login')}>
            <JournalPage
              onEntrySaved={(newEntryId) => navigate(`/journal/${newEntryId}`)}
              navigate={navigate}
            />
          </ProtectedRoute>
        ) : currentPath === '/history' ? (
          <ProtectedRoute onRedirectToLogin={() => navigate('/login')}>
            <HistoryPage
              initialTopicFilter={initialTopicFilter}
              onOpenEntry={(entryId) => navigate(`/journal/${entryId}`)}
              navigate={navigate}
            />
          </ProtectedRoute>
        ) : currentPath === '/settings' ? (
          <ProtectedRoute onRedirectToLogin={() => navigate('/login')}>
            <SettingsPage navigate={navigate} />
          </ProtectedRoute>
        ) : (
          /* Default: /dashboard */
          <ProtectedRoute onRedirectToLogin={() => navigate('/login')}>
            <DashboardPage
              navigate={navigate}
              onOpenEntry={(entryId) => navigate(`/journal/${entryId}`)}
              onFilterTopicInHistory={(topic) => {
                setInitialTopicFilter(topic);
                navigate('/history');
              }}
            />
          </ProtectedRoute>
        )}
      </main>

      {/* Global Minimalist Footer */}
      <footer className="border-t border-slate-200/80 bg-white/80 py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-700">
            Personal Gemini Journal · Strictly Isolated Storage
          </span>
          <span className="text-[11px] text-slate-400">
            Cloud Firestore & Firebase Auth · Google Cloud Secret Manager
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
