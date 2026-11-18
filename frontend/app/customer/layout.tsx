'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import BranchSwitcher from '@/components/BranchSwitcher';
import DesignerToggle from '@/components/DesignerToggle';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isWhiteLabeled, customBrand, installedApps } = useApp();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // साइडबार स्टेट्स
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  useEffect(() => {
    const hasLoginCookie = document.cookie
      .split('; ')
      .some((row) => row.startsWith('kosisko_logged_in=true'));

    if (!hasLoginCookie) {
      window.location.replace('/login');
      return;
    }

    setIsAuthorized(true);
  }, []);

  // कीबोर्ड शॉर्टकट: Ctrl + B / Cmd + B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktopOpen, isMobileOpen]);

  useEffect(() => { router.prefetch('/login'); }, [router]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    const did = typeof window !== 'undefined' ? localStorage.getItem('kosisko_device_id') || '' : '';
    const tok = typeof window !== 'undefined'
      ? (localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('kosisko_token'))
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
    } catch (err) {}

    document.cookie = 'kosisko_logged_in=; path=/; domain=.kosisko.com; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = 'kosisko_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    sessionStorage.clear();
    sessionStorage.setItem('kosisko_splash_played', '1');
    localStorage.clear();
    if (did) localStorage.setItem('kosisko_device_id', did);
    sessionStorage.setItem('kosisko_logout_active', 'true');
    sessionStorage.setItem('kosisko_splash_played', '1');
    window.location.replace('/login?logout=true');
  };

  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsDesktopOpen((prev) => !prev);
    } else {
      setIsMobileOpen((prev) => !prev);
    }
  };

  if (isLoggingOut) {
    return <div className="min-h-screen bg-[#020617]" />;
  }
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-3">
        <div className="relative flex items-center justify-center w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
        </div>
      </div>
    );
  }

  const currentBrandName = isWhiteLabeled ? customBrand.name : 'Kosisko';

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* 📱 मोबाइल बैकड्रॉप ओवरले */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* 🌟 फुल-हाइट साइडबार (Top to Bottom) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 h-screen bg-slate-900 border-r border-white/10 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none flex-shrink-0 ${
          isMobileOpen ? 'translate-x-0 w-72 max-w-[85vw] p-5 sm:p-6' : '-translate-x-full lg:translate-x-0'
        } ${
          isDesktopOpen
            ? 'lg:w-72 lg:p-6 lg:opacity-100'
            : 'lg:w-0 lg:p-0 lg:opacity-0 lg:overflow-hidden lg:border-none'
        }`}
      >
        <div className="min-w-[230px]">
          {/* साइडबार हेडर: बिल्कुल सेंटर अलाइन्ड ब्रांड + राइट कॉर्नर टॉगल */}
          <div className="relative flex items-center justify-between pb-5 mb-6 border-b border-white/10">
            {/* सेंटर बैलेंस करने हेतु खाली स्पेस */}
            <div className="w-10" />

            {/* सेंटर ब्रांड टेक्स्ट */}
            <div className="text-center flex-1 px-1">
              <h2 className="text-base font-black text-white tracking-wider leading-tight uppercase">
                {currentBrandName}
              </h2>
              <p className="text-[10px] text-amber-400 font-bold tracking-widest uppercase mt-0.5">
                Workspace Portal
              </p>
            </div>

            {/* ऊपरी दाएँ कोने में टॉगल बटन */}
            <div className="w-10 flex justify-end">
              <DesignerToggle isOpen={true} onToggle={handleToggle} />
            </div>
          </div>

          <nav className="space-y-2">
            <Link
              href="/customer/dashboard"
              onClick={() => setIsMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition-all"
            >
              📊 Dashboard
            </Link>

            <div className="my-5 w-full relative">
              <BranchSwitcher />
            </div>

            {installedApps['pos'] && Date.now() < installedApps['pos'].expiresAt && (
              <Link
                href="/customer/pos"
                onClick={() => setIsMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all"
              >
                🧾 POS & GST Billing
              </Link>
            )}

            {installedApps['crm'] && Date.now() < installedApps['crm'].expiresAt && (
              <Link
                href="/customer/crm"
                onClick={() => setIsMobileOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all"
              >
                📈 CRM & Sales Pipeline
              </Link>
            )}

            <Link
              href="/customer/marketplace"
              onClick={() => setIsMobileOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-xs font-bold text-cyan-400 hover:bg-cyan-500/10 transition-all mt-4 border border-cyan-500/20"
            >
              ⚡ App Marketplace
            </Link>

          <a
            href="/profile"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all mb-1"
          >
            <span>🔐</span>
            <span>Profile & Security</span>
          </a>

          </nav>
        </div>

        {/* फ़ूटर व लॉगआउट */}
        <div className="border-t border-white/10 pt-4 mt-auto min-w-[230px]">
          <button
            onClick={handleLogout}
            suppressHydrationWarning
            className="w-full mb-3 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            <span>Logout System</span>
          </button>

          <p className="text-[10px] text-slate-500 font-bold text-center">
            {isWhiteLabeled ? '🌟 White-Label Active' : 'Powered by Kosisko'}
          </p>
        </div>
      </aside>

      {/* 🚀 मुख्य क्षेत्र */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* हेडर बार */}
        <header className="h-16 border-b border-white/10 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 w-full transition-all duration-300">
          
          {/* बायाँ हिस्सा: साइडबार हाइड होने पर टॉगल के ठीक बगल में ब्रांड नाम */}
          <div className="flex items-center gap-3">
            {!isDesktopOpen && (
              <div className="hidden lg:flex items-center gap-3 animate-fadeIn">
                <DesignerToggle isOpen={false} onToggle={handleToggle} />
                <div className="flex flex-col">
                  <h1 className="text-sm font-black text-white tracking-tight leading-none">
                    {currentBrandName}
                  </h1>
                  <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase mt-0.5 leading-none">
                    Workspace Portal
                  </p>
                </div>
              </div>
            )}

            {/* मोबाइल व्यू */}
            <div className="flex items-center gap-3 lg:hidden">
              <DesignerToggle isOpen={isMobileOpen} onToggle={handleToggle} />
              {!isMobileOpen && (
                <div className="flex flex-col">
                  <h1 className="text-sm font-black text-white tracking-tight leading-none">
                    {currentBrandName}
                  </h1>
                  <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase mt-0.5 leading-none">
                    Workspace Portal
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* मध्य हिस्सा: 100% खाली और साफ़ */}
          <div className="flex-1" />

          {/* दायाँ हिस्सा: स्टेटस और प्रोफ़ाइल अवतार */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>

            <div
              title="Profile"
              className="group relative flex items-center justify-center w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-400 via-indigo-500 to-cyan-400 hover:scale-105 transition-transform duration-200 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                <svg
                  className="w-5 h-5 text-slate-300 group-hover:text-amber-400 transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
            </div>
          </div>
        </header>

        {/* 💻 पेज का मुख्य कंटेंट */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
