import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Phone, KeyRound, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function OtpLoginModal({ isOpen, onClose, onSuccess }) {
  const { sendOtp, verifyOtp, loading } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [timer, setTimer] = useState(0);

  if (!isOpen) return null;

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const cleanMobile = mobile.trim();

    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError('Please enter a valid 10-digit mobile number (starting with 6, 7, 8, or 9)');
      return;
    }

    try {
      const data = await sendOtp(cleanMobile);
      setStep(2);
      if (data.devOtpHint) {
        setDevOtpHint(data.devOtpHint);
      }
      // Start 30s countdown for resend
      setTimer(30);
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter the complete 6-digit OTP code');
      return;
    }

    try {
      const res = await verifyOtp(mobile.trim(), otp.trim());
      onClose();
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setStep(1);
    setOtp('');
    setError(null);
    setDevOtpHint(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Logo & Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Worker Authentication</h3>
            <p className="text-xs text-slate-400">Passwordless Mobile OTP Login</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Dev OTP Helper Banner */}
        {devOtpHint && step === 2 && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Dev OTP Code:
            </span>
            <code className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold text-sm tracking-wider border border-emerald-500/30">
              {devOtpHint}
            </code>
          </div>
        )}

        {/* Step 1: Mobile Input */}
        {step === 1 && (
          <form onSubmit={handleMobileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Registered Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm font-medium tracking-wide focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter your 10-digit mobile number linked with Zomato or Swiggy
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || mobile.length !== 10}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <span>Send OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Enter 6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-emerald-400 hover:underline font-medium"
                >
                  Change Mobile
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Sent to <span className="text-white font-medium">+91 {mobile}</span>
              </p>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full tracking-widest text-center py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xl font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-700"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Verify OTP & Login</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              {timer > 0 ? (
                <span className="text-xs text-slate-500">Resend OTP in {timer}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleMobileSubmit}
                  className="text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors"
                >
                  Didn't receive OTP? Resend
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
