'use client';

import { useEffect, useState } from 'react';

export default function AuthCallbackPage() {
  const [statusText, setStatusText] = useState('Securing Your Portal...');
  const [subText, setSubText] = useState('Verifying Google credentials securely');
  const [orgName, setOrgName] = useState('');
  const [userName, setUserName] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const idToken = hashParams.get('id_token');
      const urlParams = new URLSearchParams(window.location.search);
      const finalToken = idToken || urlParams.get('id_token') || urlParams.get('token');

      if (!finalToken) {
        setError('No authentication token received.');
        setTimeout(() => { window.location.href = '/login'; }, 2000);
        return;
      }

      try {
        // 1. Google JWT से तुरंत नाम निकालें
        const base64Url = finalToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));

        const email = payload.email;
        const firstName = payload.given_name || payload.name?.split(' ')[0] || 'Member';
        const lastName = payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '';

        setUserName(firstName);

        // 2. Django बैकएंड पर भेजें
        fetch('/api/v1/auth/google/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            first_name: firstName,
            last_name: lastName,
            token: finalToken,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.action === 'login' || (data.status === 'success' && data.token)) {
              // टोकन और कुकी सेट करें
              const authToken = data.token || data.access || 'google_session_' + Date.now();
              localStorage.setItem('authToken', authToken);
              document.cookie = 'kosisko_logged_in=true; path=/; max-age=86400; SameSite=Lax';
              sessionStorage.removeItem('kosisko_logout_active');

              // 🌟 ऑर्गनाइज़ेशन का नाम निकालें (बैकएंड से या डिफ़ॉल्ट)
              const detectedOrg = data.organization_name || data.tenant_name || data.tenant || `${firstName}'s Enterprise`;
              setOrgName(detectedOrg);

              // 🌟 स्क्रीन को तुरंत कस्टमाइज़्ड वेलकम मोड में बदलें
              setIsSuccess(true);
              setStatusText(`Welcome, ${firstName}! ✨`);
              setSubText(`Launching ${detectedOrg} Workspace...`);

              // 🌟 700ms का स्मूथ पॉज़ ताकि यूज़र मैसेज देख सके, फिर डैशबोर्ड
              setTimeout(() => {
                const rawState = hashParams.get('state');
                const returnOrigin = rawState ? decodeURIComponent(rawState) : window.location.origin;

                if (returnOrigin && !returnOrigin.includes(window.location.hostname)) {
                  window.location.replace(`${returnOrigin}/auth/callback?session_token=${authToken}`);
                } else {
                  window.location.replace('/customer/marketplace');
                }
              }, 800);

            } else if (data.action === 'onboarding_required' || !data.token) {
              // नया यूज़र है तो ऑनबोर्डिंग के लिए भेजें
              window.location.replace(`/login?onboarding=true&email=${encodeURIComponent(email)}&name=${encodeURIComponent(firstName)}`);
            } else {
              setError(data.error || data.message || 'Authentication failed.');
              setTimeout(() => { window.location.href = '/login'; }, 2000);
            }
          })
          .catch(() => {
            setError('Backend connection failed.');
            setTimeout(() => { window.location.href = '/login'; }, 2000);
          });
      } catch (err) {
        setError('Error parsing token.');
        setTimeout(() => { window.location.href = '/login'; }, 2000);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50 via-slate-50 to-indigo-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white/95 border border-slate-300/80 p-8 rounded-[40px] shadow-[0_25px_80px_rgba(0,0,0,0.08)] backdrop-blur-2xl text-center space-y-4 transition-all duration-500">
        {!error ? (
          <>
            {/* लोडर या सक्सेस टिक मार्क */}
            {!isSuccess ? (
              <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            ) : (
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold animate-bounce shadow-md">
                ✓
              </div>
            )}

            {/* कस्टमाइज़्ड मुख्य हेडिंग */}
            <h2 className="text-base font-black text-slate-900 tracking-wide transition-all duration-300">
              {statusText}
            </h2>

            {/* कस्टमाइज़्ड सब-टेक्स्ट (कंपनी का नाम) */}
            <p className="text-xs font-semibold text-amber-700 bg-amber-50 py-2 px-4 rounded-xl inline-block border border-amber-200 shadow-sm transition-all duration-300">
              {subText}
            </p>

            <div className="pt-2">
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Secure 256-bit Session Routing
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">⚠️</div>
            <p className="text-xs font-bold text-red-600">{error}</p>
            <p className="text-[10px] text-slate-400">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}
