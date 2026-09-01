import React from 'react';
import { ShieldCheck, Calendar, IndianRupee, Clock, RefreshCw, CheckCircle2, Zap } from 'lucide-react';

export default function ActivePolicyCard({ policy, onSwitchPlan }) {
  if (!policy) return null;

  const startDate = new Date(policy.coveragePeriodStart).toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const endDate = new Date(policy.coveragePeriodEnd).toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Calculate days remaining in coverage week
  const now = new Date();
  const end = new Date(policy.coveragePeriodEnd);
  const diffTime = end - now;
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(100, Math.max(0, Math.round(((7 - diffDays) / 7) * 100)));

  return (
    <div className="rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] p-6 sm:p-8 shadow-xl relative overflow-hidden text-[var(--card-foreground)]">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-[var(--foreground)]">{policy.tier} Tier Income Coverage</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 text-xs font-extrabold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse"></span>
                Active 🛡️
              </span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Parametric Protection for Current Delivery Week</p>
          </div>
        </div>

        {onSwitchPlan && (
          <button
            onClick={onSwitchPlan}
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] underline font-semibold transition-colors"
          >
            Switch / Upgrade Plan
          </button>
        )}
      </div>

      {/* Coverage Period & Countdown Bar */}
      <div className="mb-6 p-4 rounded-[calc(var(--radius)*0.75)] bg-[var(--background)] border border-[var(--border)]">
        <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-2">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
            Coverage Window: <strong className="text-[var(--foreground)]">{startDate} – {endDate}</strong>
          </span>
          <span className="font-bold text-[var(--primary)]">{diffDays} Days Remaining</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[var(--muted)] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[var(--primary)] h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Active Benefits Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)]">
          <span className="text-[11px] text-[var(--muted-foreground)] font-medium flex items-center gap-1 mb-1">
            <IndianRupee className="w-3.5 h-3.5 text-[var(--primary)]" /> Weekly Premium Paid
          </span>
          <p className="text-base font-extrabold text-[var(--foreground)]">₹{policy.weeklyPremium}</p>
        </div>

        <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)]">
          <span className="text-[11px] text-[var(--muted-foreground)] font-medium flex items-center gap-1 mb-1">
            <Zap className="w-3.5 h-3.5 text-[var(--primary)]" /> Max Weekly Cap
          </span>
          <p className="text-base font-extrabold text-[var(--foreground)]">₹{policy.weeklyBenefitCap?.toLocaleString('en-IN')}</p>
        </div>

        <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)]">
          <span className="text-[11px] text-[var(--muted-foreground)] font-medium flex items-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-[var(--accent)]" /> Disruption Rate
          </span>
          <p className="text-xs font-bold text-[var(--foreground)] mt-1">₹{policy.hourlyDisruptionRate || 250}/hr lost</p>
        </div>

        <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)]">
          <span className="text-[11px] text-[var(--muted-foreground)] font-medium flex items-center gap-1 mb-1">
            <RefreshCw className="w-3.5 h-3.5 text-[var(--primary)]" /> Auto-Renew
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
            policy.autoRenew ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30' : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
          }`}>
            {policy.autoRenew ? 'Enabled (UPI)' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Zero Claims Notice */}
      <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-xs text-[var(--foreground)] flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
          AI Weather & Disruption Sensors are actively monitoring your zone. Zero manual claims required.
        </span>
      </div>
    </div>
  );
}
