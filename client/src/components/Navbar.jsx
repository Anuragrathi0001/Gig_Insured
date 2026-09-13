import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Settings,
  UserCheck,
  LayoutDashboard,
  Sun,
  Moon,
  LogOut,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  Edit3
} from 'lucide-react';
import LogoutModal from './LogoutModal';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { worker, firebaseUser, isAuthenticated, loginWithGoogle, logout, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  const handleEditProfile = () => {
    setMenuOpen(false);
    navigate('/?editProfile=true');
    window.dispatchEvent(new CustomEvent('open-edit-profile'));
  };

  // Close menu on route navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Handle click outside and Escape key
  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Lock background scroll when Settings tab is open
  useEffect(() => {
    if (!menuOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [menuOpen]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      setMenuOpen(false);
    } catch (err) {
      console.error('Navbar Google sign-in failed:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          workerName={worker?.name?.split(' ')[0]}
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* ── Brand Logo ── */}
            <NavLink to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0" onClick={() => setMenuOpen(false)}>
              <img
                src="/logo.png"
                alt="Gig Insured"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[calc(var(--radius)*0.6)] object-cover shadow-sm ring-1 ring-black/5 dark:ring-white/10 shrink-0"
              />
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

            {/* ── Right Controls ── */}
            <div ref={triggerRef} className="flex items-center gap-2 sm:gap-3">

              {/* Profile Snippet (Clickable, opens YouTube-style menu) */}
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setMenuOpen(prev => !prev)}
                  title="Account & Settings"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 px-1.5 py-1 sm:px-2 sm:py-1 rounded-[calc(var(--radius)*0.5)] hover:bg-[var(--muted)]/60 transition-colors cursor-pointer text-left"
                >
                  {worker?.photo_url || firebaseUser?.photoURL ? (
                    <img
                      src={worker?.photo_url || firebaseUser?.photoURL}
                      alt={worker?.name || 'Worker'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[var(--primary)]/50 object-cover shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center font-bold text-xs shrink-0">
                      {worker?.name ? worker.name.charAt(0).toUpperCase() : 'W'}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[var(--foreground)] max-w-[120px] truncate">
                        {worker?.name || 'Worker'}
                      </span>
                      <CheckCircle2 className="w-3 h-3 text-[var(--primary)] shrink-0" />
                    </div>
                    <span className="text-[10px] text-[var(--muted-foreground)] font-medium truncate max-w-[120px]">
                      {worker?.email || 'Verified Partner'}
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shadow-sm hover:brightness-110 transition-all border border-[var(--border)] disabled:opacity-50 active:scale-95 cursor-pointer"
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
                  <span className="hidden xs:inline">{googleLoading ? 'Signing in...' : 'Sign in'}</span>
                </button>
              )}

              {/* ── Borderless Settings Logo Button (Toggles YouTube-style flyout menu) ── */}
              <button
                type="button"
                onClick={() => setMenuOpen(prev => !prev)}
                title="Settings & Controls"
                aria-label="Settings"
                aria-expanded={menuOpen}
                className={`p-2 rounded-lg transition-colors active:scale-95 cursor-pointer ${
                  menuOpen
                    ? 'text-[var(--primary)] bg-[var(--primary)]/10'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>

            </div>
          </div>
        </div>

        {/* ── Settings Flyout Menu (Rendered via Portal so blur covers the whole UI) ── */}
        {menuOpen && typeof document !== 'undefined' && createPortal(
          <>
            {/* Fullscreen Backdrop with light blur over entire page UI */}
            <div
              className="fixed inset-0 z-[80] bg-black/30 dark:bg-black/55 transition-all duration-200 cursor-pointer"
              style={{
                animation: 'backdropFadeIn 0.16s ease-out',
                WebkitBackdropFilter: 'blur(5px)',
                backdropFilter: 'blur(5px)',
              }}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Floating Menu Window (Right-anchored like YouTube) */}
            <div
              ref={menuRef}
              style={{ animation: 'youtubeMenuIn 0.16s cubic-bezier(0.16, 1, 0.3, 1)' }}
              className="fixed top-14 sm:top-16 right-3 sm:right-6 z-[90] w-72 sm:w-80 max-w-[calc(100vw-24px)] rounded-2xl border border-[var(--border)] bg-[var(--card)]/98 backdrop-blur-2xl shadow-2xl py-2 select-none overflow-hidden"
            >
              {/* Profile Header Block */}
              {isAuthenticated ? (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--primary)]/40 shrink-0 shadow-xs">
                      {worker?.photo_url || firebaseUser?.photoURL ? (
                        <img src={worker?.photo_url || firebaseUser?.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center font-bold text-sm">
                          {worker?.name ? worker.name.charAt(0).toUpperCase() : 'W'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-[var(--foreground)] truncate">{worker?.name || 'Worker'}</p>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{worker?.email || 'Verified Partner'}</p>
                    </div>
                  </div>
                  {/* Edit Profile Button in Settings Tab */}
                  <button
                    type="button"
                    onClick={handleEditProfile}
                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/25 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              ) : (
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[var(--foreground)]">Guest Account</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">Sign in for full coverage</p>
                  </div>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    className="px-2.5 py-1 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-xs hover:brightness-110 active:scale-95 cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              )}

              <div className="my-1.5 border-t border-[var(--border)]" />

              {/* ── Portals Navigation Section ── */}
              <div className="py-1">
                {/* Worker Portal */}
                <button
                  type="button"
                  onClick={() => {
                    navigate('/');
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--muted)]/80 text-left cursor-pointer ${
                    location.pathname === '/' ? 'text-[var(--primary)] font-bold bg-[var(--primary)]/5' : 'text-[var(--foreground)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    <span>Worker Portal</span>
                  </div>
                  {location.pathname === '/' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 font-bold">
                      Current
                    </span>
                  )}
                </button>

                {/* Admin Portal */}
                <button
                  type="button"
                  onClick={() => {
                    navigate('/admin');
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--muted)]/80 text-left cursor-pointer ${
                    location.pathname === '/admin' ? 'text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5' : 'text-[var(--foreground)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Admin Portal</span>
                  </div>
                  {location.pathname === '/admin' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">
                      Current
                    </span>
                  )}
                </button>
              </div>

              <div className="my-1.5 border-t border-[var(--border)]" />

              {/* ── Theme / Appearance Section (Like YouTube) ── */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]/80 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {isDark ? (
                      <Moon className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <span>Appearance: {isDark ? 'Dark theme' : 'Light theme'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--muted-foreground)] bg-[var(--secondary)]/80 px-2 py-0.5 rounded-md border border-[var(--border)]">
                    <span>{isDark ? 'Dark' : 'Light'}</span>
                  </div>
                </button>
              </div>

              <div className="my-1.5 border-t border-[var(--border)]" />

              {/* ── Sign Out / Login Section ── */}
              <div className="py-1">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Sign out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-left cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 shrink-0 ${googleLoading ? 'animate-spin' : ''}`} />
                    <span>{googleLoading ? 'Connecting...' : 'Sign in with Google'}</span>
                  </button>
                )}
              </div>
            </div>
          </>,
          document.body
        )}

        <style>{`
          @keyframes backdropFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes youtubeMenuIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-6px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
      </header>
    </>
  );
}
