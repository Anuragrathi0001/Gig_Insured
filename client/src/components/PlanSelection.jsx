import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Zap, CheckCircle2, IndianRupee, ArrowRight, RefreshCw, AlertCircle, CreditCard, Sparkles, X, Lock, Check } from 'lucide-react';
import axios from 'axios';

export default function PlanSelection({ onPolicyActivated }) {
  const { worker } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active highlighted card state (defaults to 'Standard' once loaded)
  const [activeTierKey, setActiveTierKey] = useState('Standard');

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
      const loadedQuotes = res.data.quotes || [];
      setQuotes(loadedQuotes);
      if (loadedQuotes.length > 0) {
        // default select Standard if available, else first
        const std = loadedQuotes.find(q => q.tier === 'Standard');
        setActiveTierKey(std ? std.tier : loadedQuotes[0].tier);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch risk-adjusted quotes');
      setLoading(false);
    }
  };

  const handleCardClick = (quote) => {
    setActiveTierKey(quote.tier);
  };

  const handleOpenPayment = (quote, e) => {
    if (e) e.stopPropagation();
    setActiveTierKey(quote.tier);
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
        upiId: worker?.upiId || worker?.upi_id
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
      <div className="p-12 text-center glass-panel rounded-[var(--radius)]">
        <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-[var(--foreground)]">Calculating Risk-Adjusted Weekly Tiers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="text-center max-w-xl mx-auto mb-5 sm:mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 text-xs font-semibold mb-2 sm:mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Personalized Weekly Premium Rates
        </span>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight font-sans leading-tight">
          Select Your Weekly Income Protection Plan
        </h2>
        <p className="text-[var(--muted-foreground)] text-xs sm:text-sm mt-1.5">
          Tailored to your zone <strong className="text-[var(--primary)]">{worker?.zone || 'Indiranagar'}</strong> risk score. Tap a plan to select.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--destructive)]/10 border border-[var(--destructive)]/30 text-[var(--destructive)] text-xs flex items-center gap-2 max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Tier Cards Grid - 1 col mobile, 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
        {quotes.map((q) => {
          const isSelected = activeTierKey === q.tier;
          const isStandard = q.tier === 'Standard';

          return (
            <div
              key={q.tier}
              onClick={() => handleCardClick(q)}
              className={`relative rounded-[var(--radius)] p-4 sm:p-6 transition-all duration-300 flex flex-col justify-between cursor-pointer select-none text-[var(--card-foreground)] ${
                isSelected
                  ? 'bg-[var(--card)] border-2 border-[var(--primary)] ring-4 ring-[var(--primary)]/20 shadow-2xl scale-[1.01] sm:scale-[1.03] sm:-translate-y-1 z-20'
                  : 'bg-[var(--card)] border border-[var(--border)] hover:border-[var(--ring)] hover:shadow-md opacity-90 hover:opacity-100'
              }`}
            >
              {/* Most Popular badge */}
              {isStandard && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-[10px] font-extrabold uppercase tracking-wider shadow-md whitespace-nowrap">
                  Most Popular for Partners
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)]">{q.name}</h3>
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-[calc(var(--radius)*0.3)] bg-[var(--secondary)]/60 text-[var(--secondary-foreground)] border border-[var(--border)]">
                    {q.tier}
                  </span>
                </div>

                <p className="text-xs text-[var(--muted-foreground)] mb-3 sm:mb-4 line-clamp-2">{q.description}</p>

                {/* Price Display */}
                <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-[calc(var(--radius)*0.75)] border transition-colors ${
                  isSelected
                    ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30'
                    : 'bg-[var(--background)]/60 border-[var(--border)]'
                }`}>
                  <span className="text-[10px] sm:text-xs text-[var(--muted-foreground)] font-medium">Weekly Premium</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)]">₹{q.weeklyPremium}</span>
                    <span className="text-xs font-medium text-[var(--muted-foreground)]">/ week</span>
                  </div>
                  <span className="inline-block mt-1.5 text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/15 px-2 py-0.5 rounded-full border border-[var(--primary)]/30">
                    Risk Multiplier: {q.riskMultiplier}x
                  </span>
                </div>

                {/* Coverage Highlights */}
                <ul className="space-y-2 sm:space-y-3 text-xs text-[var(--foreground)]/90 mb-4 sm:mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
                    <span>Max Benefit Cap: <strong className="text-[var(--foreground)]">₹{q.weeklyBenefitCap.toLocaleString('en-IN')}</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
                    <span>Disruption Payout: <strong className="text-[var(--foreground)]">₹{q.hourlyDisruptionRate}/hr</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
                    <span>Weather &amp; Civic Disruption Covered</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
                    <span>Zero Manual Claims (Instant UPI Payout)</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={(e) => handleOpenPayment(q, e)}
                className={`w-full py-3 sm:py-3.5 px-4 rounded-[calc(var(--radius)*0.6)] font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                  isSelected
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-110 shadow-lg shadow-[var(--primary)]/20'
                    : 'bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--secondary-foreground)] border border-[var(--border)]'
                }`}
              >
                <span>{isSelected ? `Proceed with ${q.tier} Plan` : `Choose ${q.tier} Plan`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Mock UPI Payment Modal — bottom-sheet on mobile, centered on desktop */}
      {isPayModalOpen && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-t-[var(--radius)] sm:rounded-[var(--radius)] p-5 sm:p-8 shadow-2xl overflow-hidden text-[var(--card-foreground)] max-h-[90dvh] overflow-y-auto">
            <button
              onClick={() => setIsPayModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-2 rounded-[calc(var(--radius)*0.4)] hover:bg-[var(--muted)] active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Drag handle on mobile */}
            <div className="w-10 h-1 bg-[var(--border)] rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-10 h-10 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/30">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)]">Mock UPI Payment</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Simulating Instant Razorpay / UPI Gateway</p>
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="p-4 rounded-[calc(var(--radius)*0.75)] bg-[var(--background)] border border-[var(--border)] space-y-2.5 mb-5 sm:mb-6 text-xs">
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Selected Plan:</span>
                <strong className="text-[var(--foreground)] font-bold">{selectedTier.name} ({selectedTier.tier})</strong>
              </div>
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Coverage Period:</span>
                <span className="text-[var(--foreground)]">Current Week (Mon - Sun)</span>
              </div>
              <div className="flex justify-between text-[var(--muted-foreground)]">
                <span>Payout UPI ID:</span>
                <code className="text-[var(--primary)] font-mono font-bold truncate max-w-[140px]">{worker?.upiId || worker?.upi_id || 'worker@okaxis'}</code>
              </div>
              <div className="pt-2 border-t border-[var(--border)] flex justify-between items-baseline">
                <span className="text-sm font-bold text-[var(--foreground)]">Total Amount Due:</span>
                <span className="text-2xl font-extrabold text-[var(--primary)]">₹{selectedTier.weeklyPremium}</span>
              </div>
            </div>

            {/* Auto-renew consent */}
            <label className="flex items-center gap-2.5 mb-5 sm:mb-6 text-xs text-[var(--muted-foreground)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="w-4 h-4 accent-[var(--primary)] rounded cursor-pointer"
              />
              <span>Enable automatic weekly renewal via UPI AutoPay</span>
            </label>

            <button
              onClick={handleConfirmPaymentAndActivate}
              disabled={paymentLoading}
              className="w-full py-3.5 px-4 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-sm shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {paymentLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-[var(--primary-foreground)]" />
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
