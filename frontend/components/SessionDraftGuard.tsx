'use client';

import React, { useEffect, useState } from 'react';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  const tok =
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('kosisko_token');
  return tok && tok !== 'null' && tok !== 'undefined' ? tok : null;
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getSharedDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let did = getCookieValue('kosisko_device_id') || localStorage.getItem('kosisko_device_id');
  if (!did || did === 'null' || did === 'undefined') {
    did = 'dev_' + Math.random().toString(36).substring(2, 14) + Date.now().toString(36);
  }
  localStorage.setItem('kosisko_device_id', did);
  const domainAttr = window.location.hostname.endsWith('kosisko.com') ? '; domain=.kosisko.com' : '';
  document.cookie = `kosisko_device_id=${did}; path=/; max-age=31536000; SameSite=Lax${domainAttr}`;
  return did;
}

if (typeof window !== 'undefined') {
  getSharedDeviceId();
}

export default function SessionDraftGuard() {
  const [banner, setBanner] = useState<{ text: string; type: 'warn' | 'info' } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const deviceId = getSharedDeviceId();
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    if (pathname.startsWith('/login') && searchParams.get('reason') === 'session_terminated') {
      setBanner({
        text: 'Security Alert: Your session on this device was terminated remotely from another device. Any unsaved form drafts have been preserved.',
        type: 'warn',
      });
      window.history.replaceState({}, '', '/login');
      return;
    }

    const notifySelfLogout = () => {
      const tok = getStoredToken();
      try {
        fetch('/api/v1/auth/session/self-logout', {
          method: 'POST',
          keepalive: true,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Device-ID': deviceId,
            ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
          },
          body: JSON.stringify({ device_id: deviceId }),
        }).catch(() => {});
      } catch (e) {}
    };

    const origRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (key: string) {
      if (this === window.localStorage && (key === 'access_token' || key === 'token' || key === 'kosisko_token')) {
        notifySelfLogout();
      }
      return origRemoveItem.apply(this, [key]);
    };

    const isInsideWorkspace = pathname.startsWith('/customer') || pathname.startsWith('/profile');
    const hasAuth = document.cookie.includes('kosisko_logged_in=true') || Boolean(getStoredToken());

    if (!isInsideWorkspace || !hasAuth) {
      return () => {
        Storage.prototype.removeItem = origRemoveItem;
      };
    }

    const draftKey = `kosisko_draft_${pathname}`;
    try {
      const savedRaw = localStorage.getItem(draftKey);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000 && parsed.fields) {
          setTimeout(() => {
            let restored = 0;
            Object.entries(parsed.fields).forEach(([k, v]) => {
              const el = document.querySelector(`[name="${k}"], #${CSS.escape(k)}`) as
                | HTMLInputElement
                | HTMLTextAreaElement
                | HTMLSelectElement
                | null;
              if (el && typeof v === 'string' && !el.value) {
                el.value = v;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                restored++;
              }
            });
            if (restored > 0) {
              setBanner({
                text: 'Draft Safeguard: Your unsaved work from the terminated session has been restored.',
                type: 'info',
              });
            }
            localStorage.removeItem(draftKey);
          }, 600);
        } else {
          localStorage.removeItem(draftKey);
        }
      }
    } catch (e) {}

    let isKickingOut = false;
    const forceKickOut = () => {
      if (isKickingOut || window.location.pathname.startsWith('/login')) return;
      isKickingOut = true;

      try {
        const fields: Record<string, string> = {};
        document.querySelectorAll('input, textarea, select').forEach((node, i) => {
          const el = node as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
          if (el.type === 'password' || el.type === 'hidden' || el.type === 'file') return;
          const k = el.name || el.id || `f_${i}`;
          if (el.value && el.value.trim() !== '') fields[k] = el.value;
        });
        if (Object.keys(fields).length > 0) {
          localStorage.setItem(`kosisko_draft_${window.location.pathname}`, JSON.stringify({ timestamp: Date.now(), fields }));
        }
      } catch (e) {}

      document.cookie = 'kosisko_logged_in=; Max-Age=0; path=/; domain=.kosisko.com';
      document.cookie = 'kosisko_logged_in=; Max-Age=0; path=/';
      origRemoveItem.apply(window.localStorage, ['access_token']);
      origRemoveItem.apply(window.localStorage, ['refresh_token']);
      origRemoveItem.apply(window.localStorage, ['token']);
      origRemoveItem.apply(window.localStorage, ['kosisko_token']);

      window.location.replace('/login?reason=session_terminated');
    };

    const sendHeartbeat = async () => {
      if (document.visibilityState !== 'visible' || window.location.pathname.startsWith('/login')) return;
      const token = getStoredToken();
      if (!token && !document.cookie.includes('kosisko_logged_in=true')) return;

      try {
        const headers: Record<string, string> = { 'X-Device-ID': deviceId };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const r = await fetch('/api/v1/auth/passkey/status', {
          credentials: 'include',
          headers,
        });
        if (r.status === 401) {
          const d = await r.json();
          if (d && d.session_revoked === true) {
            forceKickOut();
          }
        }
      } catch (e) {}
    };

    sendHeartbeat();
    const timer = setInterval(sendHeartbeat, 4000);
    const onVisChange = () => {
      if (document.visibilityState === 'visible') sendHeartbeat();
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      Storage.prototype.removeItem = origRemoveItem;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  if (!banner) return null;

  return (
    <div
      className={`fixed top-5 right-5 z-[99999] max-w-md p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 text-xs font-semibold ${
        banner.type === 'warn'
          ? 'bg-rose-950/95 border-rose-500 text-rose-200'
          : 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
      }`}
    >
      <span className="text-lg leading-none">{banner.type === 'warn' ? '⚠️' : '🛡️'}</span>
      <span className="flex-1 leading-relaxed">{banner.text}</span>
      <button
        onClick={() => setBanner(null)}
        className="opacity-70 hover:opacity-100 font-bold ml-2 cursor-pointer text-sm"
      >
        ✕
      </button>
    </div>
  );
}
