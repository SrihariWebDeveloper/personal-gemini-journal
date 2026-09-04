import React, { useState } from 'react';
import {
  BookOpen,
  PenSquare,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: BookOpen },
    { id: 'journal', label: 'New Journal', route: '/journal', icon: PenSquare },
    { id: 'history', label: 'Journal History', route: '/history', icon: History },
    { id: 'settings', label: 'Settings', route: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2.5 text-slate-900 hover:text-slate-700 transition focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-slate-900 tracking-tight text-base sm:text-lg block leading-tight">
                  Personal Gemini Journal
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Isolated & Secure
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => navigate(item.route)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User & Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User profile'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-2xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left max-w-[130px] truncate">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {user.displayName || 'Journaler'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono">
                    {user.email || user.uid.slice(0, 8)}
                  </div>
                </div>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.route);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}

          {user && (
            <div className="pt-4 mt-2 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {user.displayName || 'User'}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {user.email || user.uid}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-md font-medium"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
