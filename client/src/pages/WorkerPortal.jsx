import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import OtpLoginModal from '../components/OtpLoginModal';
import OnboardingForm from '../components/OnboardingForm';
import PlanSelection from '../components/PlanSelection';
import ActivePolicyCard from '../components/ActivePolicyCard';
import ClaimsList from '../components/ClaimsList';
import WorkerDashboardView from '../components/WorkerDashboardView';
import { ShieldCheck, Zap, AlertTriangle, IndianRupee, User, CheckCircle2, RefreshCw, KeyRound, MapPin, Building2, CreditCard, Edit3, ArrowRight, Activity, PlusCircle } from 'lucide-react';
import axios from 'axios';

export default function WorkerPortal() {
  const { worker, isAuthenticated } = useAuth();
  const [healthStatus, setHealthStatus] = useState('Checking...');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [activePolicy, setActivePolicy] = useState(null);
  const [policyLoading, setPolicyLoading] = useState(false);

  useEffect(() => {
    axios.get('/api/health')
      .then(res => setHealthStatus(`Online (${res.data.status})`))
      .catch(() => setHealthStatus('Offline / Server Standby'));
  }, []);

  // Fetch active policy when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchActivePolicy();
    }
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
        if (worker && worker.kycStatus === 'verified') {
          setShowPlanSelection(true);
        }
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Hero Status Bar */}
      <div className="flex items-center justify-between gap-3 mb-6 p-3 rounded-xl glass-panel border-emerald-500/20">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-300">Backend API: <span className="text-emerald-400">{healthStatus}</span></span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Parametric Protection Engine Active</span>
        </div>
      </div>

      {/* Main Authenticated View */}
      {isAuthenticated && worker ? (
        <div className="space-y-6 mb-8">
          {/* Worker Profile Header Card */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-bold text-xl">
                  {worker.name ? worker.name.charAt(0) : 'W'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-white">{worker.name}</h2>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                      {worker.platform}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    ID: <code className="text-emerald-400 font-mono">{worker.workerId}</code> | Zone: <strong className="text-white">{worker.zone}, {worker.city}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowOnboarding(true);
                    setShowPlanSelection(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Edit Profile</span>
                </button>

                {!activePolicy && (
                  <button
                    onClick={() => {
                      setShowPlanSelection(true);
                      setShowOnboarding(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/20 text-xs font-bold text-emerald-400 border border-emerald-500/30 transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Select Plan</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Conditional Flow: Onboarding Form vs Plan Selection vs Active Policy Card */}
          {showOnboarding ? (
            <OnboardingForm
              onComplete={() => {
                setShowOnboarding(false);
                setShowPlanSelection(true);
              }}
            />
          ) : showPlanSelection ? (
            <PlanSelection onPolicyActivated={handlePolicyActivated} />
          ) : activePolicy ? (
            <div className="space-y-6">
              <WorkerDashboardView onSwitchPlan={() => setShowPlanSelection(true)} />
              <ClaimsList />
            </div>
          ) : (
            /* Fallback if no active policy & not onboarding */
            <div className="p-8 text-center glass-panel rounded-3xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white">No Active Insurance Policy</h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Protect your weekly delivery earnings against heavy rain, heatwaves, and civic disruptions.
              </p>
              <button
                onClick={() => setShowPlanSelection(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20"
              >
                View Risk-Adjusted Weekly Tiers
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Main Hero Banner for Guest */
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-2xl mb-8">
          <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Designed for Zomato & Swiggy Delivery Partners</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            AI-Powered Income Protection for Delivery Workers
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed mb-6">
            Weekly micro-premiums, zero manual paperwork, and instant automated payouts straight to your UPI during severe weather, extreme heatwaves, civic disruption, or platform downtime.
          </p>

          <button
            onClick={() => setIsLoginOpen(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 mb-8"
          >
            <span>Login with Mobile OTP to Start Onboarding</span>
            <Zap className="w-4 h-4 fill-slate-950" />
          </button>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Weekly Micro-Premiums</h4>
                <p className="text-xs text-slate-400 mt-0.5">Flexible micro-payments based on your active delivery hours</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Zero Claims Required</h4>
                <p className="text-xs text-slate-400 mt-0.5">AI sensors detect disruptions & trigger instant payouts</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Loss of Income Only</h4>
                <p className="text-xs text-slate-400 mt-0.5">Strictly focused on wage stability during working disruptions</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scope Disclaimer Box */}
      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-200">Strict Product Scope:</strong> Gig Insured exclusively covers wage loss caused by external parametric triggers. This policy does not include health, life, vehicle repair, or medical accident insurance.
          </span>
        </div>
      </div>

      {/* Login Modal */}
      <OtpLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={() => setShowOnboarding(true)}
      />
    </div>
  );
}
