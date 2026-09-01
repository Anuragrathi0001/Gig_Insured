import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, LayoutDashboard, UserCheck, LogOut, CheckCircle2,
  RefreshCw, Sun, Moon, Menu, X
} from 'lucide-react';

/* ── Logout Confirmation Modal ─────────────────────────────────────────── */
function LogoutModal({ workerName, onConfirm, onCancel }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] shadow-2xl p-6 flex flex-col gap-5"
        style={{ animation: 'logoutModalIn 0.2s cubic-bezier(.4,0,.2,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center border border-[var(--destructive)]/20">
            <LogOut className="w-6 h-6 text-[var(--destructive)]" />
          </div>
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-base font-bold text-[var(--foreground)] font-sans">Sign out of Gig Insured?</h2>
          <p className="text-sm text-[var(--muted-foreground)] font-sans">
            Hey <span className="font-semibold text-[var(--foreground)]">{workerName || 'there'}</span>, you'll need to sign in again to access your dashboard and policies.
          </p>
        </div>
        <div className="flex gap-3 mt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-[calc(var(--radius)*0.6)] border border-[var(--border)] bg-[var(--secondary)]/40 text-[var(--foreground)] font-semibold text-sm hover:bg-[var(--secondary)] transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-[calc(var(--radius)*0.6)] bg-[var(--destructive)] text-white font-bold text-sm hover:brightness-110 transition-all active:scale-95 shadow-sm"
          >
            Yes, Sign Out
          </button>
        </div>
      </div>
      <style>{`
        @keyframes logoutModalIn {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Navbar ─────────────────────────────────────────────────────────────── */
export default function Navbar() {
  const { worker, firebaseUser, isAuthenticated, loginWithGoogle, logout, loading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  const toggleTheme = () => setIsDark(prev => !prev);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setMobileMenuOpen(false);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Navbar Google sign-in failed:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogoutClick = () => { setShowLogoutModal(true); setMobileMenuOpen(false); };
  const handleLogoutConfirm = async () => { setShowLogoutModal(false); await logout(); };
  const handleLogoutCancel = () => setShowLogoutModal(false);

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          workerName={worker?.name?.split(' ')[0]}
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />
      )}

      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* ── Logo ── */}
            <NavLink to="/" className="flex items-center gap-2 group shrink-0" onClick={() => setMobileMenuOpen(false)}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-[var(--foreground)] flex items-center gap-1.5 font-sans leading-none">
                  Gig Insured
                  <span className="hidden xs:inline text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">
                    AI
                  </span>
                </span>
                <p className="text-[9px] sm:text-[10px] text-[var(--muted-foreground)] hidden sm:block leading-none mt-0.5">
                  Income Protection for Gig Delivery Workers
                </p>
              </div>
            </NavLink>

            {/* ── Desktop Nav ── */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2.5">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-[calc(var(--radius)*0.5)] text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 shadow-sm'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`
                }
              >
                <UserCheck className="w-4 h-4" />
                <span>Worker Portal</span>
              </NavLink>

              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-[calc(var(--radius)*0.5)] text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 shadow-sm'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin</span>
              </NavLink>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="p-2 rounded-[calc(var(--radius)*0.4)] bg-[var(--secondary)]/60 hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] transition-all flex items-center justify-center shadow-sm active:scale-95"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400 stroke-[2.5]" /> : <Moon className="w-4 h-4 text-[var(--accent)] stroke-[2.5]" />}
              </button>

              {/* Auth */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
                  {worker?.photo_url || firebaseUser?.photoURL ? (
                    <img
                      src={worker?.photo_url || firebaseUser?.photoURL}
                      alt={worker?.name || 'Worker'}
                      className="w-8 h-8 rounded-full border border-[var(--primary)]/50 object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center font-bold text-xs">
                      {worker?.name ? worker.name.charAt(0).toUpperCase() : 'W'}
                    </div>
                  )}
                  <div className="hidden lg:flex flex-col text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[var(--foreground)] max-w-[110px] truncate">{worker?.name || 'Worker'}</span>
                      <CheckCircle2 className="w-3 h-3 text-[var(--primary)]" />
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-medium truncate max-w-[110px]">
                      {worker?.email || 'Google Verified'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogoutClick}
                    title="Sign Out"
                    className="p-2 rounded-[calc(var(--radius)*0.4)] bg-[var(--secondary)]/50 hover:bg-[var(--destructive)]/10 text-[var(--muted-foreground)] hover:text-[var(--destructive)] border border-[var(--border)] hover:border-[var(--destructive)]/30 transition-all active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shadow-md hover:brightness-110 transition-all border border-[var(--border)] disabled:opacity-50"
                >
                  {googleLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  )}
                  <span>{googleLoading ? 'Signing in...' : 'Sign in'}</span>
                </button>
              )}
            </nav>

            {/* ── Mobile Right Controls ── */}
            <div className="flex md:hidden items-center gap-2">
              {/* Theme toggle visible on mobile */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="p-2 rounded-[calc(var(--radius)*0.4)] bg-[var(--secondary)]/60 border border-[var(--border)] transition-all active:scale-95"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[var(--accent)]" />}
              </button>

              {/* Avatar (if logged in) */}
              {isAuthenticated && (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--primary)]/50 shrink-0">
                  {worker?.photo_url || firebaseUser?.photoURL ? (
                    <img src={worker?.photo_url || firebaseUser?.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                      {worker?.name ? worker.name.charAt(0).toUpperCase() : 'W'}
                    </div>
                  )}
                </div>
              )}

              {/* Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(prev => !prev)}
                aria-label="Toggle Menu"
                className="p-2 rounded-[calc(var(--radius)*0.4)] bg-[var(--secondary)]/60 border border-[var(--border)] transition-all active:scale-95"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-[var(--foreground)]" /> : <Menu className="w-5 h-5 text-[var(--foreground)]" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Dropdown Menu ── */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t border-[var(--border)] bg-[var(--card)] px-4 py-4 space-y-2"
            style={{ animation: 'mobileMenuIn 0.18s ease' }}
          >
            {/* Worker info strip */}
            {isAuthenticated && worker && (
              <div className="flex items-center gap-3 p-3 rounded-[calc(var(--radius)*0.6)] bg-[var(--muted)] mb-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--primary)]/40 shrink-0">
                  {worker?.photo_url || firebaseUser?.photoURL ? (
                    <img src={worker?.photo_url || firebaseUser?.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center font-bold">
                      {worker.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-[var(--foreground)] truncate">{worker.name}</p>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)] truncate">{worker.email}</p>
                </div>
              </div>
            )}

            <NavLink
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-[calc(var(--radius)*0.6)] text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30'
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`
              }
            >
              <UserCheck className="w-4 h-4" />
              <span>Worker Portal</span>
            </NavLink>

            <NavLink
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-[calc(var(--radius)*0.6)] text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30'
                    : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </NavLink>

            <div className="pt-2 border-t border-[var(--border)]">
              {isAuthenticated ? (
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[calc(var(--radius)*0.6)] text-sm font-semibold text-[var(--destructive)] hover:bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-sm shadow-md hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {googleLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                  )}
                  <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        <style>{`
          @keyframes mobileMenuIn {
            from { opacity: 0; transform: translateY(-6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </header>
    </>
  );
}
