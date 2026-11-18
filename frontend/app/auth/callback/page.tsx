'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusText, setStatusText] = useState('Verifying Google Identity...');
  const [statusIcon, setStatusIcon] = useState('⚡');
  const [welcomeDetails, setWelcomeDetails] = useState<{ 
    name: string; 
    org?: string; 
    badge: string;
    subtext: string;
  } | null>(null);
  const [progressWidth, setProgressWidth] = useState(35);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let token = '';
    let state = searchParams.get('state') || '';

    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      token = hashParams.get('id_token') || hashParams.get('access_token') || '';
      if (!state) state = hashParams.get('state') || '';
    }

    if (!token) {
      token = searchParams.get('id_token') || searchParams.get('token') || '';
    }

    if (!token) {
      const err = searchParams.get('error') || 'No authentication token received from Google.';
      setErrorMsg(err);
       window.location.replace('/login'); ;
      return;
    }

    let email = '';
    let firstName = '';
    let lastName = '';
    let fullName = '';

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);

      email = decoded.email || '';
      firstName = decoded.given_name || '';
      lastName = decoded.family_name || '';
      fullName = decoded.name || `${firstName} ${lastName}`.trim();
      if (!firstName && fullName) firstName = fullName.split(' ')[0];

      setWelcomeDetails({
        name: firstName || fullName || 'Merchant',
        badge: 'SECURE SSO GATEWAY',
        subtext: 'Authenticating Identity...'
      });
      setProgressWidth(60);
    } catch {
      setErrorMsg('Invalid identity token received.');
       window.location.replace('/login'); ;
      return;
    }

    let returnOrigin = '';
    try {
      if (state) returnOrigin = JSON.parse(state).return_origin || '';
    } catch {
      returnOrigin = '';
    }

    fetch('/api/v1/auth/google/onboarding/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        token,
        return_origin: returnOrigin,
      }),
    })
      .then(async (res) => {
        const rawText = await res.text();
        let data: any;
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error(`Server returned invalid response (${res.status}).`);
        }
        if (!res.ok) throw new Error(data.error || data.message || `Authentication failed (${res.status})`);
        return data;
      })
      .then((data) => {
        setProgressWidth(100);
        const finalName = data.first_name || firstName || data.full_name || data.username || 'Merchant';
        let slugOrg = '';
        try {
          if (data.workspace_url) {
            const parsedHost = new URL(data.workspace_url, window.location.origin).hostname;
            const hostSegs = parsedHost.split('.');
            if (hostSegs.length >= 3 && !['www', 'app', 'api'].includes(hostSegs[0].toLowerCase())) {
              slugOrg = hostSegs[0].charAt(0).toUpperCase() + hostSegs[0].slice(1) + ' Workspace';
            }
          }
        } catch {}
        const rawTenant = typeof data.tenant === 'object' && data.tenant !== null ? (data.tenant.name || data.tenant.organization_name || '') : (data.tenant || '');
        const orgName = data.organization_name || data.firm_name || data.company_name || data.tenant_name || data.workspace_name || rawTenant || slugOrg;

        // 🌟 1. रजिस्टर्ड यूज़र + सक्रिय दुकान (Instant Dashboard Launch)
        if (data.is_registered_user && data.workspace_url) {
          document.cookie = 'kosisko_logged_in=true; path=/; domain=.kosisko.com; SameSite=Lax; Secure';
          document.cookie = 'kosisko_logged_in=true; path=/; SameSite=Lax; Secure';
          sessionStorage.removeItem('kosisko_logout_active');
          sessionStorage.setItem('kosisko_session_active', 'true');

          setStatusIcon('🚀');
          setWelcomeDetails({
            name: finalName,
            org: orgName,
            badge: 'IDENTITY CONFIRMED',
            subtext: orgName ? `Launching Workspace: ${orgName}` : 'Launching Enterprise Workspace...'
          });
          setStatusText(`Launching Workspace...`);

          // ⚡ सुपर-फास्ट 350ms का स्मूथ ट्रांज़िशन (App Mode vs Web Browser)
          setTimeout(() => {
            // 1. चेक करें कि यूजर ऐप (TWA / PWA) में है या नॉर्मल वेब ब्राउज़र में
            const isAppMode =
              typeof window !== 'undefined' &&
              (window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://') ||
                localStorage.getItem('kosisko_app_mode') === 'twa' ||
                sessionStorage.getItem('kosisko_app_mode') === 'twa');

            let targetUrl = data.workspace_url;

            // 2. यदि ऐप मोड है तो सबडोमेन के बजाय Same-Origin Path पर भेजें
            if (isAppMode && data.workspace_url) {
              try {
                const parsed = new URL(data.workspace_url, window.location.origin);
                const hostParts = parsed.hostname.split('.');
                
                // सबडोमेन निकालें (उदा. ratan)
                if (hostParts.length >= 3 && !parsed.hostname.includes('localhost')) {
                  const tenantSlug = hostParts[0].toLowerCase();
                  const subPath = parsed.pathname === '/' ? '' : parsed.pathname;
                  
                  // एक्टिव टेनेंट की कुकी सेट करें ताकि सभी कंपोनेंट्स को टेनेंट मिल सके
                  document.cookie = `kosisko_active_tenant=${tenantSlug}; path=/; domain=.kosisko.com; SameSite=Lax; Secure`;
                  
                  // Same-Origin URL: kosisko.com/workspace/ratan (URL Bar कभी नहीं आएगा)
                  targetUrl = `/workspace/${tenantSlug}${subPath}${parsed.search}${parsed.hash}`;
                }
              } catch (e) {
                console.error('Workspace URL parsing error:', e);
              }
            }

            window.location.replace(targetUrl);
          }, 1250);
          return;
        }

        // 🌟 2. रजिस्टर्ड यूज़र + दुकान अभी नहीं बनी (Direct Workspace Onboarding)
        if (data.is_registered_user && !data.workspace_url) {
          document.cookie = 'kosisko_logged_in=true; path=/; domain=.kosisko.com; SameSite=Lax; Secure';
          document.cookie = 'kosisko_logged_in=true; path=/; SameSite=Lax; Secure';
          sessionStorage.removeItem('kosisko_logout_active');
          sessionStorage.setItem('kosisko_session_active', 'true');

          setStatusIcon('🏢');
          setWelcomeDetails({
            name: finalName,
            badge: 'MERCHANT VERIFIED',
            subtext: 'Launching Workspace Setup...'
          });
          setStatusText('Provisioning Environment...');

          
            window.location.replace('/onboarding');
          ;
          return;
        }

        // 🌟 केस 3: नया यूज़र (बिना ब्राउज़र रीलोड के मक्खन जैसा स्मूथ ट्रांज़िशन)
        document.cookie = 'kosisko_logged_in=; path=/; domain=.kosisko.com; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = 'kosisko_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        sessionStorage.removeItem('kosisko_session_active');

        setStatusIcon('✨');
        setWelcomeDetails({
          name: finalName,
          badge: 'NEW MERCHANT ONBOARDING',
          subtext: 'Preparing Profile Setup...'
        });
        setStatusText('Routing to Setup Portal...');

        setTimeout(() => {
          const prefill = data.prefilled_data || {};
          const query = new URLSearchParams({
            onboarding: 'true',
            email: prefill.email || email,
            name: `${prefill.first_name || firstName} ${prefill.last_name || lastName}`.trim() || fullName,
          }).toString();

          // ⚡ router.replace बिना किसी वाइट फ़्लैश या झटके के पेज को तुरंत बदलेगा
          router.replace(`/login?${query}`);
        }, 300);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Unable to connect to authentication server.');
         window.location.replace('/login'); ;
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      
      {/* एंबिएंट बैकग्राउंड लाइटिंग */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* आधुनिक डॉट ग्रिड */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-20 pointer-events-none" />

      {/* मेन एंटरप्राइज कार्ड */}
      <div className="w-full max-w-[420px] bg-slate-900/85 border border-white/10 rounded-[32px] p-8 shadow-[0_25px_80px_rgba(0,0,0,0.6),_0_0_50px_rgba(245,158,11,0.06)] backdrop-blur-2xl text-center relative z-10">
        
        {/* आधिकारिक Kosisko लोगो व ब्रांड हेडर */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <div className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner flex items-center justify-center min-w-[130px]">
            <img
              src="https://kosisko.com/Logo.png?v=3"
              alt="Kosisko"
              className="h-8 w-auto object-contain drop-shadow-[0_2px_10px_rgba(245,158,11,0.25)]"
              onError={(e) => {
                // फ़ॉलबैक यदि इमेज लोड न हो
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        {errorMsg ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-xl">
              ✕
            </div>
            <h3 className="text-xs font-black text-rose-400 uppercase tracking-wider">Authentication Notice</h3>
            <p className="text-xs text-slate-400 leading-relaxed px-2">{errorMsg}</p>
            <p className="text-[10px] text-slate-500 font-mono mt-3">Returning to login portal...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {welcomeDetails && (
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  {welcomeDetails.badge}
                </span>

                <h2 className="text-2xl font-black text-white tracking-tight">
                  Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">{welcomeDetails.name}</span>!
                </h2>

                {welcomeDetails.org ? (
                  <p className="text-xs text-slate-300 font-medium">
                    Workspace: <span className="text-cyan-400 font-bold">{welcomeDetails.org}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">{welcomeDetails.subtext}</p>
                )}
              </div>
            )}

            {/* ⚡ हाई-स्पीड नियॉन प्रोग्रेस बार */}
            <div className="py-1">
              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden p-[1px] border border-white/5">
                <div 
                  className="bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </div>

            {/* लाइव स्थिति टेक्स्ट */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300 tracking-wide">
              <span>{statusIcon}</span>
              <span>{statusText}</span>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-emerald-400/90 font-mono tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>256-Bit Encrypted Gateway</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
