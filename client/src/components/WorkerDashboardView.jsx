import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, IndianRupee, Calendar, FileText, Download, PauseCircle, PlayCircle, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import axios from 'axios';

export default function WorkerDashboardView({ onSwitchPlan }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRenew, setAutoRenew] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/workers/dashboard');
      setData(res.data.dashboard);
      if (res.data.dashboard?.activePolicy) {
        setAutoRenew(res.data.dashboard.activePolicy.autoRenew ?? true);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleToggleAutoRenew = () => {
    setAutoRenew(!autoRenew);
    alert(`Policy auto-renew ${!autoRenew ? 'enabled' : 'paused'} for next week.`);
  };

  const handleDownloadInvoice = (invoiceId) => {
    const textContent = `GIG INSURED - WEEKLY PREMIUM INVOICE\nInvoice Ref: ${invoiceId}\nWorker: ${data?.worker?.name}\nZone: ${data?.worker?.zone}\nPlan Tier: ${data?.activePolicy?.tier || 'Standard'}\nAmount Paid: ₹${data?.activePolicy?.weeklyPremium || 50}\nPayment Method: Mock UPI (Razorpay X)\nStatus: SUCCESS\nThank you for keeping your delivery earnings protected!`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceId}.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-12 text-center glass-panel rounded-3xl">
        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-400">Loading worker dashboard...</p>
      </div>
    );
  }

  const { worker, activePolicy, totalEarningsProtected, weeklyTimeline, premiumHistory, fraudRiskLevel } = data || {};

  return (
    <div className="space-y-6">
      {/* Hero Stat Header Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Coverage Status Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Coverage Status</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-extrabold uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active 🛡️
            </span>
          </div>
          <p className="text-xl font-extrabold text-white">{activePolicy?.tier || 'Standard'} Tier</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Zone: <strong className="text-emerald-400">{worker?.zone || 'Indiranagar'}</strong> (Cap ₹{activePolicy?.weeklyBenefitCap || 3000})
          </p>
        </div>

        {/* Total Earnings Protected Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Earnings Protected</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400">₹{totalEarningsProtected}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">All-time parametric payouts disbursed</p>
        </div>

        {/* Qualitative Risk Level Masking Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">Account Safety Status</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-extrabold text-white">
            {fraudRiskLevel ? (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> {fraudRiskLevel} Risk Flag
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Trusted Partner
              </span>
            )}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {fraudRiskLevel ? 'Telemetry review active' : 'Clean telemetry & verified KYC'}
          </p>
        </div>
      </div>

      {/* 7-Day Weekly Timeline Visualization */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">7-Day Weekly Coverage & Disruption Timeline</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Mon - Sun Window</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
          {(weeklyTimeline || []).map((t, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-between min-h-[90px] transition-all ${
                t.isToday
                  ? 'bg-emerald-500/10 border-emerald-500 shadow-lg'
                  : 'bg-slate-950 border-slate-800/80'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-300">{t.day}</div>
              <div className="text-[10px] text-slate-500">{t.date}</div>
              <div className="mt-2">
                {t.status.includes('Payout') ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500 text-slate-950">
                    ₹ PAID
                  </span>
                ) : t.status.includes('Disruption') ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    ⚡ ALERT
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    🛡️ Safe
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium History & Downloadable Receipts */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Weekly Premium Payment History & Receipts</h3>
          </div>
        </div>

        <div className="space-y-2.5">
          {(premiumHistory || []).map((inv) => (
            <div
              key={inv.invoiceId}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{inv.tier} Plan Weekly Premium</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {inv.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Ref: {inv.invoiceId} • Paid on {inv.date}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-extrabold text-white text-sm">₹{inv.amount}</span>
                <button
                  onClick={() => handleDownloadInvoice(inv.invoiceId)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Invoice</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Auto-Renew & Pause Controls */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Policy Renewal & Cancellation Controls
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-renew is active for next Monday-Sunday coverage cycle. Changes respect the 24-hour pre-week window.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchPlan}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
          >
            Upgrade Plan
          </button>
          <button
            onClick={handleToggleAutoRenew}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
              autoRenew
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {autoRenew ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            <span>{autoRenew ? 'Pause Auto-Renew' : 'Enable Auto-Renew'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
