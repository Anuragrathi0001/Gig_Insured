import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OnboardingForm from '../components/OnboardingForm';
import PlanSelection from '../components/PlanSelection';
import ActivePolicyCard from '../components/ActivePolicyCard';
import ClaimsList from '../components/ClaimsList';
import WorkerDashboardView from '../components/WorkerDashboardView';
import LandingPage from '../components/LandingPage';
import {
  ShieldCheck, Zap, AlertTriangle, IndianRupee,
  CheckCircle2, RefreshCw, PlusCircle, WifiOff
} from 'lucide-react';
import axios from 'axios';

export default function WorkerPortal() {
  const { worker, firebaseUser, isAuthenticated, loginWithGoogle } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [healthStatus, setHealthStatus] = useState('Checking...');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [fromOnboarding, setFromOnboarding] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const handleOpenEdit = () => {
      setOnboardingStep(1);
      setShowOnboarding(true);
      setFromOnboarding(true);
      setShowPlanSelection(false);
      setActivePolicy(null);
    };

    window.addEventListener('open-edit-profile', handleOpenEdit);

    if (searchParams.get('editProfile') === 'true') {
      handleOpenEdit();
      setSearchParams({}, { replace: true });
    }

    return () => {
      window.removeEventListener('open-edit-profile', handleOpenEdit);
    };
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    axios.get('/api/health')
      .then(res => setHealthStatus(`Online (${res.data.status})`))
      .catch(() => setHealthStatus('Offline / Server Standby'));
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchActivePolicy();
  }, [isAuthenticated]);

  const fetchActivePolicy = async () => {
    setPolicyLoading(true);
    try {
      const res = await axios.get('/api/policy/active');
      if (res.data.hasActivePolicy && res.data.policy) {
        setActivePolicy(res.data.policy);
        // Only clear views if not actively in onboarding
        setShowPlanSelection(prev => (prev ? false : prev));
      } else {
        setActivePolicy(null);
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

  if (!isAuthenticated || !worker) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
        <LandingPage
          onLogin={handleGoogleSignIn}
          loading={googleLoading}
          healthStatus={healthStatus}
        />
      </div>
    );
  }

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
      <div className="space-y-4 sm:space-y-6 mb-8">

        {/* Worker Profile Header Card - only displayed on dashboard, hidden during 3-step onboarding flow */}
        {!showOnboarding && !showPlanSelection && (
          <div className="p-3 sm:p-4 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-md">
            <div className="flex items-center justify-between gap-3">
              {/* Left: avatar + info */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                {worker?.photo_url || firebaseUser?.photoURL ? (
                  <img
                    src={worker?.photo_url || firebaseUser?.photoURL}
                    alt={worker.name || 'Worker'}
                    className="w-11 h-11 sm:w-13 sm:h-13 rounded-[calc(var(--radius)*0.5)] border-2 border-[var(--primary)]/40 object-cover shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-base sm:text-lg shadow-sm shrink-0">
                    {worker.name ? worker.name.charAt(0).toUpperCase() : 'W'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    <h2 className="text-sm sm:text-base font-extrabold text-[var(--foreground)] truncate">
                      {worker.name || 'Gig Delivery Partner'}
                    </h2>
                    <span className="px-1.5 py-0.2 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 text-[9px] sm:text-[10px] font-bold uppercase shrink-0">
                      {worker.platform || 'Zomato'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                      {worker?.kycStatus === 'verified' ? 'Verified' : 'In Setup'}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] truncate">
                    <code className="text-[var(--primary)] font-mono font-semibold">{worker.workerId || worker.worker_id}</code>
                    <span className="mx-1">·</span>
                    <strong className="text-[var(--foreground)] font-medium">{worker.zone}, {worker.city}</strong>
                  </p>
                </div>
              </div>

              {/* Right: compact action buttons */}
              {!activePolicy && (
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={() => { setFromOnboarding(false); setShowPlanSelection(true); setShowOnboarding(false); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--primary)] text-[var(--primary-foreground)] text-[11px] font-bold shadow-xs hover:brightness-110 transition-all active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Select Plan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Conditional Flow */}
        {showOnboarding ? (
          <OnboardingForm
            initialStep={onboardingStep}
            onStepChange={(step) => setOnboardingStep(step)}
            onComplete={() => { setFromOnboarding(true); setShowOnboarding(false); setShowPlanSelection(true); }}
            onCancel={worker ? () => {
              setShowOnboarding(false);
              setShowPlanSelection(false);
              fetchActivePolicy();
            } : undefined}
          />
        ) : showPlanSelection ? (
          <PlanSelection
            onPolicyActivated={handlePolicyActivated}
            onBack={() => {
              if (activePolicy || !fromOnboarding) {
                setShowPlanSelection(false);
              } else {
                setOnboardingStep(2);
                setShowPlanSelection(false);
                setShowOnboarding(true);
              }
            }}
            isRegistrationFlow={fromOnboarding && !activePolicy}
          />
        ) : activePolicy ? (
          <div className="space-y-4 sm:space-y-6">
            <WorkerDashboardView onSwitchPlan={() => { setFromOnboarding(false); setShowPlanSelection(true); }} />
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
              onClick={() => { setFromOnboarding(false); setShowPlanSelection(true); }}
              className="w-full sm:w-auto px-6 py-3 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-sm shadow-md hover:brightness-110 transition-all active:scale-95 cursor-pointer"
            >
              View Risk-Adjusted Weekly Tiers
            </button>
          </div>
        )}
      </div>

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
