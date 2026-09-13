import React, { useEffect } from 'react';
import { LogOut } from 'lucide-react';

export default function LogoutModal({ workerName, onConfirm, onCancel }) {
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
            className="flex-1 px-4 py-3 rounded-[calc(var(--radius)*0.6)] border border-[var(--border)] bg-[var(--secondary)]/40 text-[var(--foreground)] font-semibold text-sm hover:bg-[var(--secondary)] transition-all active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-[calc(var(--radius)*0.6)] bg-[var(--destructive)] text-white font-bold text-sm hover:brightness-110 transition-all active:scale-95 shadow-sm cursor-pointer"
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
