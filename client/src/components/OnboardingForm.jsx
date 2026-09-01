import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, User, MapPin, Building2, IndianRupee, CreditCard,
  ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Activity,
  Sparkles, ChevronDown, Check
} from 'lucide-react';
import axios from 'axios';

const CITY_ZONES = {
  Bengaluru:  ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout'],
  Mumbai:     ['Andheri', 'Bandra', 'Powai', 'Dadar'],
  'Delhi NCR':['Connaught Place', 'Gurgaon', 'Noida'],
  Hyderabad:  ['Banjara Hills', 'Gachibowli', 'Hitech City'],
  Chennai:    ['T Nagar', 'Velachery', 'Anna Nagar'],
};

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
          transition-all duration-200 select-none
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
            shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
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
                      transition-colors duration-100 text-left
                      ${isSelected
                        ? 'bg-[var(--primary)]/12 text-[var(--primary)]'
                        : 'text-[var(--foreground)] hover:bg-[var(--muted)]'}
                    `}
                  >
                    {/* City flag / marker icon */}
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black
                        ${isSelected
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                          : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'}`}
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

/* ── OnboardingForm ───────────────────────────────────────────────────── */
export default function OnboardingForm({ onComplete }) {
  const { worker, setWorker } = useAuth();

  const [formData, setFormData] = useState({
    name:            worker?.name || '',
    city:            worker?.city || 'Bengaluru',
    zone:            worker?.zone || 'Indiranagar',
    platform:        worker?.platform || 'Zomato',
    workerId:        worker?.workerId || worker?.worker_id || '',
    avgWeeklyIncome: worker?.avgWeeklyIncome || worker?.avg_weekly_income || 5000,
    upiId:           worker?.upiId || worker?.upi_id || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedRiskProfile, setSubmittedRiskProfile] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) { setError('Please enter your full name'); return; }
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 sm:p-8 shadow-xl relative overflow-hidden text-[var(--card-foreground)]">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-md">
          <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] tracking-tight font-sans">
            Delivery Partner Registration
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
            Quick 2-minute onboarding to calculate your AI Risk Profile
          </p>
        </div>
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
              <span className="px-2.5 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 text-xs font-semibold">
                Profile Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-[calc(var(--radius)*0.6)] bg-[var(--card)] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--muted-foreground)] font-medium">Zone Disruption Risk</span>
                  <Activity className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[var(--foreground)]">{submittedRiskProfile.zoneRiskScore}</span>
                  <span className="text-xs font-semibold text-[var(--muted-foreground)]">/ 100</span>
                </div>
                <div className="w-full bg-[var(--muted)] h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[var(--primary)] h-full rounded-full transition-all duration-500" style={{ width: `${submittedRiskProfile.zoneRiskScore}%` }} />
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-2">
                  Based on historical weather & disruption frequency in <strong className="text-[var(--foreground)]">{formData.zone}</strong>
                </p>
              </div>

              <div className="p-4 rounded-[calc(var(--radius)*0.6)] bg-[var(--card)] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--muted-foreground)] font-medium">Weather Exposure Index</span>
                  <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[var(--foreground)]">{submittedRiskProfile.weatherExposureScore}</span>
                  <span className="text-xs font-semibold text-[var(--muted-foreground)]">/ 100</span>
                </div>
                <div className="w-full bg-[var(--muted)] h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[var(--accent)] h-full rounded-full transition-all duration-500" style={{ width: `${submittedRiskProfile.weatherExposureScore}%` }} />
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-2">
                  Based on weekly delivery hours & platform exposure
                </p>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-3.5 px-6 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-sm shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Insurance Plans</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      ) : (
        /* ── Onboarding Form ── */
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 text-[var(--destructive)] text-xs flex items-center gap-2">
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
                placeholder="Ramesh Kumar"
                className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.5)] text-[var(--foreground)] text-sm font-medium focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-all placeholder:text-[var(--muted-foreground)]"
              />
            </div>
          </div>

          {/* Platform Toggle */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
              Gig Delivery Platform
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Zomato', 'Swiggy'].map((plat) => (
                <button
                  type="button"
                  key={plat}
                  onClick={() => setFormData(prev => ({ ...prev, platform: plat }))}
                  className={`py-3 px-4 rounded-[calc(var(--radius)*0.5)] border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    formData.platform === plat
                      ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)] shadow-sm'
                      : 'bg-[var(--input)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>{plat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Worker ID & Operating City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                Platform Worker Partner ID
              </label>
              <input
                type="text"
                name="workerId"
                value={formData.workerId}
                onChange={handleChange}
                placeholder="e.g. ZOM-88234 or SWG-1102"
                className="w-full px-4 py-3 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.5)] text-[var(--foreground)] text-sm font-medium focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-all placeholder:text-[var(--muted-foreground)]"
              />
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
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
                Avg Weekly Income:{' '}
                <span className="text-[var(--primary)] font-extrabold">
                  ₹{Number(formData.avgWeeklyIncome).toLocaleString('en-IN')}
                </span>
              </label>
              <input
                type="range"
                name="avgWeeklyIncome"
                min="2000"
                max="12000"
                step="500"
                value={formData.avgWeeklyIncome}
                onChange={handleChange}
                className="w-full accent-[var(--primary)] mt-2 cursor-pointer"
              />
            </div>
          </div>

          {/* UPI ID */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1.5">
              UPI ID for Automated Instant Payouts
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="9876543210@paytm or name@okaxis"
                className="w-full pl-10 pr-4 py-3 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.5)] text-[var(--foreground)] text-sm font-medium focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-all placeholder:text-[var(--muted-foreground)]"
              />
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
              Parametric payouts deposit directly into this UPI ID with zero manual claim forms.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-sm shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary-foreground)]" />
            ) : (
              <>
                <span>Complete Registration & Generate Risk Profile</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
