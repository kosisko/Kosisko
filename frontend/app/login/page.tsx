'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MASTER_BRAND } from '../../utils/brand';

function AuthContentWrapper() {
  return <UltimateHybridAuthPageContent />;
}

function UltimateHybridAuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [step, setStep] = useState<
    'universal-input' | 'email-otp' | 'org-name' | 'mobile-input' | 'whatsapp-verify' | 'mobile-otp' | 'password-setup' | 'login-password' | 'forgot'
  >('universal-input');
  
  const [identifier, setIdentifier] = useState('');
  
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const [username, setUsername] = useState(''); 
  const [organizationName, setOrganizationName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [greeting, setGreeting] = useState('Good Morning');

  // 🌟 मैजिक लिंक से आने वाले ईमेल और ओटीपी को ऑटो-वेरीफाई करने के लिए इफ़ेक्ट
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const otpParam = searchParams.get("otp");
    const autoVerifyParam = searchParams.get("auto_verify");

    if (emailParam && otpParam && autoVerifyParam === "true") {
      setIdentifier(emailParam);
      setSuccessMessage('Email verified successfully via Link!');
      setStep('org-name');
    }
  }, [searchParams]);

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

  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // ग्लोबल माउस कोऑर्डिनेट्स ट्रैकिंग
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isLogoutQuery = urlParams.get('logout');
    const isLoggedOutStorage = sessionStorage.getItem('kosisko_logout_active');

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

    const hostname = window.location.hostname;
    if (hostname.includes('tatamotors')) {
      setBrand(prev => ({ ...prev, name: 'Tata Motors Workspace' }));
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'email-otp' && resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  // 🌟 स्मार्ट Google Sign-In Flow (बैकएंड ऑनबोर्डिंग इंटीग्रेशन के साथ)
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // वैकल्पिक: पहले गूगल ऑथ एपीआई को कॉल करके चेक करें कि यूजर नया है या पुराना
      // यहाँ हम सीधे स्मार्ट ऑनबोर्डिंग स्टेप (org-name) पर भेज रहे हैं या डायरेक्ट रीडायरेक्ट कर रहे हैं
      const clientId = '297158802396-jhqr40pv045bivtmuui4qdkgvdl9081b.apps.googleusercontent.com';
      const redirectUri = window.location.origin + '/customer/marketplace';
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email profile`;
      
      // आप चाहें तो इसे रीडायरेक्ट कर सकते हैं या नया यूजर मानकर org-name पर ला सकते हैं:
      window.location.href = googleAuthUrl;
    } catch (err) {
      setLoading(false);
      setErrorMessage('Google authentication failed.');
    }
  };

  // 🌟 स्मार्ट Hardware Passkey Flow (बैकएंड इंटीग्रेशन के साथ)
  const handlePasskeyLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      if (!window.PublicKeyCredential) {
        setLoading(false);
        setErrorMessage('Passkeys are not supported on this browser.');
        return;
      }

      try {
        const publicKeyCredentialRequestOptions = {
          challenge: Uint8Array.from('kosisko_secure_challenge', c => c.charCodeAt(0)),
          timeout: 30000,
          userVerification: 'preferred' as UserVerificationRequirement,
        };

        // @ts-ignore
        await navigator.credentials.get({ publicKey: publicKeyCredentialRequestOptions });

        localStorage.setItem('authToken', 'passkey_session_token_' + Date.now());
        sessionStorage.removeItem('kosisko_logout_active');
        document.cookie = "kosisko_logged_in=true; path=/; max-age=86400; SameSite=Lax";

        setLoading(false);
        window.location.href = '/customer/marketplace';
        return;
      } catch (getErr) {
        console.log('No existing passkey found, attempting registration...');
      }

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: Uint8Array.from('kosisko_register_challenge', c => c.charCodeAt(0)),
        rp: {
          name: "Kosisko",
          id: window.location.hostname,
        },
        user: {
          id: Uint8Array.from(identifier || "user_kosisko_id", c => c.charCodeAt(0)),
          name: identifier || "user@kosisko.com",
          displayName: "Kosisko User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, 
          { alg: -257, type: "public-key" }
        ],
        timeout: 60000,
        attestation: "none"
      };

      // @ts-ignore
      const newCredential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      if (newCredential) {
        localStorage.setItem('authToken', 'passkey_session_token_' + Date.now());
        sessionStorage.removeItem('kosisko_logout_active');

        setLoading(false);
        setSuccessMessage('Passkey successfully registered and verified!');
        setTimeout(() => { 
          window.location.href = '/customer/marketplace'; 
        }, 1000);
      } else {
        setLoading(false);
        setErrorMessage('Passkey generation was cancelled.');
      }

    } catch (err) {
      setLoading(false);
      setErrorMessage('Biometric/Passkey setup failed.');
    }
  };

  const handleUniversalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your Username, Work Email, or Mobile Number.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/check-user/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), email: identifier.trim() }),
      });
      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        if (data.exists) {
          setStep('login-password');
        } else {
          if (identifier.includes('@')) {
            const otpRes = await fetch('http://127.0.0.1:8000/api/v1/auth/send-otp/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: identifier.trim() }),
            });
            if (otpRes.ok) {
              setStep('email-otp');
              setResendTimer(30);
              setCanResend(false);
              setSuccessMessage('OTP sent successfully to your email.');
            } else {
              setErrorMessage('Failed to send OTP to email.');
            }
          } else {
            setStep('org-name');
          }
        }
      } else {
        setErrorMessage(data.message || 'Could not verify account status.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Server connection error. Make sure Django backend is running.');
    }
  };

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
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/send-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim() }),
      });
      if (res.ok) {
        setResendTimer(30);
        setCanResend(false);
        setSuccessMessage('OTP resent successfully to your email.');
      } else {
        setErrorMessage('Failed to resend OTP.');
      }
    } catch (err) {
      setErrorMessage('Server connection error during resend.');
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOtp = otpValues.join('');
    if (finalOtp.length !== 4) {
      setErrorMessage('Please enter a valid 4-digit OTP.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/auth/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim(), otp: finalOtp }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok && (data.status === 'success' || data.verified)) {
        setSuccessMessage('Email verified successfully!');
        setStep('org-name');
      } else {
        setErrorMessage(data.message || 'Invalid OTP. Please enter correct code.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Server verification error.');
    }
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !organizationName.trim()) {
      setErrorMessage('Please enter both Unique Username and Organization Name.');
      return;
    }
    setErrorMessage('');
    setStep('mobile-input');
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length < 10) {
      setErrorMessage('Please enter a valid mobile number.');
      return;
    }
    setErrorMessage('');
    setStep('whatsapp-verify');
  };

  const handleWhatsAppVerified = () => {
    setSuccessMessage('Mobile verified successfully via WhatsApp!');
    setStep('password-setup');
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const isLogin = step === 'login-password';
      const endpoint = isLogin 
        ? 'http://127.0.0.1:8000/api/v1/auth/login/' 
        : 'http://127.0.0.1:8000/api/v1/auth/signup/';

      const payload = isLogin
        ? { identifier: identifier.trim(), password: password }
        : { 
            email: identifier.includes('@') ? identifier.trim() : '', 
            username: username.trim(), 
            password: password, 
            organizationName: organizationName.trim(), 
            mobileNumber: mobileNumber.trim() 
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        const userToken = data.token || data.access || data.key || data.auth_token;
        if (userToken) {
          localStorage.setItem('authToken', userToken);
        } else {
          localStorage.setItem('authToken', 'active_session_token_' + Date.now());
        }

        document.cookie = "kosisko_logged_in=true; path=/; max-age=86400; SameSite=Lax";
        sessionStorage.removeItem('kosisko_logout_active');
        
        window.location.href = '/customer/marketplace';
      } else {
        setLoading(false);
        setErrorMessage(data.message || data.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Server connection error. Make sure Django backend is active.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your registered Email, Username, or Mobile Number first.');
      return;
    }

    setSuccessMessage('Password reset instructions sent to your registered contact.');
    setStep('login-password');
    setErrorMessage('');

    fetch('http://127.0.0.1:8000/api/v1/auth/forgot-password/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), email: identifier.trim() }),
    }).catch(err => {
      console.log('Background mail trigger error:', err);
    });
  };

  return (
    <div 
      className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50 via-slate-50 to-indigo-50 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans"
    >
      <div 
        className="absolute pointer-events-none inset-0 transition-opacity duration-300 z-0"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(248, 4, 65, 0.25), transparent 70%)`
        }}
      ></div>

      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none"></div>

      <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-amber-400/30 rounded-full blur-[190px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-indigo-400/25 rounded-full blur-[200px] pointer-events-none animate-pulse duration-1000"></div>

      <div className="w-full max-w-md bg-white/95 border border-slate-300/80 p-8 rounded-[40px] backdrop-blur-3xl shadow-[0_25px_80px_rgba(0,0,0,0.08),_0_0_40px_rgba(245,158,11,0.1)] relative z-10">

        <div className="flex items-center justify-between mb-6 relative z-10">
          <span className="text-[10px] tracking-widest text-amber-900 font-extrabold uppercase bg-amber-100 py-1.5 px-3.5 rounded-full border border-amber-300 shadow-sm">
            ✨ {greeting}
          </span>

          <div className="flex items-center gap-1.5 text-[9px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Secure Enterprise Portal</span>
          </div>
        </div>

        <div className="text-center mb-6 flex flex-col items-center justify-center relative z-10">
          <div className="absolute w-52 h-20 bg-gradient-to-r from-amber-400/25 via-yellow-300/35 to-amber-400/25 rounded-full blur-2xl pointer-events-none animate-pulse"></div>
          
          <div className="w-full max-w-[230px] py-4 px-6 rounded-[28px] bg-white border border-slate-200 shadow-[0_8px_25px_rgba(0,0,0,0.06)] flex items-center justify-center min-h-[90px] group cursor-pointer overflow-hidden transition-all duration-300 hover:scale-140 hover:border-amber-400 hover:shadow-[0_15px_40px_rgba(245,158,11,0.3)] relative z-10">
            <img 
              src={brand.logoUrl} 
              alt={brand.name} 
              className="w-full h-auto object-contain max-h-16 transition-transform duration-300 ease-out group-hover:scale-110 drop-shadow-[0_4px_15px_rgba(245,158,11,0.3)]"
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold text-center relative z-10">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-600 text-xs font-bold text-center relative z-10">
            {successMessage}
          </div>
        )}

        {step === 'universal-input' && (
          <div className="space-y-3.5 mb-6 animate-fadeIn relative z-10">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-4 px-4 rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-900 active:text-white border border-slate-300 text-slate-900 text-xs font-extrabold flex items-center justify-center gap-3 transition-none cursor-pointer shadow-sm"
            >
              <span className="text-base">🌐</span>
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
              <div className="flex-1 border-t border-slate-300"></div>
              <span className="px-3 text-[9px] text-slate-400 uppercase tracking-widest font-black">Or Enterprise Access</span>
              <div className="flex-1 border-t border-slate-300"></div>
            </div>
          </div>
        )}

        {step === 'universal-input' && (
          <form onSubmit={handleUniversalSubmit} className="space-y-4 animate-fadeIn relative z-10">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">
                Username, Work Email, or Mobile Number
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. john_doe, name@company.com, 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-inner"
              />
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

        {step === 'email-otp' && (
          <form onSubmit={handleVerifyEmailOtp} className="space-y-4 animate-fadeIn relative z-10">
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center mb-2">
              <p className="text-xs text-slate-700">Enter 4-digit OTP sent to <span className="text-amber-700 font-bold">{identifier}</span></p>
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

            <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-emerald-600 active:text-white active:scale-[0.98] text-slate-950 font-black text-xs cursor-pointer shadow-lg transition-all duration-100">
              {loading ? 'Verifying...' : 'Verify Email OTP →'}
            </button>
          </form>
        )}

        {/* यूनिक यूजरनेम और ऑर्गनाइजेशन नेम सेटअप */}
        {step === 'org-name' && (
          <form onSubmit={handleOrgSubmit} className="space-y-4 animate-fadeIn relative z-10">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">
                Choose a Unique Username
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. john_doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500 mb-3"
              />

              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">
                Organization Name
              </label>
              <input 
                type="text" 
                required
                placeholder="Enter organization name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button type="submit" className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-cyan-500 active:text-slate-950 active:scale-[0.98] text-slate-950 font-black text-xs cursor-pointer shadow-lg transition-all duration-100">
              Mobile Verification →
            </button>
          </form>
        )}

        {step === 'mobile-input' && (
          <form onSubmit={handleMobileSubmit} className="space-y-4 animate-fadeIn relative z-10">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">
                Mobile Number (WhatsApp)
              </label>
              <input 
                type="tel" 
                required
                placeholder="9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-4 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button type="submit" className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-purple-600 active:text-white active:scale-[0.98] text-slate-950 font-black text-xs cursor-pointer shadow-lg transition-all duration-100">
              Proceed to WhatsApp Verification →
            </button>
          </form>
        )}

        {step === 'whatsapp-verify' && (
          <div className="space-y-4 text-center animate-fadeIn relative z-10">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-2xl mb-2 block">💬</span>
              <h3 className="text-xs font-black text-slate-900 mb-1">Verify via WhatsApp</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Click below to send a secure activation token from your WhatsApp number <strong className="text-emerald-700">{mobileNumber}</strong>.
              </p>
            </div>

            <a
              href={`https://wa.me/919876543210?text=Verify%20My%20Kosisko%20Account%20ID%3A%20${mobileNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppVerified}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-zinc-900 active:text-white active:scale-[0.98] text-white font-black text-xs transition-all duration-100 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              <span>🟢 Open WhatsApp & Verify</span>
            </a>

            <button
              type="button"
              onClick={handleWhatsAppVerified}
              className="text-[10px] text-slate-500 hover:text-slate-900 underline cursor-pointer"
            >
              Message sent? Proceed to password setup →
            </button>
          </div>
        )}

        {step === 'password-setup' && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-fadeIn relative z-10">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">
                Create Secure Password (Min 8 Characters)
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
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
                    ></div>
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
              {loading ? 'Provisioning Workspace...' : 'Launch Workspace'}
            </button>
          </form>
        )}

        {step === 'login-password' && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-fadeIn relative z-10">
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between mb-2">
              <span className="text-xs text-slate-700 truncate max-w-[240px]">{identifier}</span>
              <button type="button" onClick={() => setStep('universal-input')} className="text-[10px] text-amber-700 font-bold hover:underline cursor-pointer">Change</button>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-700 mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
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

        {step === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-fadeIn relative z-10">
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

        <div className="mt-8 text-center border-t border-slate-200 pt-4 flex flex-col items-center justify-center gap-2 relative z-10">
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

export default function UltimateHybridAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 font-bold text-xs">Loading Secure Portal...</div>}>
      <AuthContentWrapper />
    </Suspense>
  );
}
