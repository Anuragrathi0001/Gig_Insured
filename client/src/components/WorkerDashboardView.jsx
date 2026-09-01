import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, IndianRupee, Calendar, FileText, Download, PauseCircle, PlayCircle, RefreshCw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
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
      <div className="p-12 text-center glass-panel rounded-[var(--radius)]">
        <RefreshCw className="w-6 h-6 text-[var(--primary)] animate-spin mx-auto mb-2" />
        <p className="text-xs text-[var(--muted-foreground)]">Loading worker dashboard...</p>
      </div>
    );
  }

  const { worker, activePolicy, totalEarningsProtected, weeklyTimeline, premiumHistory, fraudRiskLevel } = data || {};

  return (
    <div className="space-y-6">
      {/* Hero Stat Header Row */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Coverage Status Card */}
        <div className="p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">Coverage Status</span>
            <span className="px-2.5 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 text-[11px] font-extrabold uppercase flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Active 🛡️
            </span>
          </div>
          <p className="text-xl font-extrabold text-[var(--foreground)]">{activePolicy?.tier || 'Standard'} Tier</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Zone: <strong className="text-[var(--primary)]">{worker?.zone || 'Indiranagar'}</strong> (Cap ₹{activePolicy?.weeklyBenefitCap || 3000})
          </p>
        </div>

        {/* Total Earnings Protected Card */}
        <div className="p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">Earnings Protected</span>
            <IndianRupee className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <p className="text-3xl font-extrabold text-[var(--primary)]">₹{totalEarningsProtected}</p>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">All-time parametric payouts disbursed</p>
        </div>

        {/* Qualitative Risk Level Masking Card */}
        <div className="p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[var(--muted-foreground)]">Account Safety Status</span>
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <p className="text-xl font-extrabold text-[var(--foreground)]">
            {fraudRiskLevel ? (
              <span className="text-[var(--chart-3)] flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> {fraudRiskLevel} Risk Flag
              </span>
            ) : (
              <span className="text-[var(--primary)] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Trusted Partner
              </span>
            )}
          </p>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
            {fraudRiskLevel ? 'Telemetry review active' : 'Clean telemetry & verified KYC'}
          </p>
        </div>
      </div>

      {/* 7-Day Weekly Timeline Visualization */}
      <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-xs sm:text-sm font-bold text-[var(--foreground)] font-sans">7-Day Coverage Timeline</h3>
          </div>
          <span className="text-[10px] sm:text-[11px] text-[var(--muted-foreground)] font-medium">Mon – Sun</span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
          {(weeklyTimeline || []).map((t, idx) => (
            <div
              key={idx}
              className={`p-1.5 sm:p-2.5 rounded-[calc(var(--radius)*0.4)] border flex flex-col items-center justify-between min-h-[70px] sm:min-h-[90px] transition-all ${
                t.isToday
                  ? 'bg-[var(--primary)]/15 border-[var(--primary)] shadow-sm'
                  : 'bg-[var(--background)] border-[var(--border)]'
              }`}
            >
              <div className="text-[9px] sm:text-[11px] font-bold text-[var(--foreground)]">{t.day}</div>
              <div className="text-[8px] sm:text-[10px] text-[var(--muted-foreground)] hidden xs:block">{t.date}</div>
              <div className="mt-1">
                {t.status.includes('Payout') ? (
                  <span className="px-1 py-0.5 rounded text-[7px] sm:text-[9px] font-extrabold bg-[var(--primary)] text-[var(--primary-foreground)] block">
                    ₹PAID
                  </span>
                ) : t.status.includes('Disruption') ? (
                  <span className="px-1 py-0.5 rounded text-[7px] sm:text-[9px] font-extrabold bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 block">
                    ⚡
                  </span>
                ) : (
                  <span className="px-1 py-0.5 rounded text-[8px] sm:text-[9px] font-semibold text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 block">
                    🛡️
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium History & Downloadable Receipts */}
      <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <FileText className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-xs sm:text-sm font-bold text-[var(--foreground)] font-sans">Premium History & Receipts</h3>
        </div>

        <div className="space-y-2">
          {(premiumHistory || []).map((inv) => (
            <div
              key={inv.invoiceId}
              className="p-3 sm:p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)] flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[var(--foreground)] flex flex-wrap items-center gap-1.5">
                  <span className="truncate">{inv.tier} Plan Premium</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 shrink-0">
                    {inv.status}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-[var(--muted-foreground)] mt-0.5 truncate">
                  {inv.invoiceId} · {inv.date}
                </div>
              </div>
              <div className="flex items-center justify-between xs:justify-end gap-3 shrink-0">
                <span className="font-extrabold text-[var(--foreground)] text-sm">₹{inv.amount}</span>
                <button
                  onClick={() => handleDownloadInvoice(inv.invoiceId)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--secondary-foreground)] font-medium transition-colors border border-[var(--border)] active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Invoice</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Auto-Renew & Pause Controls */}
      <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md flex flex-col gap-3 sm:gap-4">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--primary)]" />
            Policy Renewal & Cancellation Controls
          </h4>
          <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
            Auto-renew is active for next Monday-Sunday coverage cycle. Changes respect the 24-hour pre-week window.
          </p>
        </div>
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
          <button
            onClick={onSwitchPlan}
            className="flex-1 xs:flex-none flex items-center justify-center px-3.5 py-2.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--secondary-foreground)] font-bold text-xs transition-colors border border-[var(--border)] active:scale-95"
          >
            Upgrade Plan
          </button>
          <button
            onClick={handleToggleAutoRenew}
            className={`flex-1 xs:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[calc(var(--radius)*0.5)] font-bold text-xs transition-all active:scale-95 ${
              autoRenew
                ? 'bg-[var(--secondary)]/70 hover:bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)]'
                : 'bg-[var(--primary)]/15 hover:bg-[var(--primary)]/25 text-[var(--primary)] border border-[var(--primary)]/30'
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
