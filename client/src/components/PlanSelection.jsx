import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Zap, CheckCircle2, IndianRupee, ArrowRight, RefreshCw, AlertCircle, CreditCard, Sparkles, X, Lock } from 'lucide-react';
import axios from 'axios';

export default function PlanSelection({ onPolicyActivated }) {
  const { worker } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment Modal State
  const [selectedTier, setSelectedTier] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/premium/quote');
      setQuotes(res.data.quotes || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch risk-adjusted quotes');
      setLoading(false);
    }
  };

  const handleSelectTier = (quote) => {
    setSelectedTier(quote);
    setIsPayModalOpen(true);
  };

  const handleConfirmPaymentAndActivate = async () => {
    if (!selectedTier) return;

    setPaymentLoading(true);
    setError(null);

    try {
      // Step 1: Mock UPI Payment
      const payRes = await axios.post('/api/payments/mock-upi', {
        amount: selectedTier.weeklyPremium,
        tier: selectedTier.tier,
        upiId: worker?.upiId
      });

      const transactionId = payRes.data.transactionId;

      // Step 2: Activate Policy
      const actRes = await axios.post('/api/policy/activate', {
        tier: selectedTier.tier,
        autoRenew,
        transactionId
      });

      setPaymentLoading(false);
      setIsPayModalOpen(false);

      if (onPolicyActivated) {
        onPolicyActivated(actRes.data.policy);
      }
    } catch (err) {
      setPaymentLoading(false);
      setError(err.response?.data?.message || 'Policy activation failed');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center glass-panel rounded-3xl">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-300">Calculating Risk-Adjusted Weekly Tiers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Personalized Weekly Premium Rates
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Select Your Weekly Income Protection Plan
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Tailored to your zone <strong className="text-emerald-400">{worker?.zone}</strong> risk score. Micro-payments, zero claims paperwork.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quotes.map((q) => {
          const isStandard = q.tier === 'Standard';
          return (
            <div
              key={q.tier}
              className={`relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between ${
                isStandard
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/60 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 scale-105 z-10'
                  : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {isStandard && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                  Most Popular for Delivery Partners
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{q.name}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {q.tier}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4 h-8">{q.description}</p>

                {/* Price Display */}
                <div className="mb-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-xs text-slate-400 font-medium">Weekly Premium</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-extrabold text-white">₹{q.weeklyPremium}</span>
                    <span className="text-xs font-medium text-slate-400">/ week</span>
                  </div>
                  <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Risk Multiplier: {q.riskMultiplier}x
                  </span>
                </div>

                {/* Coverage Highlights */}
                <ul className="space-y-3 text-xs text-slate-300 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Max Weekly Benefit Cap: <strong className="text-white">₹{q.weeklyBenefitCap.toLocaleString('en-IN')}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Disruption Payout: <strong className="text-white">₹{q.hourlyDisruptionRate}/hour</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Weather & Civic Disruption Covered</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero Manual Claims (Instant UPI Payout)</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleSelectTier(q)}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isStandard
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                <span>Choose {q.tier} Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Mock UPI Payment Modal */}
      {isPayModalOpen && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            <button
              onClick={() => setIsPayModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Mock UPI Payment</h3>
                <p className="text-xs text-slate-400">Simulating Instant Razorpay / UPI Gateway</p>
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 mb-6 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Selected Plan:</span>
                <strong className="text-white font-bold">{selectedTier.name} ({selectedTier.tier})</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Coverage Period:</span>
                <span className="text-slate-200">Current Week (Mon - Sun)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payout UPI ID:</span>
                <code className="text-emerald-400 font-mono font-bold">{worker?.upiId || '9876543210@paytm'}</code>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white">Total Amount Due:</span>
                <span className="text-2xl font-extrabold text-emerald-400">₹{selectedTier.weeklyPremium}</span>
              </div>
            </div>

            {/* Auto-renew consent checkbox */}
            <label className="flex items-center gap-2.5 mb-6 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <span>Enable automatic weekly renewal via UPI AutoPay</span>
            </label>

            <button
              onClick={handleConfirmPaymentAndActivate}
              disabled={paymentLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {paymentLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Simulate UPI Payment (₹{selectedTier.weeklyPremium})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
