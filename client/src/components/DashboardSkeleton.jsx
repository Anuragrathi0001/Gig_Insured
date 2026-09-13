import React from 'react';
import { ShieldCheck, IndianRupee, ShieldAlert, Calendar } from 'lucide-react';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 animate-pulse">
      {/* ── 3 Hero Stat Cards Skeleton ── */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Coverage Status Card */}
        <div className="p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-24 bg-[var(--muted)] rounded-md" />
            <div className="h-5 w-20 bg-[var(--primary)]/15 rounded-full" />
          </div>
          <div className="h-6 w-32 bg-[var(--muted)] rounded-md" />
          <div className="h-3 w-40 bg-[var(--muted)]/60 rounded-md" />
        </div>

        {/* Total Earnings Protected Card */}
        <div className="p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-28 bg-[var(--muted)] rounded-md" />
            <div className="w-5 h-5 rounded-full bg-[var(--primary)]/20" />
          </div>
          <div className="h-7 w-20 bg-[var(--primary)]/20 rounded-md" />
          <div className="h-3 w-36 bg-[var(--muted)]/60 rounded-md" />
        </div>

        {/* Qualitative Risk Level Card */}
        <div className="p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-32 bg-[var(--muted)] rounded-md" />
            <div className="w-5 h-5 rounded-full bg-emerald-500/20" />
          </div>
          <div className="h-6 w-28 bg-emerald-500/15 rounded-md" />
          <div className="h-3 w-40 bg-[var(--muted)]/60 rounded-md" />
        </div>
      </div>

      {/* ── 7-Day Timeline Skeleton ── */}
      <div className="p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[var(--muted)]" />
            <div className="h-4 w-40 bg-[var(--muted)] rounded-md" />
          </div>
          <div className="h-3 w-16 bg-[var(--muted)]/60 rounded-md" />
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex flex-col items-center p-2 rounded-lg bg-[var(--secondary)]/50 border border-[var(--border)]/60 space-y-2">
              <div className="h-3 w-6 bg-[var(--muted)] rounded" />
              <div className="h-3 w-4 bg-[var(--muted)]/60 rounded" />
              <div className="w-6 h-6 rounded-full bg-[var(--muted)]" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Claims History Skeleton ── */}
      <div className="p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 bg-[var(--muted)] rounded-md" />
          <div className="h-3 w-20 bg-[var(--muted)]/60 rounded-md" />
        </div>
        <div className="space-y-2 pt-1">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-3.5 rounded-lg bg-[var(--secondary)]/40 border border-[var(--border)]/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--muted)] shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-[var(--muted)] rounded" />
                  <div className="h-2.5 w-48 bg-[var(--muted)]/60 rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-[var(--muted)] rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
