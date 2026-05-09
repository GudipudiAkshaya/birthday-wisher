// src/pages/ForgotPassword.tsx - Multi-step forgot password: email → OTP → new password
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';

type Step = 'email' | 'otp' | 'reset';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // ── Step 1: send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Reset code sent to your email!');
      setCooldown(60);
      setStep('otp');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input helpers ─────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // ── Step 2: verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-reset-otp', { email, otp: code });
      toast.success('Code verified! Set your new password.');
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResendLoading(true);
    try {
      await api.post('/auth/resend-otp', { email, purpose: 'forgot_password' });
      toast.success('New code sent!');
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend.');
    } finally {
      setResendLoading(false);
    }
  };

  // ── Step 3: reset password ───────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp: otp.join(''), newPassword });
      toast.success('Password reset! Please log in.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = step === 'email' ? 'Forgot password' : step === 'otp' ? 'Enter OTP' : 'New password';
  const stepIcon = step === 'email' ? '🔑' : step === 'otp' ? '📬' : '🔒';
  const stepSub =
    step === 'email'
      ? "Enter your email and we'll send you a reset code"
      : step === 'otp'
      ? `We sent a 6-digit code to ${email}`
      : 'Choose a strong new password';

  return (
    <div className="auth-page">
      <div className="auth-box">
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
          {(['email', 'otp', 'reset'] as Step[]).map((s, i) => (
            <div
              key={s}
              style={{
                width: 28,
                height: 4,
                borderRadius: 4,
                background:
                  s === step
                    ? 'var(--accent)'
                    : ['email', 'otp', 'reset'].indexOf(step) > i
                    ? 'var(--success)'
                    : 'var(--border)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        <div className="auth-box-header">
          <div className="auth-logo">{stepIcon}</div>
          <h1>{stepLabel}</h1>
          <p>{stepSub}</p>
        </div>

        {/* ── Step 1: Email ── */}
        {step === 'email' && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="fp-email">Email</label>
              <input
                id="fp-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 'otp' && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            {error && <div className="error-msg">{error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '8px 0 4px' }} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  id={`fp-otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  style={{
                    width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 700,
                    background: 'var(--surface-2)',
                    border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 10, color: 'var(--text)', outline: 'none',
                    transition: 'border-color 0.2s', caretColor: 'var(--accent)',
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: '8px 0' }}>
              Code expires in 10 minutes
            </p>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <div className="auth-link" style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || cooldown > 0}
                style={{
                  background: 'none', border: 'none',
                  color: cooldown > 0 ? 'var(--text-muted)' : 'var(--accent)',
                  cursor: cooldown > 0 ? 'default' : 'pointer',
                  fontSize: 13, padding: 0, fontFamily: 'inherit',
                }}
              >
                {resendLoading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: New Password ── */}
        {step === 'reset' && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            {error && <div className="error-msg">{error}</div>}
            <div className="form-group">
              <label className="form-label" htmlFor="fp-new-pw">New Password</label>
              <input
                id="fp-new-pw"
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="fp-confirm-pw">Confirm Password</label>
              <input
                id="fp-confirm-pw"
                type="password"
                className="form-input"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-link" style={{ marginTop: 16 }}>
          <Link to="/login">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
