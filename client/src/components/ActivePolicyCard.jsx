import React from 'react';
import { ShieldCheck, Calendar, IndianRupee, Clock, RefreshCw, CheckCircle2, Zap, AlertTriangle } from 'lucide-react';

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
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-white">{policy.tier} Tier Income Coverage</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active 🛡️
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Parametric Protection for Current Delivery Week</p>
          </div>
        </div>

        {onSwitchPlan && (
          <button
            onClick={onSwitchPlan}
            className="text-xs text-slate-400 hover:text-emerald-400 underline font-semibold transition-colors"
          >
            Switch / Upgrade Plan
          </button>
        )}
      </div>

      {/* Coverage Period & Countdown Bar */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            Coverage Window: <strong className="text-white">{startDate} – {endDate}</strong>
          </span>
          <span className="font-bold text-emerald-400">{diffDays} Days Remaining</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Active Benefits Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Weekly Premium Paid
          </span>
          <p className="text-base font-extrabold text-white">₹{policy.weeklyPremium}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> Max Weekly Cap
          </span>
          <p className="text-base font-extrabold text-white">₹{policy.weeklyBenefitCap?.toLocaleString('en-IN')}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" /> Disruption Rate
          </span>
          <p className="text-xs font-bold text-cyan-300 mt-1">₹{policy.hourlyDisruptionRate || 250}/hr lost</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Auto-Renew
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
            policy.autoRenew ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
          }`}>
            {policy.autoRenew ? 'Enabled (UPI)' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Zero Claims Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          AI Weather & Disruption Sensors are actively monitoring your zone. Zero manual claims required.
        </span>
      </div>
    </div>
  );
}
