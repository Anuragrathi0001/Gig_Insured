import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, MapPin, Building2, IndianRupee, CreditCard, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Activity, Sparkles } from 'lucide-react';
import axios from 'axios';

const CITY_ZONES = {
  Bengaluru: ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout'],
  Mumbai: ['Andheri', 'Bandra', 'Powai', 'Dadar'],
  'Delhi NCR': ['Connaught Place', 'Gurgaon', 'Noida'],
  Hyderabad: ['Banjara Hills', 'Gachibowli', 'Hitech City'],
  Chennai: ['T Nagar', 'Velachery', 'Anna Nagar']
};

export default function OnboardingForm({ onComplete }) {
  const { worker, setWorker } = useAuth();

  const [formData, setFormData] = useState({
    name: worker?.name || '',
    city: worker?.city || 'Bengaluru',
    zone: worker?.zone || 'Indiranagar',
    platform: worker?.platform || 'Zomato',
    workerId: worker?.workerId || '',
    avgWeeklyIncome: worker?.avgWeeklyIncome || 5000,
    upiId: worker?.upiId || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedRiskProfile, setSubmittedRiskProfile] = useState(null);

  // Auto update zone options when city changes
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

    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!formData.workerId.trim()) {
      setError('Please enter your Delivery Partner Worker ID');
      return;
    }
    if (!formData.upiId.trim() || !formData.upiId.includes('@')) {
      setError('Please enter a valid UPI ID (e.g. 9876543210@paytm or name@okaxis)');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/workers/onboard', formData);
      const { worker: updatedWorker, riskProfile } = res.data;

      setWorker(updatedWorker);
      setSubmittedRiskProfile(riskProfile);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to complete onboarding. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
          <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Delivery Partner Registration
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Quick 2-minute onboarding to calculate your AI Risk Profile
          </p>
        </div>
      </div>

      {/* Risk Profile Output Card after Successful Submission */}
      {submittedRiskProfile ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">AI Risk Profile Generated</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                Profile Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-medium">Zone Disruption Risk</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{submittedRiskProfile.zoneRiskScore}</span>
                  <span className="text-xs font-semibold text-slate-400">/ 100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                    style={{ width: `${submittedRiskProfile.zoneRiskScore}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Based on historical weather & disruption frequency in <strong className="text-slate-200">{formData.zone}</strong>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 font-medium">Weather Exposure Index</span>
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{submittedRiskProfile.weatherExposureScore}</span>
                  <span className="text-xs font-semibold text-slate-400">/ 100</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full"
                    style={{ width: `${submittedRiskProfile.weatherExposureScore}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Based on weekly delivery hours & platform exposure
                </p>
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Insurance Plans</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      ) : (
        /* Onboarding Form */
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Full Name (As on Govt ID)
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ramesh Kumar"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Platform Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Gig Delivery Platform
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Zomato', 'Swiggy'].map((plat) => (
                <button
                  type="button"
                  key={plat}
                  onClick={() => setFormData(prev => ({ ...prev, platform: plat }))}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    formData.platform === plat
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>{plat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Worker ID & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Platform Worker Partner ID
              </label>
              <input
                type="text"
                name="workerId"
                value={formData.workerId}
                onChange={handleChange}
                placeholder="e.g. ZOM-88234 or SWG-1102"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Operating City
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              >
                {Object.keys(CITY_ZONES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Zone Dropdown & Average Weekly Income */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Primary Delivery Zone
              </label>
              <select
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              >
                {(CITY_ZONES[formData.city] || []).map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Avg Weekly Income: <span className="text-emerald-400 font-extrabold">₹{Number(formData.avgWeeklyIncome).toLocaleString('en-IN')}</span>
              </label>
              <input
                type="range"
                name="avgWeeklyIncome"
                min="2000"
                max="12000"
                step="500"
                value={formData.avgWeeklyIncome}
                onChange={handleChange}
                className="w-full accent-emerald-500 mt-2 cursor-pointer"
              />
            </div>
          </div>

          {/* UPI ID */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              UPI ID for Automated Instant Payouts
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="9876543210@paytm or name@upi"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Parametric payouts deposit directly into this UPI ID with zero manual claim forms.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
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
