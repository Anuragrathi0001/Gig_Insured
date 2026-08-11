import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OtpLoginModal from './OtpLoginModal';
import { Shield, LayoutDashboard, UserCheck, LogIn, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { worker, isAuthenticated, logout } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Brand */}
            <NavLink to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <Shield className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Gig Insured <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">AI Parametric</span>
                </span>
                <p className="text-[10px] text-slate-400 hidden sm:block">Income Protection for Gig Delivery Workers</p>
              </div>
            </NavLink>

            {/* Navigation Links & Auth Button */}
            <nav className="flex items-center gap-1.5 sm:gap-3">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <UserCheck className="w-4 h-4" />
                <span>Worker Portal</span>
              </NavLink>

              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </NavLink>

              {/* Login / Profile */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-white max-w-[120px] truncate">{worker?.name}</span>
                    <span className="text-[10px] text-emerald-400 font-medium">+91 {worker?.mobile}</span>
                  </div>
                  <button
                    onClick={logout}
                    title="Log Out"
                    className="p-2 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all"
                >
                  <LogIn className="w-4 h-4 stroke-[2.5]" />
                  <span>OTP Login</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* OTP Login Modal */}
      <OtpLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(res) => {
          console.log('[Auth Success]: Worker authenticated', res);
        }}
      />
    </>
  );
}
