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
      <div className="p-6 text-center glass-panel rounded-[var(--radius)]">
        <RefreshCw className="w-5 h-5 text-[var(--primary)] animate-spin mx-auto mb-2" />
        <span className="text-xs text-[var(--muted-foreground)]">Loading your parametric claims...</span>
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="p-6 text-center bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] shadow-sm">
        <ShieldCheck className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-2" />
        <h4 className="text-sm font-bold text-[var(--foreground)]">No Disruption Claims Detected Yet</h4>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          When weather or civic disruptions occur in your zone, zero-manual claims trigger automatically with direct UPI payouts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2 font-sans">
          <Zap className="w-5 h-5 text-[var(--primary)] fill-[var(--primary)]" />
          Automated Parametric Claims Feed
        </h3>
        <button
          onClick={fetchMyClaims}
          className="p-1.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--secondary-foreground)] transition-colors border border-[var(--border)]"
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
              className="p-5 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] space-y-3 relative overflow-hidden shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--primary)]">#{c.claimId || c._id.slice(-6)}</span>
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      {c.disruptionType} Disruption
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        c.claimState === 'Auto-Approved' || c.claimState === 'Paid'
                          ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30'
                          : c.claimState === 'Blocked'
                          ? 'bg-[var(--destructive)]/15 text-[var(--destructive)] border border-[var(--destructive)]/30'
                          : 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30'
                      }`}
                    >
                      {c.claimState}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Triggered at: {new Date(c.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="text-right sm:self-center">
                  <span className="text-[11px] text-[var(--muted-foreground)]">Calculated Payout</span>
                  <p className="text-xl font-extrabold text-[var(--primary)]">₹{c.payoutAmount}</p>
                </div>
              </div>

              {c.transactionRef && (
                <div className="p-2.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-xs text-[var(--primary)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    <span><strong>Razorpay X Instant UPI Payout Dispatched:</strong> Ref <strong className="font-mono text-[var(--foreground)]">{c.transactionRef}</strong></span>
                  </div>
                  <span className="text-[10px] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold px-2 py-0.5 rounded uppercase">
                    PROCESSED
                  </span>
                </div>
              )}

              {/* Action Triggers: High-Value Authorization or Appeal */}
              {c.otpVerificationRequired && c.claimState === 'Auto-Approved' && (
                <div className="p-3 rounded-[calc(var(--radius)*0.5)] bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-xs text-[var(--accent)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <span>High-value payout (&gt;₹1,000) authorization pending before UPI dispatch.</span>
                  </div>
                  <button
                    onClick={() => setSelectedClaimForConfirm(c)}
                    className="px-3 py-1.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shrink-0 transition-all hover:brightness-110 shadow-sm"
                  >
                    Authorize Payout
                  </button>
                </div>
              )}

              {c.claimState === 'Blocked' && (
                <div className="p-3 rounded-[calc(var(--radius)*0.5)] bg-[var(--destructive)]/15 border border-[var(--destructive)]/30 text-xs text-[var(--destructive)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[var(--destructive)] shrink-0" />
                    <span>Flagged by Multi-Signal Fraud Engine. 48-Hour Appeal Window Active.</span>
                  </div>
                  <button
                    onClick={() => setSelectedClaimForAppeal(c)}
                    className="px-3 py-1.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--destructive)]/20 hover:bg-[var(--destructive)]/30 text-[var(--destructive)] border border-[var(--destructive)]/30 font-bold text-xs shrink-0 transition-colors"
                  >
                    Submit Appeal
                  </button>
                </div>
              )}

              {/* Push Notification Banner */}
              <div className="p-2.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--background)] border border-[var(--border)] text-[11px] text-[var(--muted-foreground)] flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                <span>
                  <strong className="text-[var(--primary)]">Push Alert:</strong> Disruption detected in your zone. Your parametric income payout of ₹{c.payoutAmount} is being processed.
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payout Authorization Modal */}
      {selectedClaimForConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-2xl text-[var(--card-foreground)]">
            <button
              onClick={() => setSelectedClaimForConfirm(null)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1.5 rounded-[calc(var(--radius)*0.4)] hover:bg-[var(--muted)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-[var(--primary)]" />
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Authorize Payout Release</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Confirming high-value payout of ₹{selectedClaimForConfirm.payoutAmount} to your registered UPI ID</p>
              </div>
            </div>

            <p className="text-xs text-[var(--muted-foreground)] mb-5 leading-relaxed">
              Click below to verify and instantly dispatch ₹{selectedClaimForConfirm.payoutAmount} straight to your bank account via UPI.
            </p>

            <button
              disabled={confirmLoading}
              onClick={handleAuthorizePayout}
              className="w-full py-3 px-4 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-sm shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              {confirmLoading ? <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary-foreground)]" /> : 'Authorize & Dispatch UPI Payout'}
            </button>
          </div>
        </div>
      )}

      {/* Appeal Submission Modal */}
      {selectedClaimForAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-2xl text-[var(--card-foreground)]">
            <button
              onClick={() => setSelectedClaimForAppeal(null)}
              className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1.5 rounded-[calc(var(--radius)*0.4)] hover:bg-[var(--muted)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-6 h-6 text-[var(--primary)]" />
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">Submit Claim Appeal</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Request manual review for blocked claim ID: {selectedClaimForAppeal._id}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">Reason for Appeal</label>
              <textarea
                rows={3}
                value={appealStatement}
                onChange={(e) => setAppealStatement(e.target.value)}
                placeholder="I was logged into my delivery app during the disruption..."
                className="w-full p-3 bg-[var(--input)] border border-[var(--border)] rounded-[calc(var(--radius)*0.5)] text-[var(--foreground)] text-xs focus:outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] placeholder:text-[var(--muted-foreground)]"
              />
            </div>

            <button
              onClick={handleSubmitAppeal}
              disabled={appealLoading || !appealStatement.trim()}
              className="w-full py-3 px-4 rounded-[calc(var(--radius)*0.6)] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold text-sm disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {appealLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto text-[var(--primary-foreground)]" /> : 'Submit Appeal for Manual Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
