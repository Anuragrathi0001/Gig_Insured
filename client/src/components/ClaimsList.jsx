import React, { useState, useEffect } from 'react';
import { Zap, IndianRupee, Clock, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Bell, Lock, MessageSquare, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function ClaimsList() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Security confirmation state for high-value payout (>₹1k)
  const [selectedClaimForConfirm, setSelectedClaimForConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  const handleAuthorizePayout = async () => {
    if (!selectedClaimForConfirm) return;
    setConfirmLoading(true);
    try {
      await axios.post(`/api/claims/${selectedClaimForConfirm._id}/verify-payout-otp`, { otp: '123456' });
      setConfirmLoading(false);
      setSelectedClaimForConfirm(null);
      fetchMyClaims();
    } catch (err) {
      setConfirmLoading(false);
      alert(err.response?.data?.message || 'Payout authorization failed');
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
          return (
            <div
              key={c._id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">#{c.claimId || c._id.slice(-6)}</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {c.disruptionType} Disruption
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        c.claimState === 'Auto-Approved' || c.claimState === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : c.claimState === 'Blocked'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {c.claimState}
                    </span>
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

              {/* Action Triggers: High-Value Authorization or Appeal */}
              {c.otpVerificationRequired && c.claimState === 'Auto-Approved' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>High-value payout (&gt;₹1,000) authorization pending before UPI dispatch.</span>
                  </div>
                  <button
                    onClick={() => setSelectedClaimForConfirm(c)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
                  >
                    Authorize Payout
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

      {/* Payout Authorization Modal */}
      {selectedClaimForConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedClaimForConfirm(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-lg font-bold text-white">Authorize Payout Release</h3>
                <p className="text-xs text-slate-400">Confirming high-value payout of ₹{selectedClaimForConfirm.payoutAmount} to your registered UPI ID</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Click below to verify and instantly dispatch ₹{selectedClaimForConfirm.payoutAmount} straight to your bank account via UPI.
            </p>

            <button
              disabled={confirmLoading}
              onClick={handleAuthorizePayout}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm shadow-lg hover:from-emerald-400 hover:to-teal-400 transition-all flex items-center justify-center gap-2"
            >
              {confirmLoading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : 'Authorize & Dispatch UPI Payout'}
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
