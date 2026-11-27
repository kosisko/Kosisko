'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import BranchSwitcher from '@/components/BranchSwitcher';
import { getSharedDeviceId } from '@/components/SessionDraftGuard';
import {
  KOSISKO_ICON_PACK,
  KOSISKO_OPERATIONAL_MODULES,
} from '@/config/kosiskoModules';
import KosiskoStudioDrawer, {
  KosiskoStudioState,
  StudioTabKey,
  DEFAULT_STUDIO_STATE,
  applyStudioTokensToDocument,
} from '@/components/KosiskoStudioDrawer';

function VectorIcon({ name, className = 'w-4 h-4 shrink-0' }: { name: string; className?: string }) {
  const inner = KOSISKO_ICON_PACK[name] || KOSISKO_ICON_PACK.inventory;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

function deriveSubdomainBranding() {
  if (typeof window === 'undefined') {
    return { firm: '', sub: 'kosisko.com' };
  }
  const host = window.location.hostname || 'kosisko.com';
  const parts = host.split('.');
  if (parts.length >= 3 && !['www', 'app', 'api'].includes(parts[0])) {
    const slug = parts[0];
    const pretty = slug.charAt(0).toUpperCase() + slug.slice(1) + ' Enterprises';
    return { firm: pretty, sub: host };
  }
  return { firm: '', sub: host };
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isWhiteLabeled, customBrand, installedApps } = useApp();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Instant Identity State (Hydrated from localStorage + subdomain with zero flash)
  const [firmName, setFirmName] = useState('');
  const [subdomainLabel, setSubdomainLabel] = useState('kosisko.com');
  const [userFirstName, setUserFirstName] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userInitials, setUserInitials] = useState('K');

  // Kosisko OS Studio State
  const [studio, setStudio] = useState<KosiskoStudioState>(DEFAULT_STUDIO_STATE);
  const [studioOpen, setStudioOpen] = useState(false);
  const [studioInitialTab, setStudioInitialTab] = useState<StudioTabKey>('themes');

  // Top Header Popovers & Co-Pilot
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [sidebarCmdInput, setSidebarCmdInput] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [idleWarningSeconds, setIdleWarningSeconds] = useState<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const audioCtxRef = useRef<AudioContext | null>(null);
  const celebrationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloudSyncTimerRef = useRef<any>(null);
  const avatarBoxRef = useRef<HTMLDivElement | null>(null);

  // Clean Session Termination Helper (Used both on Manual Sign Out & 3-Hour Session Expiry)
  const forceCleanLogout = (reasonQuery = 'logout=true') => {
    setIsLoggingOut(true);
    const did = typeof window !== 'undefined' ? localStorage.getItem('kosisko_device_id') || '' : '';
    const savedStudio = typeof window !== 'undefined' ? localStorage.getItem('kosisko_os_studio_v1') : null;
    const savedCustomThemes = typeof window !== 'undefined' ? localStorage.getItem('kosisko_custom_themes_v1') : null;

    document.cookie = 'kosisko_logged_in=; path=/; domain=.kosisko.com; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'kosisko_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';

    try {
      sessionStorage.clear();
      sessionStorage.setItem('kosisko_splash_played', '1');
      sessionStorage.setItem('kosisko_logout_active', 'true');
      localStorage.clear();
      if (did) localStorage.setItem('kosisko_device_id', did);
      if (savedStudio) localStorage.setItem('kosisko_os_studio_v1', savedStudio);
      if (savedCustomThemes) localStorage.setItem('kosisko_custom_themes_v1', savedCustomThemes);
    } catch {}

    window.location.replace(`/login?${reasonQuery}`);
  };

  // 1. Auth Guard + 0ms Cached Identity Hydration
  useEffect(() => {
    const hasLoginCookie = document.cookie
      .split('; ')
      .some((row) => row.startsWith('kosisko_logged_in=true'));
    if (!hasLoginCookie) {
      forceCleanLogout('expired=true');
      return;
    }

    // Hydrate cached identity synchronously before showing UI
    const subInfo = deriveSubdomainBranding();
    setSubdomainLabel(subInfo.sub);
    try {
      const cachedRaw = localStorage.getItem('kosisko_cached_identity_v1');
      if (cachedRaw) {
        const c = JSON.parse(cachedRaw);
        if (c.firmName) setFirmName(c.firmName);
        else if (subInfo.firm) setFirmName(subInfo.firm);
        if (c.userFirstName) setUserFirstName(c.userFirstName);
        if (c.userFullName) setUserFullName(c.userFullName);
        if (c.userInitials) setUserInitials(c.userInitials);
      } else if (subInfo.firm) {
        setFirmName(subInfo.firm);
      }
    } catch {
      if (subInfo.firm) setFirmName(subInfo.firm);
    }

    setIsAuthorized(true);
    router.prefetch('/login');
    router.prefetch('/customer/profile');
    router.prefetch('/customer/security');
    router.prefetch('/customer/marketplace');
  }, [router]);

  // 2. Load Saved Studio Preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kosisko_os_studio_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: KosiskoStudioState = {
          ...DEFAULT_STUDIO_STATE,
          ...parsed,
          zones: { ...DEFAULT_STUDIO_STATE.zones, ...(parsed.zones || {}) },
          features: { ...DEFAULT_STUDIO_STATE.features, ...(parsed.features || {}) },
        };
        setStudio(merged);
        applyStudioTokensToDocument(merged);
      } else {
        applyStudioTokensToDocument(DEFAULT_STUDIO_STATE);
      }
    } catch {
      applyStudioTokensToDocument(DEFAULT_STUDIO_STATE);
    }
  }, []);

  const saveStudioToUserCloud = (nextState: KosiskoStudioState) => {
    if (cloudSyncTimerRef.current) clearTimeout(cloudSyncTimerRef.current);
    cloudSyncTimerRef.current = setTimeout(async () => {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const tok =
          localStorage.getItem('access_token') ||
          localStorage.getItem('token') ||
          localStorage.getItem('kosisko_token');
        if (tok && tok !== 'null' && tok !== 'undefined') headers['Authorization'] = `Bearer ${tok}`;
        const did = getSharedDeviceId();
        if (did) headers['X-Device-ID'] = did;

        // Avoid sending huge raw base64 > 400KB if not needed, keep all zones/themes/fonts/switches/urls synced
        const payloadState = {
          ...nextState,
          dashboardWallpaper:
            nextState.dashboardWallpaper && nextState.dashboardWallpaper.length > 450000
              ? ''
              : nextState.dashboardWallpaper,
        };

        await fetch('/api/v1/auth/profile/', {
          method: 'PATCH',
          credentials: 'include',
          headers,
          body: JSON.stringify({ studio_preferences: payloadState }),
        });
      } catch {}
    }, 650);
  };

  const updateStudio = (next: KosiskoStudioState) => {
    setStudio(next);
    applyStudioTokensToDocument(next);
    try {
      localStorage.setItem('kosisko_os_studio_v1', JSON.stringify(next));
    } catch {
      try {
        const slim = { ...next, dashboardWallpaper: next.dashboardWallpaper?.startsWith('data:') ? '' : next.dashboardWallpaper };
        localStorage.setItem('kosisko_os_studio_v1', JSON.stringify(slim));
      } catch {}
    }
    saveStudioToUserCloud(next);
  };

  // 3. Global Custom-Pin Button Injector for Every .os-card Across All Pages
  useEffect(() => {
    if (!isAuthorized) return;
    const attachPins = () => {
      document.querySelectorAll('.os-card').forEach((card) => {
        if (card.querySelector('.beam-pin-btn')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'beam-pin-btn';
        btn.title = 'Toggle Animated Border Beam on this Box';
        btn.innerHTML =
          '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          card.classList.toggle('beam-pinned');
        });
        card.appendChild(btn);
      });
    };

    attachPins();
    const observer = new MutationObserver(() => attachPins());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [isAuthorized, pathname, studio.beamMode]);

  // 4. Live Session Heartbeat & Profile Sync (Prevents Ghost Login After 3 Hours!)
  useEffect(() => {
    if (!isAuthorized) return;

    const verifySessionAndProfile = async () => {
      try {
        const headers: Record<string, string> = {};
        const tok =
          localStorage.getItem('access_token') ||
          localStorage.getItem('token') ||
          localStorage.getItem('kosisko_token');
        if (tok && tok !== 'null' && tok !== 'undefined') headers['Authorization'] = `Bearer ${tok}`;
        const did = getSharedDeviceId();
        if (did) headers['X-Device-ID'] = did;

        const res = await fetch('/api/v1/auth/profile/', { credentials: 'include', headers });
        if (res.status === 401 || res.status === 403) {
          // Backend session expired (e.g. after 3 hours idle) — terminate cleanly!
          forceCleanLogout('expired=true');
          return;
        }
        if (res.ok) {
          const data = await res.json();
          const fn = data.user?.first_name || data.user?.username || 'Account';
          const ln = data.user?.last_name || '';
          const subInfo = deriveSubdomainBranding();
          const org =
            data.profile?.organization_name ||
            data.tenant?.name ||
            subInfo.firm ||
            'Kosisko Enterprise';
          const sub = data.tenant?.subdomain ? `${data.tenant.subdomain}.kosisko.com` : subInfo.sub;
          const full = `${fn} ${ln}`.trim();
          const initials = (fn.charAt(0) + (ln.charAt(0) || '')).toUpperCase();

          setUserFirstName(fn);
          setUserFullName(full);
          setUserInitials(initials);
          setFirmName(org);
          setSubdomainLabel(sub);

          if (typeof window !== 'undefined') {
            const isTwaApp =
              window.matchMedia('(display-mode: standalone)').matches ||
              (window.navigator as any).standalone === true ||
              document.referrer.startsWith('android-app://') ||
              localStorage.getItem('kosisko_app_mode') === 'twa' ||
              document.cookie.includes('kosisko_is_twa=true');

            if (isTwaApp) {
              localStorage.setItem('kosisko_app_mode', 'twa');
              document.cookie = 'kosisko_is_twa=true; path=/; domain=.kosisko.com; SameSite=Lax; Secure';
            }

            const cleanSubSlug = (sub || '').trim().toLowerCase().replace(/^https?:\/\//, '').split('.kosisko.com')[0].split('/')[0].trim();
            const hasValidSub = Boolean(cleanSubSlug && cleanSubSlug !== 'workspace' && !cleanSubSlug.includes('.') && !['www', 'api', 'admin', 'mail', 'app', 'kosisko', 'kosisko.com', '__none__'].includes(cleanSubSlug));
            const cookieVal = hasValidSub ? cleanSubSlug : '__none__';
            document.cookie = `kosisko_active_tenant=${cookieVal}; path=/; domain=.kosisko.com; SameSite=Lax; Secure`;
            document.cookie = `kosisko_active_tenant=${cookieVal}; path=/; SameSite=Lax; Secure`;

            const curHost = window.location.hostname.toLowerCase();
            if (!isTwaApp && curHost.endsWith('kosisko.com')) {
              const expectedHost = hasValidSub ? `${cleanSubSlug}.kosisko.com` : 'kosisko.com';
              if (curHost !== expectedHost) {
                window.location.replace(`https://${expectedHost}${window.location.pathname}${window.location.search}`);
                return;
              }
            }
          }

          // Apply Cloud-Synced Studio Customizer settings tied to this User ID across ALL login methods
          const cloudPrefs = data.profile?.studio_preferences;
          if (cloudPrefs && typeof cloudPrefs === 'object' && Object.keys(cloudPrefs).length > 0) {
            const mergedCloud: KosiskoStudioState = {
              ...DEFAULT_STUDIO_STATE,
              ...cloudPrefs,
              zones: { ...DEFAULT_STUDIO_STATE.zones, ...(cloudPrefs.zones || {}) },
              features: { ...DEFAULT_STUDIO_STATE.features, ...(cloudPrefs.features || {}) },
            };
            setStudio(mergedCloud);
            applyStudioTokensToDocument(mergedCloud);
            try {
              localStorage.setItem('kosisko_os_studio_v1', JSON.stringify(mergedCloud));
            } catch {}
          } else {
            try {
              const localRaw = localStorage.getItem('kosisko_os_studio_v1');
              if (localRaw) {
                const localParsed = JSON.parse(localRaw);
                saveStudioToUserCloud(localParsed);
              }
            } catch {}
          }

          try {
            localStorage.setItem(
              'kosisko_cached_identity_v1',
              JSON.stringify({
                firmName: org,
                userFirstName: fn,
                userFullName: full,
                userInitials: initials,
              })
            );
          } catch {}
        }
      } catch {}
    };

    verifySessionAndProfile();
    const interval = setInterval(verifySessionAndProfile, 60000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') verifySessionAndProfile();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAuthorized]);

  // 5. Web Audio Micro-Soundscapes
  const playSound = (type: 'click' | 'sweep' | 'chime') => {
    if (!studio.features.sound || typeof window === 'undefined') return;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(560, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.028);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.035);
      } else if (type === 'chime') {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const t0 = now + idx * 0.035;
          osc.frequency.setValueAtTime(freq, t0);
          gain.gain.setValueAtTime(0.001, t0);
          gain.gain.linearRampToValueAtTime(0.03, t0 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.32);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t0);
          osc.stop(t0 + 0.34);
        });
      }
    } catch {}
  };


  // Sync Idle Timeout updates from Security Hub
  useEffect(() => {
    const onIdleChange = (e: any) => {
      const mins = Number(e?.detail?.minutes ?? 30);
      setStudio((prev) => ({ ...prev, idleLogoutMinutes: mins }));
    };
    window.addEventListener('kosisko-idle-updated', onIdleChange);
    return () => window.removeEventListener('kosisko-idle-updated', onIdleChange);
  }, []);

  // 7. Real Cursor & Keyboard Inactivity Auto-Logout Engine
  useEffect(() => {
    if (!isAuthorized) return;
    const limitMinutes = studio.idleLogoutMinutes ?? 30;
    if (!limitMinutes || limitMinutes <= 0) {
      setIdleWarningSeconds(null);
      return;
    }

    lastActivityRef.current = Date.now();
    const markActive = () => {
      lastActivityRef.current = Date.now();
      setIdleWarningSeconds((prev) => (prev !== null ? null : prev));
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, markActive, { passive: true }));

    const timer = setInterval(() => {
      const idleSec = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const maxSec = limitMinutes * 60;
      const remaining = maxSec - idleSec;
      if (remaining <= 0) {
        clearInterval(timer);
        forceCleanLogout('idle=true');
      } else if (remaining <= 15) {
        setIdleWarningSeconds(remaining);
      } else {
        setIdleWarningSeconds(null);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      events.forEach((ev) => window.removeEventListener(ev, markActive));
    };
  }, [isAuthorized, studio.idleLogoutMinutes]);



  // Flower & Balloon Confetti Celebration Engine (Controlled by celebrationAnim Switch)
  const triggerCelebration = () => {
    if (studio.features.celebrationAnim === false || typeof window === 'undefined') return;
    const canvas = celebrationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const palette = [studio.zones.accent || '#F59E0B', '#10B981', '#38BDF8', '#F43F5E', '#A855F7', '#FACC15'];
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; color: string; alpha: number; rot: number; vRot: number;
      shape: 'petal' | 'balloon' | 'spark';
    }> = [];

    for (let i = 0; i < 68; i++) {
      const angle = (Math.PI * 2 * i) / 68 + (Math.random() - 0.5) * 0.35;
      const speed = 4.2 + Math.random() * 6.8;
      const shapes: Array<'petal' | 'balloon' | 'spark'> = ['petal', 'balloon', 'spark'];
      particles.push({
        x: canvas.width * 0.5,
        y: canvas.height * 0.32,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.6,
        size: 4.5 + Math.random() * 4.5,
        color: palette[i % palette.length],
        alpha: 1,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.16,
        shape: shapes[i % 3],
      });
    }

    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.shape === 'balloon' ? 0.12 : 0.21;
        p.vx *= 0.985;
        p.rot += p.vRot;
        p.alpha -= 0.015;
        if (p.alpha > 0) {
          alive++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          if (p.shape === 'balloon') {
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 0.78, p.size * 1.08, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(0, p.size * 1.08);
            ctx.lineTo(-2.2, p.size * 1.35);
            ctx.lineTo(2.2, p.size * 1.35);
            ctx.closePath();
            ctx.fill();
          } else if (p.shape === 'petal') {
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.48, 0, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
          }
          ctx.restore();
        }
      }
      if (alive > 0) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    (window as any).triggerKosiskoCelebration = () => {
      playSound('chime');
      triggerCelebration();
    };
    (window as any).isKosiskoRollingEnabled = () => studio.features.rollingNumbers !== false;
  }, [studio.features.celebrationAnim, studio.features.rollingNumbers, studio.features.sound, studio.zones.accent]);

  // Keep custom Favicon locked across Next.js route changes
  useEffect(() => {
    if (!studio.customFaviconUrl) return;
    const enforceFavicon = () => {
      const icons = document.querySelectorAll("link[rel*='icon']");
      const alreadySet = Array.from(icons).some((el) => (el as HTMLLinkElement).href === studio.customFaviconUrl);
      if (!alreadySet) {
        icons.forEach((el) => el.parentNode?.removeChild(el));
        ['icon', 'shortcut icon', 'apple-touch-icon'].forEach((relName) => {
          const link = document.createElement('link');
          link.rel = relName;
          if (relName !== 'apple-touch-icon') link.type = 'image/png';
          link.href = studio.customFaviconUrl;
          document.head.appendChild(link);
        });
      }
    };
    enforceFavicon();
    const obs = new MutationObserver(enforceFavicon);
    obs.observe(document.head, { childList: true });
    return () => obs.disconnect();
  }, [studio.customFaviconUrl, pathname]);

  // 8. Gemini 3.7 Autonomous AI Voice & Command Engine (Fast-Path + Self-Learning Memory + /api/v1/ai-intent/)
  const playTukBeep = (kind: 'start' | 'end' | 'error') => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      if (kind === 'start') {
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } else if (kind === 'end') {
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.11);
      }
    } catch {}
  };

  const executeAIGuidedAction = (actionCode: string, customMsg?: string) => {
    const act = (actionCode || '').toLowerCase().trim();

    // 1. Express POS Sale Trigger
    if (
      act.includes('sale') ||
      act.includes('सेल') ||
      act.includes('express') ||
      act.includes('invoice') ||
      act.includes('बिल') ||
      act.includes('रिकॉर्ड')
    ) {
      if (pathname !== '/customer/dashboard') router.push('/customer/dashboard');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('kosisko-ai-record-sale'));
      }, 250);
      playSound('chime');
      triggerCelebration();
      setToastMsg({ text: customMsg || 'AI Co-Pilot: Express POS Sale recorded!', ok: true });
      setTimeout(() => setToastMsg(null), 3800);
      return;
    }

    // 2. Navigation Position Commands
    if (act.includes('top nav') || act.includes('टॉप नेविगेशन') || act.includes('ऊपर')) {
      updateStudio({ ...studio, navPosition: 'top' });
      playSound('chime');
      setToastMsg({ text: 'Navigation switched to Top Bar.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('right nav') || act.includes('राइट')) {
      updateStudio({ ...studio, navPosition: 'right' });
      playSound('chime');
      setToastMsg({ text: 'Navigation docked to Right Sidebar.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('left nav') || act.includes('लेफ्ट')) {
      updateStudio({ ...studio, navPosition: 'left' });
      playSound('chime');
      setToastMsg({ text: 'Navigation docked to Left Sidebar.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    // 3. Card Borders & Screen Width
    if (act.includes('remove border') || act.includes('no border') || act.includes('बॉर्डर हटा') || act.includes('border हटा')) {
      updateStudio({ ...studio, removeCardBorders: true });
      playSound('click');
      setToastMsg({ text: 'Card borders removed.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('show border') || act.includes('बॉर्डर दिखा') || act.includes('border दिखा')) {
      updateStudio({ ...studio, removeCardBorders: false });
      playSound('click');
      setToastMsg({ text: 'Card borders restored.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('full') || act.includes('फुल')) {
      updateStudio({ ...studio, workspaceWidth: 'full' });
      playSound('click');
      setToastMsg({ text: 'Workspace set to Full-Width (100%).', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('center') || act.includes('सेंटर')) {
      updateStudio({ ...studio, workspaceWidth: 'centered' });
      playSound('click');
      setToastMsg({ text: 'Workspace set to Centered Focus.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    // 4. Instant Theme & Color Commands
    if (act.includes('light') || act.includes('daylight') || act.includes('white') || act.includes('सफेद') || act.includes('लाइट')) {
      updateStudio({
        ...studio,
        activeThemeId: 'porcelain-gold',
        zones: { ...studio.zones, canvas: '#F8FAFC', sidebar: '#FFFFFF', topbar: '#FFFFFF', cards: '#FFFFFF' },
      });
      playSound('chime');
      setToastMsg({ text: 'Applied Daylight White Theme.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('dark') || act.includes('obsidian') || act.includes('black') || act.includes('काला') || act.includes('डार्क')) {
      updateStudio({
        ...studio,
        activeThemeId: 'obsidian-gold',
        zones: { ...studio.zones, accent: '#F59E0B', canvas: '#07090E', sidebar: 'auto', topbar: 'auto', cards: 'auto' },
      });
      playSound('chime');
      setToastMsg({ text: 'Applied 24K Obsidian Dark Theme.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('blue') || act.includes('sapphire') || act.includes('नीला')) {
      updateStudio({ ...studio, zones: { ...studio.zones, accent: '#38BDF8', canvas: '#050B18' } });
      playSound('chime');
      setToastMsg({ text: 'Applied Midnight Sapphire Blue Theme.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('green') || act.includes('emerald') || act.includes('हरा')) {
      updateStudio({ ...studio, zones: { ...studio.zones, accent: '#10B981', canvas: '#04100C' } });
      playSound('chime');
      setToastMsg({ text: 'Applied Quantum Emerald Green Theme.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('gold') || act.includes('amber') || act.includes('गोल्ड') || act.includes('सुनहरा')) {
      updateStudio({ ...studio, zones: { ...studio.zones, accent: '#F59E0B' } });
      playSound('chime');
      setToastMsg({ text: 'Accent color set to 24K Gold.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    // 5. Font Size & Times New Roman
    if (act.includes('times new roman')) {
      updateStudio({ ...studio, fontFamily: 'Times New Roman' });
      playSound('click');
      setToastMsg({ text: 'Font changed to Times New Roman.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('बढ़ा') || act.includes('बड़ा') || act.includes('increase') || act.includes('big')) {
      const nextSz = Math.min(18, (studio.fontSize || 14) + 2);
      updateStudio({ ...studio, fontSize: nextSz });
      playSound('click');
      setToastMsg({ text: `Font size increased to ${nextSz}px.`, ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('घटा') || act.includes('छोटा') || act.includes('decrease') || act.includes('small')) {
      const nextSz = Math.max(12, (studio.fontSize || 14) - 2);
      updateStudio({ ...studio, fontSize: nextSz });
      playSound('click');
      setToastMsg({ text: `Font size decreased to ${nextSz}px.`, ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    // 6. Border Beams
    if (act.includes('beam off') || act.includes('बीम बंद') || act.includes('बंद करो')) {
      updateStudio({ ...studio, beamMode: 'off' });
      playSound('click');
      setToastMsg({ text: 'Border beams turned Off.', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }
    if (act.includes('beam') || act.includes('बीम')) {
      updateStudio({ ...studio, beamMode: 'all' });
      playSound('chime');
      setToastMsg({ text: 'Animated border beams activated on all boxes!', ok: true });
      setTimeout(() => setToastMsg(null), 3500);
      return;
    }

    // 7. Page Navigation & Studio Tabs
    if (act.includes('dashboard') || act.includes('डैशबोर्ड')) {
      router.push('/customer/dashboard');
    } else if (act.includes('market') || act.includes('store') || act.includes('ऐप') || act.includes('मार्केट')) {
      router.push('/customer/marketplace');
    } else if (act.includes('profile') || act.includes('प्रोफाइल')) {
      router.push('/customer/profile');
    } else if (act.includes('security') || act.includes('passkey') || act.includes('पासकी') || act.includes('सिक्योरिटी')) {
      router.push('/customer/security');
    } else if (act.includes('brand') || act.includes('wallpaper') || act.includes('वॉलपेपर') || act.includes('logo') || act.includes('favicon')) {
      setStudioInitialTab('brand');
      setStudioOpen(true);
    } else if (act.includes('texture') || act.includes('टेक्सचर')) {
      setStudioInitialTab('textures');
      setStudioOpen(true);
    } else if (act.includes('font') || act.includes('फ़ॉन्ट')) {
      setStudioInitialTab('typography');
      setStudioOpen(true);
    } else if (act.includes('customizer') || act.includes('studio') || act.includes('theme') || act.includes('थीम') || act.includes('सेटिंग')) {
      setStudioInitialTab('themes');
      setStudioOpen(true);
    } else if (act.includes('sidebar') || act.includes('साइडबार')) {
      updateStudio({
        ...studio,
        sidebarMode: studio.sidebarMode === 'compact' ? 'expanded' : 'compact',
      });
    } else if (act.includes('zen') || act.includes('ज़ेन')) {
      updateStudio({
        ...studio,
        features: { ...studio.features, zenFocus: !studio.features.zenFocus },
      });
    } else if (act.includes('logout') || act.includes('signout') || act.includes('लॉगआउट') || act.includes('साइन आउट')) {
      handleLogout();
      return;
    } else {
      // Do NOT open blocking modal for conversational phrases; show helpful hint inline
      setAiTranscript(`Heard: "${actionCode}" — Try "Sell", "All Beams", "Dark Theme", "Marketplace"`);
      return;
    }

    if (customMsg) {
      setToastMsg({ text: customMsg, ok: true });
      setTimeout(() => setToastMsg(null), 3800);
    }
  };

  const processGeminiCommand = async (rawText: string) => {
    const clean = rawText.trim().toLowerCase();
    if (!clean) return;

    const smartPatterns = [
      'sale', 'सेल', 'express', 'invoice', 'बिल', 'रिकॉर्ड',
      'top nav', 'टॉप नेविगेशन', 'right nav', 'राइट', 'left nav', 'लेफ्ट',
      'remove border', 'no border', 'बॉर्डर हटा', 'show border', 'बॉर्डर दिखा',
      'full', 'फुल', 'center', 'सेंटर',
      'light', 'daylight', 'सफेद', 'लाइट', 'dark', 'obsidian', 'डार्क', 'काला',
      'blue', 'नीला', 'green', 'emerald', 'हरा', 'gold', 'गोल्ड',
      'times new roman', 'बढ़ा', 'बड़ा', 'घटा', 'छोटा', 'increase', 'decrease',
      'beam', 'बीम', 'dashboard', 'डैशबोर्ड', 'market', 'मार्केट', 'ऐप',
      'profile', 'प्रोफाइल', 'security', 'सिक्योरिटी', 'पासकी',
      'wallpaper', 'वॉलपेपर', 'logo', 'favicon', 'texture', 'टेक्सचर',
      'theme', 'थीम', 'studio', 'customizer', 'सेटिंग', 'zen', 'ज़ेन',
      'sidebar', 'साइडबार', 'logout', 'लॉगआउट'
    ];

    if (smartPatterns.some((kw) => clean.includes(kw))) {
      playTukBeep('end');
      setAiTranscript(`✓ ${rawText}`);
      executeAIGuidedAction(clean, `AI Co-Pilot: "${rawText}"`);
      return;
    }

    setAiTranscript(`Gemini 3.7: "${rawText}"...`);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const tok =
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('kosisko_token');
      if (tok && tok !== 'null' && tok !== 'undefined') headers['Authorization'] = `Bearer ${tok}`;
      const did = getSharedDeviceId();
      if (did) headers['X-Device-ID'] = did;

      const res = await fetch('/api/v1/ai-intent/', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          transcript: rawText,
          app_state: { current_path: pathname },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        playTukBeep('end');
        executeAIGuidedAction(data.action || clean, data.message || `Gemini AI: ${rawText}`);
        setAiTranscript(`✓ ${data.message || rawText}`);
      } else {
        playTukBeep('end');
        executeAIGuidedAction(clean);
      }
    } catch {
      playTukBeep('end');
      executeAIGuidedAction(clean);
    }
  };

  useEffect(() => {
    if (!isMicListening) return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setToastMsg({ text: 'Speech recognition is supported in Google Chrome / Edge.', ok: false });
      setIsMicListening(false);
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = 'hi-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let silenceTimer: any = null;
    let latestText = '';
    let done = false;

    const finalizeSpeech = (textToRun: string) => {
      if (done) return;
      done = true;
      if (silenceTimer) clearTimeout(silenceTimer);
      try { recognition.stop(); } catch {}
      setIsMicListening(false);
      if (textToRun.trim()) processGeminiCommand(textToRun.trim());
    };

    recognition.onstart = () => {
      playTukBeep('start');
      done = false;
      latestText = '';
      setAiTranscript('Listening... Speak full command');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      const combined = (final || interim).trim();
      if (combined) {
        latestText = combined;
        setAiTranscript(`🎙️ ${combined}`);
      }

      if (final.trim()) {
        finalizeSpeech(final.trim());
        return;
      }

      if (combined.length > 1 && !done) {
        if (silenceTimer) clearTimeout(silenceTimer);
        // Wait 1100ms after user stops speaking so full Hindi/English words never cut off mid-syllable
        silenceTimer = setTimeout(() => {
          finalizeSpeech(latestText);
        }, 1100);
      }
    };

    recognition.onerror = () => {
      playTukBeep('error');
      setIsMicListening(false);
    };

    recognition.onend = () => {
      if (!done && latestText.trim()) {
        finalizeSpeech(latestText.trim());
      } else {
        setIsMicListening(false);
      }
    };

    try { recognition.start(); } catch { setIsMicListening(false); }
    return () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      try { recognition.stop(); } catch {}
    };
  }, [isMicListening]);


  // Auto-attach Custom Border Beam Pin toggles on all .os-card boxes across every page
  useEffect(() => {
    if (!isAuthorized) return;
    const attachPins = () => {
      document.querySelectorAll('.os-card').forEach((card) => {
        if (card.querySelector('.beam-pin-btn')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'beam-pin-btn';
        btn.title = 'Pin/Unpin Animated Border Beam on this Card';
        btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
        btn.onclick = (e) => {
          e.stopPropagation();
          card.classList.toggle('beam-pinned');
        };
        card.appendChild(btn);
      });
    };
    attachPins();
    const obs = new MutationObserver(() => attachPins());
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [isAuthorized, pathname]);

  // 6. Cursor Spotlight & Keyboard Shortcuts
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!studio.features.spotlight) return;
      const el = (e.target as HTMLElement)?.closest?.('.spotlight-target') as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', `${(e.clientX - rect.left).toFixed(1)}px`);
      el.style.setProperty('--mouse-y', `${(e.clientY - rect.top).toFixed(1)}px`);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        updateStudio({
          ...studio,
          sidebarMode: studio.sidebarMode === 'compact' ? 'expanded' : 'compact',
        });
      } else if (e.key === 'Escape') {
        setCmdOpen(false);
        setStudioOpen(false);
        setAvatarMenuOpen(false);
        setVoiceOpen(false);
      }
    };

    const onDocClick = (e: MouseEvent) => {
      if (avatarBoxRef.current && !avatarBoxRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onDocClick);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onDocClick);
    };
  }, [studio]);

  const handleLogout = () => {
    const did = typeof window !== 'undefined' ? localStorage.getItem('kosisko_device_id') || '' : '';
    const tok =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token') ||
          localStorage.getItem('token') ||
          localStorage.getItem('kosisko_token')
        : null;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (did) headers['X-Device-ID'] = did;
      if (tok) headers['Authorization'] = `Bearer ${tok}`;

      fetch('/api/v1/auth/session/self-logout', {
        method: 'POST',
        keepalive: true,
        credentials: 'include',
        headers,
        body: JSON.stringify({ device_id: did }),
      }).catch(() => {});

      fetch('/api/v1/auth/logout/', {
        method: 'POST',
        keepalive: true,
        credentials: 'include',
        headers,
      }).catch(() => {});
    } catch {}

    forceCleanLogout('logout=true');
  };

  if (isLoggingOut) return <div className="min-h-screen bg-[#07090E]" />;
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#07090E] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-amber-400/25 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  const activeModules = KOSISKO_OPERATIONAL_MODULES.filter((m) => {
    if (m.isCore) return true;
    if (!m.appCode) return false;
    const app = installedApps[m.appCode];
    return !!app && Date.now() < app.expiresAt;
  });

  const displayFirm = isWhiteLabeled ? customBrand.name : firmName || 'Enterprise Workspace';
  const isCompact = studio.sidebarMode === 'compact';
  const isFloating = studio.sidebarMode === 'floating';
  const navPos = studio.navPosition || 'left';

  const breadcrumbTitle =
    pathname === '/customer/profile'
      ? 'Profile Settings'
      : pathname === '/customer/security'
      ? 'Security Hub (FIDO2)'
      : pathname === '/customer/marketplace'
      ? 'App Marketplace'
      : activeModules.find((m) => pathname?.startsWith(m.href))?.name || 'Command Dashboard';

  return (
    <div className={`kosisko-os-shell h-dvh overflow-hidden flex ${navPos === 'right' ? 'flex-row-reverse' : 'flex-row'} relative`}>
      <div className="pointer-events-none fixed inset-0 bg-os-wallpaper z-0" />
      <div className="pointer-events-none fixed inset-0 bg-os-texture z-0" />

      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* OPERATIONAL SIDEBAR (LEFT / RIGHT / HIDDEN IN TOP-NAV MODE) */}
      <aside
        id="kosisko-business-sidebar"
        style={!isCompact && navPos !== 'top' ? { width: 'var(--sidebar-width)' } : undefined}
        className={`${navPos === 'top' ? 'lg:hidden' : ''} fixed lg:sticky top-0 ${
          navPos === 'right' ? 'right-0 border-l' : 'left-0 border-r'
        } bottom-0 z-50 h-screen zone-sidebar flex flex-col justify-between transition-all duration-200 flex-shrink-0 ${
          isMobileOpen
            ? 'translate-x-0 w-64 p-3.5'
            : navPos === 'right'
            ? 'translate-x-full lg:translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        } ${
          isCompact
            ? 'lg:w-[70px] lg:p-2.5'
            : isFloating
            ? 'lg:p-3.5 lg:m-3 lg:h-[calc(100vh-24px)] lg:rounded-2xl lg:border lg:shadow-2xl'
            : 'lg:p-3.5'
        }`}
      >
        <div className="space-y-4">
          <div
            className={`flex items-center ${isCompact ? 'justify-center' : 'justify-between'} px-1.5 pt-1 pb-3 border-b`}
            style={{ borderColor: 'var(--sidebar-border)' }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl bg-black/30 border flex items-center justify-center shrink-0"
                style={{
                  borderColor: 'rgba(var(--accent-rgb), 0.35)',
                  boxShadow: '0 0 18px -4px rgba(var(--accent-rgb), 0.45)',
                }}
              >
                {studio.customLogoUrl ? (
                  <img
                    src={studio.customLogoUrl}
                    alt={displayFirm}
                    className="w-full h-full object-contain rounded-lg p-0.5"
                  />
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 36 36" fill="none">
                    <circle
                      className="k-medallion-ring"
                      cx="18"
                      cy="18"
                      r="15"
                      stroke="var(--accent)"
                      strokeWidth="1.3"
                      strokeDasharray="60 18"
                      strokeLinecap="round"
                    />
                    <path d="M12.2 10.5V25.5" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
                    <path
                      d="M23.8 10.5L15.2 18L23.8 25.5"
                      stroke="var(--sidebar-text)"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="24.2" cy="18" r="1.9" fill="var(--accent)" />
                  </svg>
                )}
              </div>

              {!isCompact && (
                <div className="min-w-0">
                  <div className="text-[13px] font-extrabold tracking-tight text-sb-primary truncate leading-tight">
                    {displayFirm}
                  </div>
                  {!studio.features.whiteLabelBrand && (
                    <div className="inline-flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                      <span className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase text-os-accent">
                        KOSISKO • OS
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isCompact && (
              <button
                onClick={() => {
                  updateStudio({
                    ...studio,
                    sidebarMode: studio.sidebarMode === 'compact' ? 'expanded' : 'compact',
                  });
                  playSound('click');
                }}
                title="Compact Icon Rail"
                className="hidden lg:flex w-7 h-7 rounded-lg hover:bg-white/[0.08] text-sb-muted hover:text-sb-primary items-center justify-center cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                </svg>
              </button>
            )}
          </div>

          {!isCompact && (
            <div className="w-full relative">
              <BranchSwitcher />
            </div>
          )}

          <div className="space-y-1">
            {!isCompact && (
              <div className="px-2.5 pb-1 flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-sb-muted opacity-75">
                  OPERATIONAL MODULES
                </span>
                <span className="font-mono text-[9px] text-os-accent font-bold">
                  {activeModules.length} Live
                </span>
              </div>
            )}

            <nav className="space-y-1">
              {activeModules.map((mod) => {
                const active = pathname === mod.href || pathname?.startsWith(mod.href + '/');
                return (
                  <Link
                    key={mod.id}
                    href={mod.href}
                    onClick={() => {
                      setIsMobileOpen(false);
                      playSound('click');
                    }}
                    title={mod.name}
                    className={`spotlight-target flex items-center ${
                      isCompact ? 'justify-center px-2' : 'justify-between px-3'
                    } py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'pill-os-accent text-sb-primary'
                        : 'text-sb-muted hover:text-sb-primary hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={active ? 'text-os-accent' : ''}>
                        <VectorIcon name={mod.icon} />
                      </span>
                      {!isCompact && <span className="truncate">{mod.name}</span>}
                    </span>
                    {!isCompact && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="pt-3 border-t space-y-2.5" style={{ borderColor: 'var(--sidebar-border)' }}>
          {/* Merged Sidebar Bottom Gemini 3.7 AI COMMAND BAR */}
          {!isCompact ? (
            <div
              className="p-2.5 rounded-xl bg-black/25 border space-y-2"
              style={{ borderColor: 'rgba(var(--accent-rgb), 0.28)' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-extrabold uppercase tracking-wider text-os-accent">
                  AI COMMAND BAR
                </span>
                <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                  GEMINI 3.7
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!sidebarCmdInput.trim()) return;
                  const q = sidebarCmdInput;
                  setSidebarCmdInput('');
                  processGeminiCommand(q);
                }}
                className="flex items-center gap-1"
              >
                <input
                  type="text"
                  value={sidebarCmdInput}
                  onChange={(e) => setSidebarCmdInput(e.target.value)}
                  placeholder="Type command..."
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-os-input text-[11px] text-os-primary"
                />
                <button
                  type="submit"
                  title="Execute AI Command"
                  className="w-7 h-7 rounded-lg bg-os-accent text-xs font-extrabold flex items-center justify-center cursor-pointer shrink-0"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => setIsMicListening((prev) => !prev)}
                  title="Speak Hindi/English Voice Command"
                  className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer shrink-0 border ${
                    isMicListening
                      ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                      : 'bg-os-s2 text-os-accent border-os'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </button>
              </form>

              {aiTranscript && (
                <div className="font-mono text-[10px] text-sky-400 truncate">
                  {aiTranscript}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsMicListening((prev) => !prev)}
              title="Voice AI Command"
              className={`w-full py-2 rounded-xl flex items-center justify-center cursor-pointer border ${
                isMicListening ? 'bg-rose-500 text-white border-rose-400 animate-pulse' : 'bg-black/20 text-os-accent border-os'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              </svg>
            </button>
          )}


        </div>
      </aside>

      {/* RIGHT WORKSPACE COLUMN (INDEPENDENT SCROLL CONTAINER) */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-hidden">
        <header className="h-[62px] px-4 sm:px-6 zone-topbar border-b flex items-center justify-between gap-2.5 shrink-0 sticky top-0 z-30 backdrop-blur-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                if (window.innerWidth < 1024 || navPos === 'top') setIsMobileOpen((p) => !p);
                else {
                  updateStudio({
                    ...studio,
                    sidebarMode: studio.sidebarMode === 'compact' ? 'expanded' : 'compact',
                  });
                }
                playSound('click');
              }}
              className="w-8 h-8 rounded-lg bg-black/15 border text-tb-muted hover:text-tb-primary flex items-center justify-center cursor-pointer shrink-0"
              style={{ borderColor: 'var(--topbar-border)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="14" y2="17" />
              </svg>
            </button>

            {navPos === 'top' ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className="w-8 h-8 rounded-lg bg-black/30 border flex items-center justify-center shrink-0"
                    style={{ borderColor: 'rgba(var(--accent-rgb), 0.4)' }}
                  >
                    {studio.customLogoUrl ? (
                      <img src={studio.customLogoUrl} alt={displayFirm} className="w-full h-full object-contain rounded p-0.5" />
                    ) : (
                      <span className="font-extrabold text-xs text-os-accent">K</span>
                    )}
                  </div>
                  <span className="text-xs font-extrabold text-tb-primary truncate max-w-[140px]">
                    {displayFirm}
                  </span>
                </div>

                <nav className="hidden lg:flex items-center gap-1.5">
                  {activeModules.map((mod) => {
                    const active = pathname === mod.href || pathname?.startsWith(mod.href + '/');
                    return (
                      <Link
                        key={mod.id}
                        href={mod.href}
                        onClick={() => playSound('click')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${
                          active ? 'pill-os-accent text-tb-primary' : 'text-tb-muted hover:text-tb-primary hover:bg-white/[0.06]'
                        }`}
                      >
                        <VectorIcon name={mod.icon} className="w-3.5 h-3.5" />
                        <span>{mod.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs min-w-0">
                <span className="hidden sm:inline text-tb-muted font-medium">Workspace</span>
                <span className="hidden sm:inline text-tb-muted">/</span>
                <span className="font-bold text-tb-primary truncate">{breadcrumbTitle}</span>
              </div>
            )}
          </div>

          {studio.features.aiCopilot && (
            <div className="hidden xl:flex items-center gap-1.5 w-full max-w-xs">
              <button
                onClick={() => {
                  setCmdOpen(true);
                  playSound('click');
                }}
                className="flex-1 flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-black/20 border text-xs text-tb-muted hover:text-tb-primary cursor-pointer"
                style={{ borderColor: 'var(--topbar-border)' }}
              >
                <span className="truncate">Kosisko AI Co-Pilot</span>
                <kbd className="px-1.5 py-0.5 rounded bg-black/20 border font-mono text-[10px]">
                  Cmd+K
                </kbd>
              </button>
              <button
                onClick={() => {
                  setIsMicListening((p) => !p);
                  setVoiceOpen((p) => !p);
                }}
                title="Voice Neural Listener"
                className="w-8 h-8 rounded-xl bg-black/20 border text-os-accent flex items-center justify-center cursor-pointer"
                style={{ borderColor: 'var(--topbar-border)' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div
              className="hidden md:flex items-center p-0.5 rounded-xl bg-black/20 border font-mono text-[10px]"
              style={{ borderColor: 'var(--topbar-border)' }}
            >
              <span className="px-2 text-tb-muted font-semibold">Beams:</span>
              {(['off', 'hero', 'all', 'custom'] as const).map((bm) => (
                <button
                  key={bm}
                  onClick={() => {
                    updateStudio({ ...studio, beamMode: bm });
                    playSound('click');
                  }}
                  className={`px-2 py-1 rounded-lg cursor-pointer capitalize ${
                    studio.beamMode === bm ? 'bg-os-accent font-bold' : 'text-tb-muted hover:text-tb-primary'
                  }`}
                >
                  {bm === 'all' ? 'All Boxes' : bm === 'custom' ? 'Custom Pin' : bm}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setStudioInitialTab('themes');
                setStudioOpen(true);
                playSound('click');
              }}
              className="px-3 py-1.5 rounded-xl bg-os-accent text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Studio</span>
            </button>

            <button
              onClick={() => {
                updateStudio({
                  ...studio,
                  features: { ...studio.features, zenFocus: !studio.features.zenFocus },
                });
                playSound('click');
              }}
              title="Zen Focus Mode"
              className={`w-8 h-8 rounded-lg bg-black/15 border flex items-center justify-center cursor-pointer ${
                studio.features.zenFocus ? 'pill-os-accent' : 'text-tb-muted hover:text-tb-primary'
              }`}
              style={{ borderColor: 'var(--topbar-border)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>

            {/* Top-Right Profile Avatar Dropdown */}
            <div ref={avatarBoxRef} className="relative">
              <button
                onClick={() => {
                  setAvatarMenuOpen((p) => !p);
                  playSound('click');
                }}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-black/15 border cursor-pointer"
                style={{ borderColor: 'var(--topbar-border)' }}
              >
                <div
                  className="w-7 h-7 rounded-full p-[1.5px] relative shrink-0"
                  style={{ background: 'linear-gradient(135deg, var(--accent), #38BDF8)' }}
                >
                  <div className="w-full h-full rounded-full bg-os-base flex items-center justify-center text-[11px] font-extrabold text-os-primary">
                    {userInitials}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
                </div>
                {userFirstName && (
                  <span className="hidden md:inline text-xs font-semibold text-tb-primary">
                    {userFirstName}
                  </span>
                )}
              </button>

              {avatarMenuOpen && (
                <div className="absolute right-0 mt-2 w-[310px] max-w-[calc(100vw-24px)] os-popover overflow-hidden z-50">
                  <div className="p-4 border-b border-os">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-os-primary truncate">
                        {userFullName || displayFirm}
                      </p>
                      <span className="px-1.5 py-0.5 rounded pill-os-accent font-mono text-[9px] font-semibold uppercase">
                        Owner
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-os-muted truncate mt-1">{subdomainLabel}</p>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href="/customer/marketplace"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-semibold text-os-primary">App Marketplace</div>
                        <div className="text-[11px] text-os-muted">Install & manage ERP modules</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded pill-os-accent font-mono text-[9px] font-bold">
                        STORE
                      </span>
                    </Link>

                    <Link
                      href="/customer/profile"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-semibold text-os-primary">Profile Settings</div>
                        <div className="text-[11px] text-os-muted">Personal identity, firm & GSTIN</div>
                      </div>
                    </Link>

                    <Link
                      href="/customer/security"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-semibold text-os-primary">Security Hub (FIDO2)</div>
                        <div className="text-[11px] text-os-muted">Passkey vault & active sessions</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[9px] font-semibold">
                        PASSKEY
                      </span>
                    </Link>

                    <button
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        setStudioInitialTab('themes');
                        setStudioOpen(true);
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-white/[0.06] flex items-center justify-between text-left cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-semibold text-os-accent">Studio Customizer</div>
                        <div className="text-[11px] text-os-muted">Themes, colors, fonts & layout</div>
                      </div>
                    </button>
                  </div>

                  <div className="p-1.5 border-t border-os">
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 rounded-xl text-os-muted hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-between text-xs font-semibold cursor-pointer"
                    >
                      <span>Sign Out</span>
                      <span className="font-mono text-[10px] text-os-subtle">0ms Exit</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {voiceOpen && studio.features.aiCopilot && (
          <div className="px-4 sm:px-6 py-2.5 bg-os-s2 border-b border-os flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 h-5">
                <span className="voice-bar" />
                <span className="voice-bar" style={{ animationDelay: '140ms' }} />
                <span className="voice-bar" style={{ animationDelay: '280ms' }} />
              </div>
              <span className="text-xs font-semibold text-card-primary">
                Kosisko Voice Neural Listener Active
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  updateStudio({ ...studio, bgTexture: 'hex' });
                  setVoiceOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg pill-os-accent font-mono text-[10px] font-semibold cursor-pointer"
              >
                &quot;Hexagon Texture&quot;
              </button>
              <button
                onClick={() => {
                  updateStudio({ ...studio, beamMode: 'all' });
                  setVoiceOpen(false);
                }}
                className="px-2.5 py-1 rounded-lg pill-os-accent font-mono text-[10px] font-semibold cursor-pointer"
              >
                &quot;All Box Beams&quot;
              </button>
              <button
                onClick={() => setVoiceOpen(false)}
                className="px-2 py-1 rounded-lg bg-os-input text-os-muted font-mono text-[10px] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {studio.features.multiTab && (
          <div
            id="kosisko-multi-tab-bar"
            className="px-4 sm:px-6 py-1.5 bg-os-s1 border-b border-os flex items-center gap-1.5 overflow-x-auto whitespace-nowrap"
          >
            {[
              { label: 'Command Dashboard', href: '/customer/dashboard' },
              { label: 'App Marketplace', href: '/customer/marketplace' },
              { label: 'Profile Settings', href: '/customer/profile' },
              { label: 'Security Hub', href: '/customer/security' },
            ].map((t) => {
              const active = pathname === t.href;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                    active
                      ? 'pill-os-accent font-bold'
                      : 'bg-os-s2 border-os text-card-muted hover:text-card-primary'
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        )}

        {studio.features.pulseTicker && (
          <div
            id="kosisko-pulse-ticker"
            className="px-4 sm:px-6 py-1.5 bg-os-s1 border-b border-os flex items-center justify-between gap-4 font-mono text-[10px] text-card-muted overflow-x-auto whitespace-nowrap"
          >
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>CLUSTER ONLINE</span>
              </span>
              <span>
                WORKSPACE: <strong className="text-card-primary">{subdomainLabel}</strong>
              </span>
              <span>
                TEXTURE: <strong className="text-sky-400 uppercase">{studio.bgTexture}</strong>
              </span>
              <span>
                BORDER BEAMS: <strong className="text-os-accent uppercase">{studio.beamMode}</strong>
              </span>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {toastMsg && (
            <div
              className={`workspace-container mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                toastMsg.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <span>{toastMsg.text}</span>
              <button onClick={() => setToastMsg(null)} className="ml-4 font-bold cursor-pointer">✕</button>
            </div>
          )}
          {children}
        </main>
      </div>


      {/* Idle Inactivity Auto-Logout Countdown Modal */}
      {idleWarningSeconds !== null && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md os-popover p-6 text-center space-y-4">
            <span className="px-2.5 py-0.5 rounded-full pill-os-accent font-mono text-[10px] font-bold uppercase">
              INACTIVITY SECURITY LOCK
            </span>
            <h3 className="text-lg font-extrabold text-os-primary">
              Auto-Logout in {idleWarningSeconds}s
            </h3>
            <p className="text-xs text-os-muted leading-relaxed">
              No cursor or keyboard activity detected for {studio.idleLogoutMinutes ?? 30} minutes. Move your cursor or click below to stay signed in.
            </p>
            <div className="flex items-center justify-center gap-2.5 pt-1">
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-os-s2 border border-os text-xs font-semibold text-os-muted cursor-pointer"
              >
                Sign Out Now
              </button>
              <button
                onClick={() => {
                  lastActivityRef.current = Date.now();
                  setIdleWarningSeconds(null);
                }}
                className="px-5 py-2 rounded-xl bg-os-accent text-xs font-bold cursor-pointer"
              >
                Stay Signed In
              </button>
            </div>
          </div>
        </div>
      )}

      <KosiskoStudioDrawer
        isOpen={studioOpen}
        initialTab={studioInitialTab}
        studio={studio}
        onUpdate={updateStudio}
        onClose={() => setStudioOpen(false)}
        onPlaySound={playSound}
        onToast={(text, ok = true) => {
          setToastMsg({ text, ok });
          setTimeout(() => setToastMsg(null), 4000);
        }}
      />

      {cmdOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-16 p-4">
          <div className="w-full max-w-xl os-popover overflow-hidden">
            <div className="px-4 py-3.5 border-b border-os flex items-center gap-3">
              <input
                type="text"
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="Jump to Themes, Profile, Security Hub, App Marketplace..."
                className="w-full bg-transparent text-xs text-os-primary focus:outline-none"
              />
              <button
                onClick={() => setCmdOpen(false)}
                className="px-2 py-0.5 rounded bg-os-s2 border border-os font-mono text-[10px] text-os-muted cursor-pointer"
              >
                ESC
              </button>
            </div>
            <div className="p-2 space-y-1">
              {[
                { label: 'Browse 48 Pre-Defined Themes & Custom Saver', sub: 'Instant luxury, cyber & daylight themes', run: () => { setStudioInitialTab('themes'); setStudioOpen(true); } },
                { label: 'Open App Marketplace', sub: 'Install & manage ERP modules', run: () => router.push('/customer/marketplace') },
                { label: 'Go to Profile Settings', sub: 'Personal identity, firm & GSTIN', run: () => router.push('/customer/profile') },
                { label: 'Go to Security Hub (FIDO2)', sub: 'Passkey vault & active sessions', run: () => router.push('/customer/security') },
              ]
                .filter((x) => !cmdQuery.trim() || x.label.toLowerCase().includes(cmdQuery.toLowerCase()))
                .map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setCmdOpen(false);
                      item.run();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.06] text-left cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-os-primary">{item.label}</div>
                    <div className="text-[11px] text-os-muted">{item.sub}</div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
