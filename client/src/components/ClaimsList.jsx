import React, { useState, useEffect } from 'react';
import { Zap, IndianRupee, Clock, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Bell, Lock, KeyRound, MessageSquare, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function ClaimsList() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // OTP Modal State for High-Value Payout (>₹1k)
  const [selectedClaimForOtp, setSelectedClaimForOtp] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Appeal Modal State
  const [selectedClaimForAppeal, setSelectedClaimForAppeal] = useState(null);
  const [appealStatement, setAppealStatement] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);

  useEffect(() => {
    fetchMyClaims();
  }, []);

  const fetchMyClaims = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/claims/my-claims');
      setClaims(res.data.claims || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch claims');
      setLoading(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!selectedClaimForOtp || !otpCode) return;
    setOtpLoading(true);
    try {
      await axios.post(`/api/claims/${selectedClaimForOtp._id}/verify-payout-otp`, { otp: otpCode });
      setOtpLoading(false);
      setSelectedClaimForOtp(null);
      setOtpCode('');
      fetchMyClaims();
    } catch (err) {
      setOtpLoading(false);
      alert(err.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleSubmitAppeal = async () => {
    if (!selectedClaimForAppeal) return;
    setAppealLoading(true);
    try {
      await axios.post(`/api/claims/${selectedClaimForAppeal._id}/appeal`, { appealStatement });
      setAppealLoading(false);
      setSelectedClaimForAppeal(null);
      setAppealStatement('');
      fetchMyClaims();
    } catch (err) {
      setAppealLoading(false);
      alert('Failed to submit appeal');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center glass-panel rounded-2xl">
        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mx-auto mb-2" />
        <span className="text-xs text-slate-400">Loading your parametric claims...</span>
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="p-6 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
        <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-white">No Disruption Claims Detected Yet</h4>
        <p className="text-xs text-slate-400 mt-1">
          When weather or civic disruptions occur in your zone, zero-manual claims trigger automatically with direct UPI payouts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
          Automated Parametric Claims Feed
        </h3>
        <button
          onClick={fetchMyClaims}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Refresh Claims"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {claims.map((c) => {
          const stateColors = {
            'Auto-Approved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            Paid: 'bg-emerald-500 text-slate-950 border-emerald-400',
            'Under-Review': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
            Blocked: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
            Appealed: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
          };

          return (
            <div
              key={c._id}
              className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-lg relative overflow-hidden space-y-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{c.reason || 'Automated Parametric Disruption Claim'}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${stateColors[c.claimState] || stateColors['Under-Review']}`}>
                      {c.claimState} {c.claimState === 'Auto-Approved' ? '⚡' : c.claimState === 'Blocked' ? '🛑' : c.claimState === 'Paid' ? '💸' : '⏳'}
                    </span>
                    {c.fraudRiskScore !== undefined && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        Fraud Score: {c.fraudRiskScore}/100
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Triggered at: {new Date(c.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="text-right sm:self-center">
                  <span className="text-[11px] text-slate-400">Calculated Payout</span>
                  <p className="text-xl font-extrabold text-emerald-400">₹{c.payoutAmount}</p>
                </div>
              </div>

              {c.transactionRef && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Razorpay X Instant UPI Payout Dispatched:</strong> Ref <strong className="font-mono text-white">{c.transactionRef}</strong></span>
                  </div>
                  <span className="text-[10px] bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded uppercase">
                    PROCESSED
                  </span>
                </div>
              )}

              {/* Action Triggers: High-Value OTP Verification or Appeal */}
              {c.otpVerificationRequired && c.claimState === 'Auto-Approved' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>High-value payout (&gt;₹1,000) requires OTP confirmation before UPI dispatch.</span>
                  </div>
                  <button
                    onClick={() => setSelectedClaimForOtp(c)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
                  >
                    Confirm OTP
                  </button>
                </div>
              )}

              {c.claimState === 'Blocked' && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Flagged by Multi-Signal Fraud Engine. 48-Hour Appeal Window Active.</span>
                  </div>
                  <button
                    onClick={() => setSelectedClaimForAppeal(c)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs shrink-0 transition-colors"
                  >
                    Submit Appeal
                  </button>
                </div>
              )}

              {/* Push Notification Banner */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong className="text-emerald-400">Push Alert:</strong> Disruption detected in your zone. Your parametric income payout of ₹{c.payoutAmount} is being processed.
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* High-Value Payout OTP Modal */}
      {selectedClaimForOtp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedClaimForOtp(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <KeyRound className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-white">High-Value Payout Security OTP</h3>
                <p className="text-xs text-slate-400">Confirming payout of ₹{selectedClaimForOtp.payoutAmount} to {selectedClaimForOtp.workerMobile || 'registered mobile'}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Enter 6-Digit OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full tracking-widest text-center py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xl font-bold focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">For hackathon demo, enter any 6-digit code (e.g. 123456)</p>
            </div>

            <button
              disabled={otpLoading || otpCode.length !== 6}
              onClick={handleConfirmOtp}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm disabled:opacity-50"
            >
              {otpLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm OTP & Dispatch Payout'}
            </button>
          </div>
        </div>
      )}

      {/* Appeal Submission Modal */}
      {selectedClaimForAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedClaimForAppeal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Submit Claim Appeal</h3>
                <p className="text-xs text-slate-400">Request manual review for blocked claim ID: {selectedClaimForAppeal._id}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Appeal</label>
              <textarea
                rows={3}
                value={appealStatement}
                onChange={(e) => setAppealStatement(e.target.value)}
                placeholder="I was logged into my Zomato app at Indiranagar delivery hub during the rain..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleSubmitAppeal}
              disabled={appealLoading || !appealStatement.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-extrabold text-sm disabled:opacity-50"
            >
              {appealLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Appeal for Manual Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
