// src/pages/VerifyEmail.tsx - OTP verification after signup
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithToken } = useAuth();

  // email passed from signup page via router state
  const email: string = (location.state as any)?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email was passed
  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email, navigate]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-email', { email, otp: code });
      loginWithToken(res.data.token, res.data.user);
      toast.success('Email verified! Welcome 🎂');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResendLoading(true);
    try {
      await api.post('/auth/resend-otp', { email, purpose: 'verify_email' });
      toast.success('A new code has been sent!');
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-box-header">
          <div className="auth-logo">📬</div>
          <h1>Check your email</h1>
          <p>
            We sent a 6-digit code to <strong style={{ color: 'var(--text)' }}>{email}</strong>
          </p>
        </div>

        <form className="auth-form" onSubmit={handleVerify}>
          {error && <div className="error-msg">{error}</div>}

          {/* OTP input boxes */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              margin: '8px 0 4px',
            }}
            onPaste={handlePaste}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: 46,
                  height: 54,
                  textAlign: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  background: 'var(--surface-2)',
                  border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 10,
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  caretColor: 'var(--accent)',
                }}
              />
            ))}
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: '8px 0' }}>
            Code expires in 10 minutes
          </p>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="auth-link" style={{ marginTop: 16 }}>
          Didn't receive it?{' '}
          <button
            onClick={handleResend}
            disabled={resendLoading || cooldown > 0}
            style={{
              background: 'none',
              border: 'none',
              color: cooldown > 0 ? 'var(--text-muted)' : 'var(--accent)',
              cursor: cooldown > 0 ? 'default' : 'pointer',
              fontSize: 'inherit',
              padding: 0,
              fontFamily: 'inherit',
            }}
          >
            {resendLoading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
