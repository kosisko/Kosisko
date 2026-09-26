'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MASTER_BRAND } from '../../utils/brand';

function InnerResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlUser = searchParams.get('user') || '';
  const urlOtp = searchParams.get('otp') || '';

  const [username, setUsername] = useState(urlUser);
  const [otp, setOtp] = useState(urlOtp);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    if (urlUser) setUsername(urlUser);
    if (urlOtp) setOtp(urlOtp);
  }, [urlUser, urlOtp]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  const [brand] = useState({
    name: MASTER_BRAND.brandName,
    company: MASTER_BRAND.companyName,
    logoUrl: MASTER_BRAND.logoUrl,
  });

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!username.trim()) {
      setError('Please enter your registered Username, Email, or Mobile Number.');
      return;
    }

    if (!otp.trim()) {
      setError('Please enter the 4-digit verification code received on WhatsApp or Email.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          otp: otp.trim(),
          password: newPassword,
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.status !== 'error') {
        setMessage(data.message || 'Password successfully reset! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || data.error || 'Invalid verification code or expired link.');
      }
    } catch (err) {
      setLoading(false);
      setError('Server connection error. Please try again.');
    }
  };

  const spotlightStyle = {
    background: 'radial-gradient(600px circle at ' + mousePos.x + 'px ' + mousePos.y + 'px, rgba(12, 248, 4, 0.25), transparent 70%)'
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50 via-slate-50 to-indigo-50 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">

      <div
        className="absolute pointer-events-none inset-0 transition-opacity duration-300 z-0"
        style={spotlightStyle}
      ></div>

      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/95 border border-slate-300/80 p-8 rounded-[40px] backdrop-blur-3xl shadow-[0_25px_80px_rgba(0,0,0,0.08),_0_0_40px_rgba(245,158,11,0.1)] relative z-10">

        <div className="text-center mb-6 flex flex-col items-center justify-center relative z-10">
          <div className="absolute w-52 h-20 bg-gradient-to-r from-amber-400/25 via-yellow-300/35 to-amber-400/25 rounded-full blur-2xl pointer-events-none animate-pulse"></div>

          <div className="w-full max-w-[230px] py-4 px-6 rounded-[28px] bg-white border border-slate-200 shadow-[0_8px_25px_rgba(0,0,0,0.06)] flex items-center justify-center min-h-[90px] group cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:border-amber-400 hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] relative z-10">
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="w-full h-auto object-contain max-h-16 transition-transform duration-300 ease-out group-hover:scale-110 drop-shadow-[0_4px_15px_rgba(245,158,11,0.3)]"
            />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">Reset Master Password</h2>
          <p className="text-[11px] text-slate-600 mt-1">
            {username ? (
              <span>Setting new password for account: <strong className="text-amber-700">{username}</strong></span>
            ) : (
              <span>Enter your verification code and choose a new password.</span>
            )}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-600 text-xs font-bold text-center">
            {message}
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-4">
          {!urlUser && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">
                Username / Email / Mobile
              </label>
              <input
                type="text"
                required
                placeholder="Enter your registered identifier"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-inner"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700">
                4-Digit WhatsApp / Email OTP
              </label>
              {urlOtp && (
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Auto-filled from link ✓
                </span>
              )}
            </div>
            <input
              type="text"
              required
              maxLength={4}
              placeholder="• • • •"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-center tracking-[0.5em] text-lg font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            <p className="text-[10px] text-slate-500 mt-1 text-center">
              Enter the 4-digit code sent to your WhatsApp or Email
            </p>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500 pr-10 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">Confirm New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-blue-600 active:text-white active:scale-[0.98] text-slate-950 font-black text-xs transition-none shadow-lg shadow-amber-500/25 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? 'Updating Password...' : 'Save New Password →'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-200 pt-4 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 text-[9px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
            <span>🔒</span>
            <span>256-bit Encrypted Secure Gateway</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Powered by <strong className="text-slate-900 font-black tracking-wider">{brand.company}</strong></span>
        </div>

      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 text-sm font-semibold">Loading reset portal...</div>}>
      <InnerResetContent />
    </Suspense>
  );
}
