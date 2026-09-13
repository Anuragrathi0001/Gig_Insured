import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, User, MapPin, Building2, CreditCard,
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Activity,
  Sparkles, ChevronDown, Check, IdCard, Lock, Info, Wallet, IndianRupee
} from 'lucide-react';
import axios from 'axios';

const CITY_ZONES = {
  Bengaluru:   ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout'],
  Mumbai:      ['Andheri', 'Bandra', 'Powai', 'Dadar'],
  'Delhi NCR': ['Connaught Place', 'Gurgaon', 'Noida'],
  Hyderabad:   ['Banjara Hills', 'Gachibowli', 'Hitech City'],
  Chennai:     ['T Nagar', 'Velachery', 'Anna Nagar'],
};

const UPI_SUFFIXES = ['@paytm', '@okaxis', '@okhdfcbank', '@ybl', '@upi'];

/* ── Custom Dropdown ──────────────────────────────────────────────────── */
function CustomSelect({ label, icon: Icon, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`
          w-full flex items-center gap-2.5 px-4 py-3
          bg-[var(--input)] border rounded-[calc(var(--radius)*0.5)]
          text-sm font-semibold text-[var(--foreground)]
          transition-all duration-200 select-none cursor-pointer
          focus:outline-none
          ${open
            ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-sm'
            : 'border-[var(--border)] hover:border-[var(--ring)]/60'}
        `}
      >
        {Icon && <Icon className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />}
        <span className="flex-1 text-left truncate">{value}</span>
        <ChevronDown
          className={`w-4 h-4 text-[var(--muted-foreground)] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-[calc(var(--radius)*0.65)]
            border border-[var(--border)] bg-[var(--card)]
            shadow-[0_8px_32px_rgba(0,0,0,0.18)] overflow-hidden"
          style={{ animation: 'dropdownIn 0.15s cubic-bezier(.4,0,.2,1)' }}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--muted)]/60">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
              {label}
            </span>
          </div>

          {/* Options */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt === value;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium
                      transition-colors duration-100 text-left cursor-pointer
                      ${isSelected
                        ? 'bg-[var(--primary)]/15 text-[var(--primary)] font-bold'
                        : 'text-[var(--foreground)] hover:bg-[var(--muted)]'}
                    `}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black
                        ${isSelected
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : 'bg-[var(--secondary)] text-[var(--secondary-foreground)]'}`}
                    >
                      {opt.charAt(0)}
                    </span>
                    <span className="flex-1 truncate">{opt}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[var(--primary)] stroke-[3]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

// Helper to filter out auto-generated dummy system IDs so they are not prefilled
const isAutoGeneratedWorkerId = (id) => {
  if (!id) return true;
  const clean = String(id).trim();
  return clean.startsWith('GIG-G-') || clean.startsWith('PENDING-') || clean.startsWith('WRK-');
};

const isAutoGeneratedUpi = (upi, email) => {
  if (!upi) return true;
  const clean = String(upi).trim();
  if (clean === 'worker@paytm') return true;
  if (email && clean === `${email.split('@')[0]}@okaxis`) return true;
  return false;
};

/* ── OnboardingForm ───────────────────────────────────────────────────── */
export default function OnboardingForm({ onComplete, initialStep = 1, onStepChange, onCancel }) {
  const { worker, setWorker } = useAuth();

  const [formData, setFormData] = useState({
    name:            worker?.name || '',
    city:            worker?.city || 'Bengaluru',
    zone:            worker?.zone || 'Indiranagar',
    platform:        worker?.platform || 'Zomato',
    workerId:        isAutoGeneratedWorkerId(worker?.workerId || worker?.worker_id) ? '' : (worker?.workerId || worker?.worker_id),
    avgWeeklyIncome: worker?.avgWeeklyIncome || worker?.avg_weekly_income || 5000,
    upiId:           isAutoGeneratedUpi(worker?.upiId || worker?.upi_id, worker?.email) ? '' : (worker?.upiId || worker?.upi_id),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedRiskProfile, setSubmittedRiskProfile] = useState(() => {
    if (initialStep === 2 && (worker?.zoneRiskScore || worker?.zone_risk_score)) {
      return {
        zoneRiskScore: worker.zoneRiskScore || worker.zone_risk_score,
        weatherExposureScore: worker.weatherExposureScore || worker.weather_exposure_score || 50
      };
    }
    return null;
  });

  // Sync if initialStep prop explicitly requested back to Step 1
  useEffect(() => {
    if (initialStep === 1 && !submittedRiskProfile) {
      setSubmittedRiskProfile(null);
    } else if (initialStep === 2 && !submittedRiskProfile && (worker?.zoneRiskScore || worker?.zone_risk_score)) {
      setSubmittedRiskProfile({
        zoneRiskScore: worker.zoneRiskScore || worker.zone_risk_score,
        weatherExposureScore: worker.weatherExposureScore || worker.weather_exposure_score || 50
      });
    }
  }, [initialStep]);

  // Sync worker data if loaded asynchronously without overwriting with auto-generated values
  useEffect(() => {
    if (worker) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || worker.name || '',
        workerId: prev.workerId || (isAutoGeneratedWorkerId(worker.workerId || worker.worker_id) ? '' : (worker.workerId || worker.worker_id)),
        upiId: prev.upiId || (isAutoGeneratedUpi(worker.upiId || worker.upi_id, worker.email) ? '' : (worker.upiId || worker.upi_id)),
      }));
    }
  }, [worker]);

  // Auto-update zone when city changes
  useEffect(() => {
    if (CITY_ZONES[formData.city] && !CITY_ZONES[formData.city].includes(formData.zone)) {
      setFormData(prev => ({ ...prev, zone: CITY_ZONES[formData.city][0] }));
    }
  }, [formData.city]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuickUpiSuffix = (suffix) => {
    setFormData(prev => {
      const current = prev.upiId.trim();
      const prefix = current.includes('@') ? current.split('@')[0] : current;
      return { ...prev, upiId: prefix ? `${prefix}${suffix}` : `${suffix}` };
    });
  };

  const isUpiValid = formData.upiId.trim().includes('@') && formData.upiId.trim().length >= 4;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) { setError('Please enter your full name as on your Govt ID'); return; }
    if (!formData.workerId.trim()) { setError('Please enter your Delivery Partner Worker ID'); return; }
    if (!formData.upiId.trim() || !formData.upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g. 9876543210@paytm or name@okaxis)'); return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/workers/onboard', formData);
      const { worker: updatedWorker, riskProfile } = res.data;
      setWorker(updatedWorker);
      setSubmittedRiskProfile(riskProfile);
      onStepChange?.(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Estimated daily protection coverage calculation (approx 70% daily lost income compensation)
  const estimatedDailyCoverage = Math.round((formData.avgWeeklyIncome * 0.7) / 6);

  return (
    <div className="w-full max-w-2xl mx-auto bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-4 sm:p-8 shadow-xl relative overflow-hidden text-[var(--card-foreground)]">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Onboarding Journey Step Indicator */}
      <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
            submittedRiskProfile
              ? 'bg-emerald-500 text-white'
              : 'bg-[var(--primary)] text-[var(--primary-foreground)]'
          }`}>
            {submittedRiskProfile ? '✓' : '1'}
          </div>
          <span className={`text-xs font-bold ${
            submittedRiskProfile ? 'text-emerald-500' : 'text-[var(--foreground)]'
          }`}>
            Partner Profile
          </span>
        </div>

        <div className="flex-1 h-[2px] bg-[var(--border)] mx-2 rounded-full overflow-hidden">
          <div className={`h-full bg-[var(--primary)] transition-all duration-500 ${
            submittedRiskProfile ? 'w-full' : 'w-1/2'
          }`} />
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
            submittedRiskProfile
              ? 'bg-[var(--primary)] text-[var(--primary-foreground)] ring-2 ring-[var(--primary)]/30'
              : 'bg-[var(--input)] text-[var(--muted-foreground)]'
          }`}>
            2
          </div>
          <span className={`text-xs font-bold ${
            submittedRiskProfile ? 'text-[var(--primary)] font-extrabold' : 'text-[var(--muted-foreground)]'
          }`}>
            AI Risk Engine
          </span>
        </div>

        <div className="flex-1 h-[2px] bg-[var(--border)] mx-2 rounded-full" />

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[var(--input)] text-[var(--muted-foreground)] flex items-center justify-center text-xs font-black">
            3
          </div>
          <span className="text-xs font-semibold text-[var(--muted-foreground)] hidden sm:inline">
            Plan Selection
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-md shrink-0">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] tracking-tight font-sans">
              {submittedRiskProfile ? 'AI Risk Engine Assessment' : (worker ? 'Edit Partner Profile' : 'Delivery Partner Registration')}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              {submittedRiskProfile
                ? 'Step 2 of 3: Review your AI-calculated disruption risk scores before choosing a plan'
                : 'Step 1 of 3: Enter your details to calculate your personalized AI Risk Profile'}
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] transition-colors cursor-pointer shrink-0"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Risk Profile Output Card */}
      {submittedRiskProfile ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-[calc(var(--radius)*0.75)] bg-[var(--background)] border border-[var(--border)] shadow-md">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-base font-bold text-[var(--foreground)]">AI Risk Profile Generated</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Risk Score Ready (Step 2 of 3)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Zone Disruption Risk */}
              <div className="p-4 rounded-[calc(var(--radius)*0.6)] bg-[var(--card)] border border-[var(--border)] shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--muted-foreground)] font-medium">Zone Disruption Risk</span>
                  <Activity className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[var(--foreground)]">{submittedRiskProfile.zoneRiskScore}</span>
                  <span className="text-xs font-semibold text-[var(--muted-foreground)]">/ 100</span>
                </div>
                <div className="w-full bg-[var(--muted)] h-2.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[var(--primary)] h-full rounded-full transition-all duration-500" style={{ width: `${submittedRiskProfile.zoneRiskScore}%` }} />
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-2">
                  Based on historical weather &amp; disruption frequency in <strong className="text-[var(--foreground)]">{formData.zone}</strong>
                </p>
              </div>

              {/* Weather Exposure Index (Fixed Contrast & Color) */}
              <div className="p-4 rounded-[calc(var(--radius)*0.6)] bg-[var(--card)] border border-[var(--border)] shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--muted-foreground)] font-medium">Weather Exposure Index</span>
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[var(--foreground)]">{submittedRiskProfile.weatherExposureScore}</span>
                  <span className="text-xs font-semibold text-[var(--muted-foreground)]">/ 100</span>
                </div>
                <div className="w-full bg-[var(--muted)] h-2.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${submittedRiskProfile.weatherExposureScore}%` }} />
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-2">
                  Based on weekly delivery hours &amp; <strong className="text-[var(--foreground)]">{formData.platform}</strong> exposure
                </p>
              </div>
            </div>

            {/* Coverage Summary Box */}
            <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span className="text-xs text-[var(--foreground)]">Estimated Disruption Income Protection:</span>
              </div>
              <span className="text-xs font-black text-[var(--primary)]">
                Up to ₹{estimatedDailyCoverage}/day
              </span>
            </div>

            {/* Step 2 Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
              <button
                type="button"
                onClick={() => {
                  setSubmittedRiskProfile(null);
                  onStepChange?.(1);
                }}
                className="py-2.5 px-4 rounded-[calc(var(--radius)*0.5)] sm:rounded-[calc(var(--radius)*0.6)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Profile Details</span>
              </button>
              <button
                type="button"
                onClick={onComplete}
                className="flex-1 py-2.5 px-4 sm:py-3.5 sm:px-6 rounded-[calc(var(--radius)*0.5)] sm:rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold sm:font-extrabold text-xs sm:text-sm shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Proceed to Step 3: Choose Insurance Plan</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] sm:stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Onboarding Form ── */
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 text-[var(--destructive)] text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
              Full Name (As on Govt ID)
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Kumar"
                className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.5)] text-[var(--foreground)] text-sm font-medium focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-all placeholder:text-[var(--muted-foreground)]"
              />
            </div>
          </div>

          {/* Platform Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[var(--foreground)]">
                Gig Delivery Platform
              </label>
              <span className="text-[10px] text-[var(--muted-foreground)] font-medium">
                Verified delivery partner network
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { name: 'Zomato', badgeColor: 'bg-red-500', subtitle: 'Food & Quick' },
                { name: 'Swiggy', badgeColor: 'bg-orange-500', subtitle: 'Food & Instamart' },
                { name: 'Other', badgeColor: 'bg-violet-500', subtitle: 'Blinkit, Zepto, etc.' },
              ].map((plat) => {
                const isSelected = formData.platform === plat.name;
                return (
                  <button
                    type="button"
                    key={plat.name}
                    onClick={() => setFormData(prev => ({ ...prev, platform: plat.name }))}
                    className={`p-2.5 sm:p-3 rounded-[calc(var(--radius)*0.5)] border text-left flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--primary)]/15 border-[var(--primary)] ring-1 ring-[var(--primary)] text-[var(--foreground)] shadow-sm'
                        : 'bg-[var(--input)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--ring)]/50 hover:text-[var(--foreground)]'
                    }`}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${plat.badgeColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold truncate text-[var(--foreground)] flex items-center justify-between">
                        <span>{plat.name}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--primary)] shrink-0 ml-1" />
                        )}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-[var(--muted-foreground)] truncate">
                        {plat.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Worker ID & Operating City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[var(--foreground)]">
                  Platform Worker Partner ID
                </label>
              </div>
              <div className="relative">
                <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  name="workerId"
                  autoComplete="off"
                  value={formData.workerId}
                  onChange={handleChange}
                  placeholder={
                    formData.platform === 'Zomato'
                      ? 'e.g. ZOM-88234'
                      : formData.platform === 'Swiggy'
                      ? 'e.g. SWG-1102'
                      : 'e.g. BLK-9921 or ZEP-4412'
                  }
                  className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.5)] text-[var(--foreground)] text-sm font-medium focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-all placeholder:text-[var(--muted-foreground)]"
                />
              </div>
              <p className="text-[10px] text-[var(--muted-foreground)] mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                <span>
                  {formData.platform === 'Other'
                    ? 'Find in your partner or courier app profile > Partner ID'
                    : `Find in ${formData.platform} Partner App > Profile > Partner ID`}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                Operating City
              </label>
              <CustomSelect
                label="Select City"
                icon={MapPin}
                value={formData.city}
                options={Object.keys(CITY_ZONES)}
                onChange={(val) => setFormData(prev => ({ ...prev, city: val }))}
              />
              <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                Polygon risk zone monitoring coverage
              </p>
            </div>
          </div>

          {/* Delivery Zone & Avg Income */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                Primary Delivery Zone
              </label>
              <CustomSelect
                label="Select Zone"
                icon={MapPin}
                value={formData.zone}
                options={CITY_ZONES[formData.city] || []}
                onChange={(val) => setFormData(prev => ({ ...prev, zone: val }))}
              />
              <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                Assigned polygon zone for trigger telemetry
              </p>
            </div>

            {/* Avg Weekly Income (Sleek, compact, matching height of delivery zone dropdown) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[var(--foreground)]">
                  Avg Weekly Income
                </label>
                <span className="text-xs font-extrabold text-[var(--primary)] font-mono">
                  ₹{Number(formData.avgWeeklyIncome).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="h-[46px] px-3.5 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.5)] flex items-center gap-2.5">
                <IndianRupee className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                <input
                  type="range"
                  name="avgWeeklyIncome"
                  min="2000"
                  max="12000"
                  step="500"
                  value={formData.avgWeeklyIncome}
                  onChange={handleChange}
                  className="w-full accent-[var(--primary)] cursor-pointer h-1.5"
                />
              </div>

              <p className="text-[10px] text-[var(--muted-foreground)] mt-1 flex items-center justify-between">
                <span>Income cover: <strong className="text-[var(--primary)] font-bold">~₹{estimatedDailyCoverage}/day</strong></span>
                <span>₹2k – ₹12k</span>
              </p>
            </div>
          </div>

          {/* UPI ID */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[var(--foreground)]">
                UPI ID for Automated Instant Payouts
              </label>
              {isUpiValid && (
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Valid UPI Format</span>
                </span>
              )}
            </div>

            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                name="upiId"
                autoComplete="off"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="e.g. 9876543210@paytm or name@okaxis"
                className={`w-full pl-10 pr-4 py-3 bg-[var(--input)] border rounded-[calc(var(--radius)*0.5)] text-[var(--foreground)] text-sm font-medium focus:outline-none transition-all placeholder:text-[var(--muted-foreground)] ${
                  isUpiValid
                    ? 'border-emerald-500/60 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    : 'border-[var(--border)] focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)]'
                }`}
              />
            </div>

            {/* Quick UPI Handle Suffix Pills */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[10px] font-semibold text-[var(--muted-foreground)] mr-1">Quick Add:</span>
              {UPI_SUFFIXES.map((suffix) => (
                <button
                  type="button"
                  key={suffix}
                  onClick={() => handleQuickUpiSuffix(suffix)}
                  className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-[var(--input)] hover:bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] transition-colors cursor-pointer"
                >
                  {suffix}
                </button>
              ))}
            </div>

            {/* Trust & Security Badge */}
            <div className="flex items-center gap-2 text-[11px] text-[var(--muted-foreground)] bg-[var(--background)] px-3 py-2 rounded-[calc(var(--radius)*0.4)] border border-[var(--border)] mt-2.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>
                <strong className="text-[var(--foreground)] font-semibold">Bank-grade 256-bit encryption:</strong> Parametric payouts disburse directly via NPCI instant UPI settlement with zero deductions.
              </span>
            </div>
          </div>

          {/* Submit & Cancel Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 mt-3 sm:mt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="py-2.5 px-4 sm:py-3.5 sm:px-5 rounded-[calc(var(--radius)*0.5)] sm:rounded-[calc(var(--radius)*0.6)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 sm:py-3.5 sm:px-6 rounded-[calc(var(--radius)*0.5)] sm:rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold sm:font-extrabold text-xs sm:text-sm shadow-md hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 sm:gap-2 active:scale-[0.99] cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-[var(--primary-foreground)]" />
                  <span>Calculating AI Risk Profile &amp; Telemetry...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Step 2: AI Risk Engine</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] sm:stroke-[3] shrink-0" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
