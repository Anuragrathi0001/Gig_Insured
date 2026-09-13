import React, { useState, useEffect } from 'react';
import { Zap, IndianRupee, Clock, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Bell, Lock, MessageSquare, X, ShieldAlert, ChevronDown } from 'lucide-react';
import axios from 'axios';

export default function ClaimsList() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Security confirmation state for high-value payout (>₹1k)
  const [selectedClaimForConfirm, setSelectedClaimForConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Appeal Modal State
  const [selectedClaimForAppeal, setSelectedClaimForAppeal] = useState(null);
  const [appealStatement, setAppealStatement] = useState('');
  const [appealLoading, setAppealLoading] = useState(false);

  useEffect(() => {
    fetchMyClaims(1, false);
  }, []);

  const fetchMyClaims = async (pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await axios.get(`/api/claims/my-claims?page=${pageNum}&limit=5`);
      const newClaims = res.data.claims || [];
      const total = res.data.total ?? newClaims.length;
      const moreAvailable = res.data.hasMore ?? (newClaims.length === 5);

      if (isLoadMore) {
        setClaims(prev => [...prev, ...newClaims]);
      } else {
        setClaims(newClaims);
      }

      setPage(pageNum);
      setTotalCount(total);
      setHasMore(moreAvailable);
      setLoading(false);
      setLoadingMore(false);
    } catch (err) {
      setError('Failed to fetch claims');
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchMyClaims(page + 1, true);
    }
  };

  const handleAuthorizePayout = async () => {
    if (!selectedClaimForConfirm) return;
    const claimId = selectedClaimForConfirm.id || selectedClaimForConfirm._id || selectedClaimForConfirm.claimId;
    setConfirmLoading(true);
    try {
      await axios.post(`/api/claims/${claimId}/verify-payout-otp`, { otp: '123456' });
      setConfirmLoading(false);
      setSelectedClaimForConfirm(null);
      fetchMyClaims(1, false);
    } catch (err) {
      setConfirmLoading(false);
      alert(err.response?.data?.message || 'Payout authorization failed');
    }
  };

  const handleSubmitAppeal = async () => {
    if (!selectedClaimForAppeal) return;
    const claimId = selectedClaimForAppeal.id || selectedClaimForAppeal._id || selectedClaimForAppeal.claimId;
    setAppealLoading(true);
    try {
      await axios.post(`/api/claims/${claimId}/appeal`, { appealStatement });
      setAppealLoading(false);
      setSelectedClaimForAppeal(null);
      setAppealStatement('');
      fetchMyClaims(1, false);
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
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2 font-sans">
            <Zap className="w-5 h-5 text-[var(--primary)] fill-[var(--primary)]" />
            Automated Parametric Claims Feed
          </h3>
          {totalCount > 0 && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 tracking-tight">
              {claims.length} of {totalCount}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchMyClaims(1, false)}
          className="p-1.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--secondary-foreground)] transition-colors border border-[var(--border)] cursor-pointer"
          title="Refresh Claims"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {claims.map((c, index) => {
          const claimKey = c.id || c._id || c.claimId || `claim_${index}`;
          const displayId = String(c.claimId || c.id || c._id || '000000').slice(-6);
          const disruptionType = c.disruption_type || c.disruptionType || 'Parametric';
          const claimState = c.claim_state || c.claimState || 'Pending';
          const payoutAmount = c.payout_amount ?? c.payoutAmount ?? 0;
          const transactionRef = c.transaction_ref || c.transactionRef;
          const otpRequired = Boolean(c.otp_verification_required ?? c.otpVerificationRequired);
          const rawDate = c.created_at || c.createdAt || c.timestamp;
          const formattedDate = rawDate
            ? new Date(rawDate).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Just now';

          return (
            <div
              key={claimKey}
              className="p-3.5 sm:p-4.5 rounded-[calc(var(--radius)*0.75)] bg-[var(--card)] border border-[var(--border)] space-y-2 sm:space-y-2.5 relative overflow-hidden shadow-sm hover:border-[var(--primary)]/30 transition-all"
            >
              {/* Main Info & Payout Header Row (Single row on mobile & desktop) */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                    <span className="text-[11px] sm:text-xs font-mono font-bold text-[var(--primary)]">#{displayId}</span>
                    <span className="text-xs sm:text-sm font-bold text-[var(--foreground)] capitalize">
                      {disruptionType} Disruption
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wide ${
                        claimState === 'Auto-Approved' || claimState === 'Paid'
                          ? 'bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30'
                          : claimState === 'Blocked'
                          ? 'bg-[var(--destructive)]/15 text-[var(--destructive)] border border-[var(--destructive)]/30'
                          : 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30'
                      }`}
                    >
                      {claimState}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--muted-foreground)]/70 shrink-0" />
                    <span>Triggered: {formattedDate}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] sm:text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold block">
                    Payout
                  </span>
                  <p className="text-base sm:text-xl font-black text-[var(--primary)] font-mono leading-tight">
                    ₹{payoutAmount}
                  </p>
                </div>
              </div>

              {/* Instant UPI Payout Banner */}
              {transactionRef && (
                <div className="py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-[calc(var(--radius)*0.4)] bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[11px] sm:text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                    <span className="text-[var(--muted-foreground)] text-[10px] sm:text-xs truncate">
                      UPI Ref: <strong className="font-mono text-[var(--foreground)] font-semibold">{transactionRef}</strong>
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] bg-[var(--primary)] text-[var(--primary-foreground)] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 tracking-wider">
                    PROCESSED
                  </span>
                </div>
              )}

              {/* Action Triggers: High-Value Authorization or Appeal */}
              {otpRequired && (claimState === 'Auto-Approved' || claimState === 'Under-Review') && (
                <div className="p-2 sm:p-2.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[11px] sm:text-xs text-[var(--accent)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                    <span>High-value payout (&gt;₹1,000) authorization pending.</span>
                  </div>
                  <button
                    onClick={() => setSelectedClaimForConfirm(c)}
                    className="px-2.5 py-1 rounded-[calc(var(--radius)*0.4)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs shrink-0 transition-all hover:brightness-110 shadow-sm cursor-pointer self-end sm:self-auto"
                  >
                    Authorize Payout
                  </button>
                </div>
              )}

              {claimState === 'Blocked' && (
                <div className="p-2 sm:p-2.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--destructive)]/15 border border-[var(--destructive)]/30 text-[11px] sm:text-xs text-[var(--destructive)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[var(--destructive)] shrink-0" />
                    <span>Flagged by Multi-Signal Fraud Engine. 48h appeal active.</span>
                  </div>
                  <button
                    onClick={() => setSelectedClaimForAppeal(c)}
                    className="px-2.5 py-1 rounded-[calc(var(--radius)*0.4)] bg-[var(--destructive)]/20 hover:bg-[var(--destructive)]/30 text-[var(--destructive)] border border-[var(--destructive)]/30 font-bold text-xs shrink-0 transition-colors cursor-pointer self-end sm:self-auto"
                  >
                    Submit Appeal
                  </button>
                </div>
              )}

              {/* Push Notification Banner */}
              <div className="py-1 px-2.5 rounded-[calc(var(--radius)*0.4)] bg-[var(--background)] border border-[var(--border)] text-[10px] sm:text-[11px] text-[var(--muted-foreground)] flex items-center gap-1.5">
                <Bell className="w-3 h-3 text-[var(--primary)] shrink-0" />
                <span className="truncate">
                  <strong className="text-[var(--primary)] font-semibold">Push Alert:</strong> Disruption detected in your zone · Payout ₹{payoutAmount}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer: Load More Claims */}
      {hasMore && (
        <div className="text-center pt-1.5 pb-1">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[calc(var(--radius)*0.5)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/85 text-[var(--secondary-foreground)] border border-[var(--border)] hover:border-[var(--primary)]/40 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 group"
          >
            {loadingMore ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-[var(--secondary-foreground)] animate-spin" />
                <span>Loading next 5 claims...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--primary)] group-hover:translate-y-0.5 transition-transform" />
                <span>Load Older Claims (+5)</span>
                <span className="text-[10px] text-[var(--secondary-foreground)]/70 font-semibold ml-1">
                  ({Math.max(0, totalCount - claims.length)} remaining)
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {!hasMore && claims.length > 5 && (
        <div className="text-center py-2 text-[11px] font-medium text-[var(--muted-foreground)]">
          ✓ All {totalCount} claims loaded
        </div>
      )}

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
                <p className="text-xs text-[var(--muted-foreground)]">Confirming high-value payout of ₹{selectedClaimForConfirm.payout_amount ?? selectedClaimForConfirm.payoutAmount ?? 0} to your registered UPI ID</p>
              </div>
            </div>

            <p className="text-xs text-[var(--muted-foreground)] mb-5 leading-relaxed">
              Click below to verify and instantly dispatch ₹{selectedClaimForConfirm.payout_amount ?? selectedClaimForConfirm.payoutAmount ?? 0} straight to your bank account via UPI.
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
                <p className="text-xs text-[var(--muted-foreground)]">Request manual review for blocked claim ID: {selectedClaimForAppeal.claimId || selectedClaimForAppeal.id || selectedClaimForAppeal._id}</p>
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
