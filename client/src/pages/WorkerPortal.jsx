import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import OnboardingForm from '../components/OnboardingForm';
import PlanSelection from '../components/PlanSelection';
import ActivePolicyCard from '../components/ActivePolicyCard';
import ClaimsList from '../components/ClaimsList';
import WorkerDashboardView from '../components/WorkerDashboardView';
import {
  ShieldCheck, Zap, AlertTriangle, IndianRupee,
  CheckCircle2, RefreshCw, Edit3, PlusCircle, WifiOff
} from 'lucide-react';
import axios from 'axios';

export default function WorkerPortal() {
  const { worker, firebaseUser, isAuthenticated, loginWithGoogle } = useAuth();
  const [healthStatus, setHealthStatus] = useState('Checking...');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/health')
      .then(res => setHealthStatus(`Online (${res.data.status})`))
      .catch(() => setHealthStatus('Offline / Server Standby'));
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchActivePolicy();
  }, [isAuthenticated, worker]);

  const fetchActivePolicy = async () => {
    setPolicyLoading(true);
    try {
      const res = await axios.get('/api/policy/active');
      if (res.data.hasActivePolicy && res.data.policy) {
        setActivePolicy(res.data.policy);
        setShowPlanSelection(false);
        setShowOnboarding(false);
      } else {
        setActivePolicy(null);
        if (worker && worker.kycStatus === 'verified') setShowPlanSelection(true);
      }
    } catch (err) {
      console.error('Failed to fetch active policy', err);
    } finally {
      setPolicyLoading(false);
    }
  };

  const handlePolicyActivated = (newPolicy) => {
    setActivePolicy(newPolicy);
    setShowPlanSelection(false);
    setShowOnboarding(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const res = await loginWithGoogle();
      if (res?.isNewWorker) setShowOnboarding(true);
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] px-3 py-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">

      {/* ── Status Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[calc(var(--radius)*0.7)] bg-[var(--card)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${healthStatus.includes('Online') ? 'bg-[var(--primary)] animate-pulse' : 'bg-[var(--destructive)]'}`} />
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--muted-foreground)]">
            API: <span className={`font-bold ${healthStatus.includes('Online') ? 'text-[var(--primary)]' : 'text-[var(--destructive)]'}`}>{healthStatus}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[var(--muted-foreground)]">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)]" />
          <span className="hidden xs:inline">Parametric Protection Engine Active</span>
          <span className="xs:hidden">Engine Active</span>
        </div>
      </div>

      {/* ── Authenticated View ── */}
      {isAuthenticated && worker ? (
        <div className="space-y-4 sm:space-y-6 mb-8">

          {/* Worker Profile Header Card */}
          <div className="p-4 sm:p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
            <div className="flex flex-col gap-3">
              {/* Top row: avatar + info */}
              <div className="flex items-start gap-3 sm:gap-4">
                {worker?.photo_url || firebaseUser?.photoURL ? (
                  <img
                    src={worker?.photo_url || firebaseUser?.photoURL}
                    alt={worker.name || 'Worker'}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-[calc(var(--radius)*0.5)] border-2 border-[var(--primary)]/40 object-cover shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shrink-0">
                    {worker.name ? worker.name.charAt(0).toUpperCase() : 'W'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <h2 className="text-base sm:text-lg font-extrabold text-[var(--foreground)] truncate">{worker.name || 'Gig Delivery Partner'}</h2>
                    <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 text-[9px] sm:text-[10px] font-bold uppercase shrink-0">
                      {worker.platform || 'Zomato'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5 text-[var(--primary)]" />
                      Verified
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate">
                    <code className="text-[var(--primary)] font-mono font-semibold">{worker.workerId || worker.worker_id}</code>
                    <span className="mx-1">·</span>
                    <strong className="text-[var(--foreground)] font-semibold">{worker.zone}, {worker.city}</strong>
                  </p>
                </div>
              </div>

              {/* Action buttons row */}
              <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3">
                <button
                  onClick={() => { setShowOnboarding(true); setShowPlanSelection(false); }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-[calc(var(--radius)*0.5)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-xs font-semibold text-[var(--secondary-foreground)] border border-[var(--border)] transition-all shadow-sm active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Edit Profile</span>
                </button>
                {!activePolicy && (
                  <button
                    onClick={() => { setShowPlanSelection(true); setShowOnboarding(false); }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-bold shadow-md hover:brightness-110 transition-all active:scale-95"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Select Plan</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Conditional Flow */}
          {showOnboarding ? (
            <OnboardingForm onComplete={() => { setShowOnboarding(false); setShowPlanSelection(true); }} />
          ) : showPlanSelection ? (
            <PlanSelection onPolicyActivated={handlePolicyActivated} />
          ) : activePolicy ? (
            <div className="space-y-4 sm:space-y-6">
              <WorkerDashboardView onSwitchPlan={() => setShowPlanSelection(true)} />
              <ClaimsList />
            </div>
          ) : (
            <div className="p-6 sm:p-10 text-center bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-md space-y-4">
              <div className="w-14 h-14 rounded-[calc(var(--radius)*0.7)] bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center mx-auto border border-[var(--primary)]/30">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">No Active Insurance Policy</h3>
                <p className="text-xs sm:text-sm text-[var(--muted-foreground)] max-w-sm mx-auto mt-1 leading-relaxed">
                  Protect your weekly delivery earnings against heavy rain, heatwaves, and civic disruptions.
                </p>
              </div>
              <button
                onClick={() => setShowPlanSelection(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-sm shadow-md hover:brightness-110 transition-all active:scale-95"
              >
                View Risk-Adjusted Weekly Tiers
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Guest Hero Banner ── */
        <div className="relative overflow-hidden rounded-[var(--radius)] p-5 sm:p-8 bg-[var(--card)] border border-[var(--border)] shadow-xl mb-4 sm:mb-8">
          <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-48 sm:w-56 h-48 sm:h-56 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[var(--primary)] text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>For Zomato & Swiggy Delivery Partners</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--foreground)] tracking-tight mb-3 leading-tight">
            AI-Powered Income Protection<br className="hidden sm:block" /> for Delivery Workers
          </h1>
          <p className="text-[var(--muted-foreground)] text-xs sm:text-sm max-w-2xl leading-relaxed mb-6">
            Weekly micro-premiums, zero manual paperwork, and instant automated payouts straight to your UPI during severe weather, heatwaves, civic disruption, or platform downtime.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full sm:w-auto px-5 sm:px-6 py-3.5 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-sm shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-3 border border-[var(--border)] disabled:opacity-50 mb-6 active:scale-95"
          >
            {googleLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          {/* Feature Cards – 1 col mobile, 3 col sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: IndianRupee, title: 'Weekly Micro-Premiums', desc: 'Flexible micro-payments based on your active delivery hours' },
              { icon: Zap, title: 'Zero Claims Required', desc: 'AI sensors detect disruptions & trigger instant payouts' },
              { icon: AlertTriangle, title: 'Loss of Income Only', desc: 'Strictly focused on wage stability during working disruptions', accent: true },
            ].map(({ icon: Icon, title, desc, accent }) => (
              <div key={title} className="p-3.5 sm:p-4 rounded-[calc(var(--radius)*0.6)] bg-[var(--background)] border border-[var(--border)] flex items-start gap-3 shadow-sm">
                <div className={`p-2 rounded-[calc(var(--radius)*0.4)] ${accent ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'bg-[var(--primary)]/15 text-[var(--primary)]'} shrink-0`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)]">{title}</h4>
                  <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Scope Disclaimer ── */}
      <div className="p-3.5 sm:p-4 rounded-[calc(var(--radius)*0.6)] bg-[var(--card)] border border-[var(--border)] text-[10px] sm:text-xs text-[var(--muted-foreground)] flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--primary)] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong className="text-[var(--foreground)]">Strict Product Scope:</strong> Gig Insured exclusively covers wage loss caused by external parametric triggers. This policy does not include health, life, vehicle repair, or medical accident insurance.
        </span>
      </div>
    </div>
  );
}
