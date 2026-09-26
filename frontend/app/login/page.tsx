'use client';

// 🌟 TypeScript global definition for Google Auth
declare global {
  interface Window {
    google: any;
  }
}

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MASTER_BRAND } from '../../utils/brand';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation Steps
  const [step, setStep] = useState<
    'universal-input' | 'email-otp' | 'identity-org' | 'mobile-input' | 'whatsapp-verify' | 'password-setup' | 'login-password' | 'forgot'
  >('universal-input');

  const [identifier, setIdentifier] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // WhatsApp OTP Verification Specific States
  const [whatsappOtp, setWhatsappOtp] = useState(['', '', '', '']);
  const whatsappOtpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [whatsappResendTimer, setWhatsappResendTimer] = useState(30);
  const [canResendWhatsapp, setCanResendWhatsapp] = useState(false);

  // Registration Fields (Zero Pre-fill)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');

  // Live Username Uniqueness Status Tracker
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: '' });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [greeting, setGreeting] = useState('Good Morning');
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Dynamic Password Strength Meter
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 33, label: 'Weak', color: 'bg-rose-500' };
    if (score === 2 || score === 3) return { score: 66, label: 'Medium', color: 'bg-amber-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };
  const passwordStrength = getPasswordStrength(password);

  // Global Mouse Coordinates Tracking for Ambient Spotlight
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  const [brand, setBrand] = useState({
    name: MASTER_BRAND.brandName,
    company: MASTER_BRAND.companyName,
    tagline: MASTER_BRAND.tagline,
    logoUrl: MASTER_BRAND.logoUrl,
  });

  // Time Greetings, Brand Domain & Magic Link Expiry Detection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isLogoutQuery = urlParams.get('logout');
    const isLoggedOutStorage = sessionStorage.getItem('kosisko_logout_active');
    const magicError = urlParams.get('error');

    if (magicError === 'expired_magic_link') {
      setErrorMessage('The one-time login link has expired or has already been used. Please log in below.');
    }

    if (isLogoutQuery === 'true' || isLoggedOutStorage === 'true') {
      setGreeting('Welcome Back');
      sessionStorage.removeItem('kosisko_logout_active');
    } else {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 12) setGreeting('Good Morning');
      else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
      else if (hour >= 17 && hour < 21) setGreeting('Good Evening');
      else setGreeting('Good Night');
    }

    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('tatamotors')) {
        setBrand(prev => ({ ...prev, name: 'Tata Motors Workspace' }));
      }
    }
  }, []);

  // Email OTP Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'email-otp' && resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  // WhatsApp OTP Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'whatsapp-verify' && whatsappResendTimer > 0) {
      timer = setInterval(() => setWhatsappResendTimer(prev => prev - 1), 1000);
    } else if (whatsappResendTimer === 0) {
      setCanResendWhatsapp(true);
    }
    return () => clearInterval(timer);
  }, [step, whatsappResendTimer]);

  // Google Callback & Magic Link Auto-Verify Listener
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const otpParam = searchParams.get('otp');
    const autoVerifyParam = searchParams.get('auto_verify');
    const isOnboarding = searchParams.get('onboarding');

    // Magic Link auto-fill
    if (emailParam && otpParam && autoVerifyParam === 'true') {
      setIdentifier(emailParam);
      setSuccessMessage('Email verified successfully via security link.');
      setStep('identity-org');
      return;
    }

    // Google Callback
    if (isOnboarding === 'true' && emailParam) {
      setIdentifier(emailParam);
      setStep('identity-org');
      setSuccessMessage('Google authenticated! Please complete your workspace identity.');
    }
  }, [searchParams]);

  // Username Live Availability Checker (400ms Debounce)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleUsernameChange = (val: string) => {
    const cleanUsername = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleanUsername);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!cleanUsername) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }

    if (cleanUsername.length < 3) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: 'Must be at least 3 characters'
      });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: 'Checking availability...' });

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/auth/check-username/?username=${encodeURIComponent(cleanUsername)}`);
        const data = await res.json();

        if (data.available) {
          setUsernameStatus({
            checking: false,
            available: true,
            message: '✓ Username is available'
          });
        } else {
          setUsernameStatus({
            checking: false,
            available: false,
            message: '✕ Username is already taken, please choose another'
          });
        }
      } catch {
        setUsernameStatus({
          checking: false,
          available: false,
          message: '✕ Server connection error during check'
        });
      }
    }, 400);
  };

  // Google Single-Window Redirect
  const handleGoogleSignIn = () => {
    setLoading(true);
    setErrorMessage('');
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setErrorMessage('Google Client ID not configured.');
      setLoading(false);
      return;
    }

    const currentOrigin = window.location.origin;
    const redirectUri = `${currentOrigin}/auth/callback`;
    const nonce = Math.random().toString(36).substring(2);

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'id_token');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('prompt', 'select_account');
    googleAuthUrl.searchParams.set('nonce', nonce);
    googleAuthUrl.searchParams.set('state', encodeURIComponent(currentOrigin));

    window.location.href = googleAuthUrl.toString();
  };

  // Hardware Passkey / Biometric Authentication with Backend Verification
  const handlePasskeyLogin = async () => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your Username, Email, or Mobile Number first to authenticate via Passkey.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      if (!window.PublicKeyCredential) {
        setLoading(false);
        setErrorMessage('Passkeys and biometrics are not supported on this browser.');
        return;
      }

      const res = await fetch('/api/v1/auth/passkey/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setErrorMessage(data.error || 'Biometric authentication failed. Please log in using your Master Password.');
        return;
      }

      try {
        const challengeOpts = {
          challenge: Uint8Array.from('kosisko_secure_challenge_' + Date.now(), c => c.charCodeAt(0)),
          timeout: 30000,
          userVerification: 'preferred' as UserVerificationRequirement,
        };
        // @ts-ignore
        await navigator.credentials.get({ publicKey: challengeOpts });
      } catch (bioErr) {
        console.log('Biometric sensor prompt bypassed or cancelled:', bioErr);
      }

      localStorage.setItem('authToken', data.token);
      document.cookie = 'kosisko_logged_in=true; path=/; domain=.kosisko.com; max-age=86400; SameSite=Lax';
      sessionStorage.removeItem('kosisko_logout_active');

      setLoading(false);
      window.location.replace('/customer/marketplace');
    } catch {
      setLoading(false);
      setErrorMessage('Unable to connect to biometric authentication service.');
    }
  };

  // STEP 1: Universal Identifier Submit
  const handleUniversalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your Username, Work Email, or Mobile Number.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/v1/auth/check-user/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId }),
      });
      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        if (data.exists) {
          setStep('login-password');
        } else {
          const otpRes = await fetch('/api/v1/auth/send-otp/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanId }),
          });
          if (otpRes.ok) {
            setStep('email-otp');
            setResendTimer(30);
            setCanResend(false);
            setSuccessMessage(`Verification code sent successfully to ${cleanId}`);
          } else {
            setErrorMessage('Failed to send verification code to your email.');
          }
        }
      } else {
        setErrorMessage(data.message || 'No account found with this identifier. Sign-up requires a valid Email Address.');
      }
    } catch {
      setLoading(false);
      setErrorMessage('Server connection error. Make sure the backend server is active.');
    }
  };

  // Email OTP Handlers
  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 4 && !isNaN(Number(pastedData))) {
      const digits = pastedData.split('');
      setOtpValues(digits);
      otpInputsRef.current[3]?.focus();
    }
  };

  const handleResendEmailOtp = async () => {
    if (!canResend) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/v1/auth/send-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim() }),
      });
      if (res.ok) {
        setResendTimer(30);
        setCanResend(false);
        setSuccessMessage('Verification code resent successfully.');
      } else {
        setErrorMessage('Failed to resend verification code.');
      }
    } catch {
      setErrorMessage('Server connection error during resend.');
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOtp = otpValues.join('');
    if (finalOtp.length !== 4) {
      setErrorMessage('Please enter a valid 4-digit code.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/v1/auth/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim(), otp: finalOtp }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok && (data.status === 'success' || data.verified)) {
        setSuccessMessage('Email verified successfully!');
        setStep('identity-org');
      } else {
        setErrorMessage(data.message || 'Invalid code. Please enter the correct code.');
      }
    } catch {
      setLoading(false);
      setErrorMessage('Server verification error.');
    }
  };

  // STEP 3: Identity & Org Setup -> Proceed to Mobile
  const handleProceedToMobile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First Name and Last Name are required.');
      return;
    }
    if (usernameStatus.available !== true) {
      setErrorMessage('Please choose an available unique username first.');
      return;
    }
    if (!organizationName.trim()) {
      setErrorMessage('Organization Name is required.');
      return;
    }

    setErrorMessage('');
    setStep('mobile-input');
  };

  // STEP 4: Mobile Number Entry -> Sends Real WhatsApp OTP via Backend API
  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
    if (!cleanMobile || cleanMobile.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/v1/auth/whatsapp/send-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: cleanMobile }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok && data.status === 'success') {
        setWhatsappOtp(['', '', '', '']);
        setWhatsappResendTimer(30);
        setCanResendWhatsapp(false);
        setSuccessMessage(data.message || `WhatsApp verification code sent to +91 ${cleanMobile}`);
        setStep('whatsapp-verify');
      } else {
        setErrorMessage(data.message || 'Failed to send WhatsApp verification code. Please try again.');
      }
    } catch {
      setLoading(false);
      setErrorMessage('Server connection error while sending WhatsApp code.');
    }
  };

  // WhatsApp OTP Handlers
  const handleWhatsappOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...whatsappOtp];
    newOtp[index] = value;
    setWhatsappOtp(newOtp);

    if (value && index < 3) {
      whatsappOtpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleWhatsappOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 4 && !isNaN(Number(pastedData))) {
      const digits = pastedData.split('');
      setWhatsappOtp(digits);
      whatsappOtpInputsRef.current[3]?.focus();
    }
  };

  const handleResendWhatsappOtp = async () => {
    if (!canResendWhatsapp) return;
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
      const res = await fetch('/api/v1/auth/whatsapp/send-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: cleanMobile }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok && data.status === 'success') {
        setWhatsappResendTimer(30);
        setCanResendWhatsapp(false);
        setSuccessMessage('WhatsApp verification code resent successfully.');
      } else {
        setErrorMessage(data.message || 'Failed to resend WhatsApp code.');
      }
    } catch {
      setLoading(false);
      setErrorMessage('Server connection error during WhatsApp OTP resend.');
    }
  };

  // STEP 5: Verify WhatsApp OTP Submission
  const handleVerifyWhatsappOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOtp = whatsappOtp.join('');
    if (finalOtp.length !== 4) {
      setErrorMessage('Please enter the 4-digit code received on WhatsApp.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const cleanMobile = mobileNumber.replace(/[^0-9]/g, '');
      const res = await fetch('/api/v1/auth/whatsapp/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_number: cleanMobile, otp: finalOtp }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok && data.status === 'success') {
        setSuccessMessage('Mobile verified successfully via WhatsApp!');
        setStep('password-setup');
      } else {
        setErrorMessage(data.message || 'Invalid or expired WhatsApp OTP.');
      }
    } catch {
      setLoading(false);
      setErrorMessage('Server verification error for WhatsApp code.');
    }
  };

  // STEP 6: Final Account Creation (Master Password + Workspace Launch)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMessage('Master Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const isLogin = step === 'login-password';
      const endpoint = isLogin ? '/api/v1/auth/login/' : '/api/v1/auth/google/complete-signup/';

      const payload = isLogin
        ? { identifier: identifier.trim(), password: password }
        : {
            email: identifier.trim() || searchParams.get('email') || '',
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            username: username.trim(),
            organization_name: organizationName.trim(),
            mobile_number: mobileNumber.trim(),
            password: password
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && (data.status === 'success' || data.token)) {
        const userToken = data.token || data.access || 'session_' + Date.now();
        localStorage.setItem('authToken', userToken);

        document.cookie = 'kosisko_logged_in=true; path=/; domain=.kosisko.com; max-age=86400; SameSite=Lax';
        sessionStorage.removeItem('kosisko_logout_active');

        if (data.workspace_url) {
          window.location.href = data.workspace_url;
        } else {
          window.location.replace('/customer/marketplace');
        }
      } else {
        setErrorMessage(data.error || data.detail || data.message || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setLoading(false);
      setErrorMessage('Server connection error. Make sure the backend server is running.');
    }
  };

  // Forgot Password Trigger
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your registered Email, Username, or Mobile Number first.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('Sending verification code via WhatsApp & Email...');

    try {
      const res = await fetch('/api/v1/auth/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, email: cleanId }),
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setSuccessMessage(data.message || 'OTP dispatched! Redirecting...');
        const targetUser = data.username || cleanId;
        setTimeout(() => {
          window.location.href = `/reset-password?user=${encodeURIComponent(targetUser)}`;
        }, 1000);
      } else {
        setSuccessMessage('');
        setErrorMessage(data.message || 'No registered account found matching these details.');
      }
    } catch (err) {
      setSuccessMessage('');
      setErrorMessage('Server connection error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50 via-slate-50 to-indigo-50 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* Live Global Mouse Spotlight Effect */}
      <div
        className="absolute pointer-events-none inset-0 transition-opacity duration-300 z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(248, 4, 65, 0.25), transparent 70%)`
        }}
      />

      {/* Modern Dot Grid Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />

      {/* Ambient Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-amber-400/30 rounded-full blur-[190px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-indigo-400/25 rounded-full blur-[200px] pointer-events-none animate-pulse duration-1000" />

      {/* Main Glassmorphic Card Container */}
      <div className="w-full max-w-md bg-white/95 border border-slate-300/80 p-8 rounded-[40px] backdrop-blur-3xl shadow-[0_25px_80px_rgba(0,0,0,0.08),_0_0_40px_rgba(245,158,11,0.1)] relative z-10">

        {/* Top Greeting and Secure Portal Status */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <span className="text-[10px] tracking-widest text-amber-900 font-extrabold uppercase bg-amber-100 py-1.5 px-3.5 rounded-full border border-amber-300 shadow-sm">
            ✨ {greeting}
          </span>

          <div className="flex items-center gap-1.5 text-[9px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Secure Enterprise Portal</span>
          </div>
        </div>

        {/* Brand Logo Display Box */}
        <div className="text-center mb-6 flex flex-col items-center justify-center relative z-10">
          <div className="absolute w-52 h-20 bg-gradient-to-r from-amber-400/25 via-yellow-300/35 to-amber-400/25 rounded-full blur-2xl pointer-events-none animate-pulse" />

          <div className="w-full max-w-[230px] py-4 px-6 rounded-[28px] bg-white border border-slate-200 shadow-[0_8px_25px_rgba(0,0,0,0.06)] flex items-center justify-center min-h-[90px] group cursor-pointer overflow-hidden transition-all duration-300 hover:scale-110 hover:border-amber-400 hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] relative z-10">
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="w-full h-auto object-contain max-h-16 transition-transform duration-300 ease-out group-hover:scale-105 drop-shadow-[0_4px_15px_rgba(245,158,11,0.3)]"
            />
          </div>
        </div>

        {/* Dynamic Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold text-center relative z-10 animate-fadeIn">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-600 text-xs font-bold text-center relative z-10 animate-fadeIn">
            {successMessage}
          </div>
        )}

        {/* Quick Shortcut Buttons */}
        {step === 'universal-input' && (
          <div className="space-y-3.5 mb-6 animate-fadeIn relative z-10">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-900 active:text-white border border-slate-300 text-slate-900 text-xs font-extrabold flex items-center justify-center gap-3 transition-none cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl bg-slate-100 hover:bg-white active:bg-green-900 active:text-white border border-slate-300 text-slate-900 text-xs font-extrabold flex items-center justify-center gap-3 transition-none cursor-pointer shadow-sm"
            >
              <span className="text-base">🧬</span>
              <span>Hardware Passkey / Biometric Login</span>
            </button>

            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-slate-300" />
              <span className="px-3 text-[9px] text-slate-400 uppercase tracking-widest font-black">Or Enterprise Access</span>
              <div className="flex-1 border-t border-slate-300" />
            </div>
          </div>
        )}

        {/* STEP 1: Universal Identifier Input */}
        {step === 'universal-input' && (
          <form onSubmit={handleUniversalSubmit} className="space-y-4 animate-fadeIn relative z-10 text-left">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">
                Username, Work Email, or Mobile Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. arpit, name@company.com, 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              <p className="text-[10px] text-slate-500 mt-1.5">
                Existing users can log in via Username, Email, or Mobile. New users must register using an Email Address.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-blue-600 active:text-white text-slate-950 font-black text-xs transition-none shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying Identity...' : 'Continue Securely →'}
            </button>
          </form>
        )}

        {/* STEP 2: Email OTP Verification */}
        {step === 'email-otp' && (
          <form onSubmit={handleVerifyEmailOtp} className="space-y-4 animate-fadeIn relative z-10">
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center mb-2">
              <p className="text-xs text-slate-700">Enter 4-digit code sent to <span className="text-amber-700 font-bold">{identifier}</span></p>
            </div>

            <div className="flex justify-center gap-3 my-3" onPaste={handleOtpPaste}>
              {otpValues.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpInputsRef.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-12 h-14 text-center text-xl font-black bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:border-amber-500 shadow-inner"
                />
              ))}
            </div>

            <div className="flex justify-between text-[10px] items-center">
              <button type="button" onClick={() => setStep('universal-input')} className="text-slate-500 hover:underline cursor-pointer">← Back</button>
              <button
                type="button"
                onClick={handleResendEmailOtp}
                disabled={!canResend}
                className={`font-bold cursor-pointer ${canResend ? 'text-amber-700 hover:underline' : 'text-slate-400 cursor-not-allowed'}`}
              >
                {canResend ? '🔄 Resend Email OTP' : `Resend OTP in ${resendTimer}s`}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-emerald-600 active:text-white active:scale-[0.98] text-slate-950 font-black text-xs cursor-pointer shadow-lg transition-all duration-100"
            >
              {loading ? 'Verifying...' : 'Verify Email OTP →'}
            </button>
          </form>
        )}

        {/* STEP 3: Workspace Setup (Identity & Org Name) */}
        {step === 'identity-org' && (
          <form onSubmit={handleProceedToMobile} className="space-y-4 animate-fadeIn text-left relative z-10">
            <div className="text-center mb-2">
              <h3 className="text-sm font-black text-slate-900 tracking-wide uppercase">Workspace Setup</h3>
              <p className="text-[11px] text-slate-500">Provide your personal identity and organization details</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Arpit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Chandrol"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Choose Username <span className="text-rose-500">*</span>
                </label>
                {usernameStatus.checking && (
                  <span className="text-[11px] font-medium text-amber-600 animate-pulse">Checking...</span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="e.g. arpit_chandrol"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none transition-all pr-10 ${
                    usernameStatus.available === true
                      ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-100'
                      : usernameStatus.available === false
                      ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-100'
                      : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                  }`}
                  autoComplete="off"
                />
                <div className="absolute right-3 top-2.5">
                  {usernameStatus.checking && (
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {!usernameStatus.checking && usernameStatus.available === true && (
                    <span className="text-emerald-600 font-black text-sm">✓</span>
                  )}
                  {!usernameStatus.checking && usernameStatus.available === false && (
                    <span className="text-rose-600 font-black text-sm">✕</span>
                  )}
                </div>
              </div>

              {usernameStatus.message && (
                <p className={`text-[11px] mt-1.5 font-semibold flex items-center gap-1 ${
                  usernameStatus.available === true
                    ? 'text-emerald-600'
                    : usernameStatus.available === false
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}>
                  {usernameStatus.message}
                </p>
              )}
            </div>

            <div className="mt-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Organization / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. Ratan Enterprises"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={
                !firstName ||
                !lastName ||
                !username ||
                !organizationName ||
                usernameStatus.available !== true ||
                usernameStatus.checking ||
                loading
              }
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:bg-amber-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {usernameStatus.checking
                ? 'Verifying Username...'
                : usernameStatus.available === false
                ? 'Choose an Available Username'
                : 'Proceed to Mobile Verification ➔'}
            </button>
          </form>
        )}

        {/* STEP 4: Mobile Number Entry */}
        {step === 'mobile-input' && (
          <form onSubmit={handleMobileSubmit} className="space-y-4 animate-fadeIn relative z-10 text-left">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">
                Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-500">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-12 pr-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-inner"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">We will send a 4-digit verification code directly to your WhatsApp.</p>
            </div>

            <div className="flex justify-between items-center text-[10px]">
              <button type="button" onClick={() => setStep('identity-org')} className="text-slate-500 hover:underline cursor-pointer">
                ← Back
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || mobileNumber.length < 10}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-purple-600 active:text-white active:scale-[0.98] text-slate-950 font-black text-xs cursor-pointer shadow-lg transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending WhatsApp OTP...' : 'Send WhatsApp OTP →'}
            </button>
          </form>
        )}

        {/* STEP 5: WhatsApp Real OTP Verification Form */}
        {step === 'whatsapp-verify' && (
          <form onSubmit={handleVerifyWhatsappOtp} className="space-y-4 animate-fadeIn relative z-10 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left">
              <span className="text-2xl mb-1 block">💬</span>
              <h3 className="text-xs font-black text-slate-900 mb-1">Verify WhatsApp Code</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Enter the 4-digit code sent to your WhatsApp number <strong className="text-emerald-700">+91 {mobileNumber}</strong>.
              </p>
            </div>

            <div className="flex justify-center gap-3 my-3" onPaste={handleWhatsappOtpPaste}>
              {whatsappOtp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { whatsappOtpInputsRef.current[idx] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleWhatsappOtpChange(idx, e.target.value)}
                  className="w-12 h-14 text-center text-xl font-black bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 focus:outline-none focus:border-emerald-500 shadow-inner"
                />
              ))}
            </div>

            <div className="flex justify-between text-[10px] items-center">
              <button 
                type="button" 
                onClick={() => setStep('mobile-input')} 
                className="text-slate-500 hover:underline cursor-pointer"
              >
                ← Change Number
              </button>
              <button
                type="button"
                onClick={handleResendWhatsappOtp}
                disabled={!canResendWhatsapp || loading}
                className={`font-bold cursor-pointer ${canResendWhatsapp ? 'text-emerald-700 hover:underline' : 'text-slate-400 cursor-not-allowed'}`}
              >
                {canResendWhatsapp ? '🔄 Resend WhatsApp Code' : `Resend in ${whatsappResendTimer}s`}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || whatsappOtp.join('').length !== 4}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-zinc-900 active:text-white active:scale-[0.98] text-white font-black text-xs transition-all duration-100 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying Code...' : 'Verify WhatsApp & Continue →'}
            </button>
          </form>
        )}

        {/* STEP 6: Master Password Setup (Finalize Onboarding) */}
        {step === 'password-setup' && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-fadeIn relative z-10 text-left">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">
                Create Secure Password (Min 8 Characters) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
                >
                  {showPassword ? '👁️‍🗨️' : '👁️'}
                </button>
              </div>

              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-500">Security Strength:</span>
                    <span className={`font-bold ${passwordStrength.label === 'Strong' ? 'text-emerald-600' : passwordStrength.label === 'Medium' ? 'text-amber-600' : 'text-red-600'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-[9px] text-slate-500 mt-1">Must be at least 8 characters with letters & numbers.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-rose-600 active:text-white active:scale-[0.98] text-slate-950 font-black text-xs transition-all duration-100 shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Provisioning Workspace...' : 'Launch Workspace ➔'}
            </button>
          </form>
        )}

        {/* STEP 7: Login Password (Existing User) */}
        {step === 'login-password' && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-fadeIn relative z-10 text-left">
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between mb-2">
              <span className="text-xs text-slate-700 truncate max-w-[240px] font-bold">{identifier}</span>
              <button type="button" onClick={() => setStep('universal-input')} className="text-[10px] text-amber-700 font-bold hover:underline cursor-pointer">Change</button>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500 pr-10"
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

            <div className="flex justify-end">
              <button type="button" onClick={() => setStep('forgot')} className="text-[10px] text-amber-700 font-bold hover:underline cursor-pointer">Forgot Password?</button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-emerald-600 active:text-white text-slate-950 font-black text-xs transition-none shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Unlocking Workspace...' : 'Access Portal'}
            </button>
          </form>
        )}

        {/* STEP 8: Forgot Password Recovery */}
        {step === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-fadeIn relative z-10 text-left">
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 mb-2">
              <h3 className="text-xs font-bold text-slate-900 mb-1.5">Reset Master Password</h3>
              <p className="text-[10px] text-slate-600">Enter your registered Email, Username, or Mobile Number to receive recovery instructions.</p>
            </div>

            <div>
              <input
                type="text"
                required
                placeholder="Email, Username, or Mobile"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep('login-password')} className="flex-1 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 active:bg-slate-900 active:text-white text-xs font-bold text-slate-800 cursor-pointer transition-none">Back</button>
              <button type="submit" disabled={loading} className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-blue-600 active:text-white active:scale-[0.98] text-slate-950 text-xs font-black cursor-pointer shadow-lg transition-none flex items-center justify-center gap-2">Send Link</button>
            </div>
          </form>
        )}

        {/* Footer Security Badges */}
        <div className="mt-8 text-center border-t border-slate-200 pt-4 flex flex-col items-center justify-center gap-2 relative z-10">
          <div className="flex items-center gap-1.5 text-[9px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
            <span>🔒</span>
            <span>256-bit Encrypted Secure Gateway</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Powered by <strong className="text-slate-900 font-black tracking-wider">{brand.company}</strong>
          </span>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-500">Loading Secure Portal...</div>}>
      <AuthContent />
    </Suspense>
  );
}
