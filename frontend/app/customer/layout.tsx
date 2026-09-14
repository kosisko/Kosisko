'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isWhiteLabeled, customBrand, installedApps } = useApp();
  
  // 🌟 स्टेट जो तय करेगा कि पेज खुलेगा या नहीं
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. तुरंत चेक करें कि क्या टोकन मौजूद है और यूजर ने लॉगआउट नहीं किया है
    const token = localStorage.getItem('authToken');
    const isLoggedOut = sessionStorage.getItem('kosisko_logout_active');

    if (!token || isLoggedOut === 'true') {
      // अगर टोकन नहीं है या लॉगआउट किया है, तो सीधे लॉगिन पर भेजें
      window.location.replace('/login?logout=true');
    } else {
      // अगर सब कुछ सही है, तो ऑथराइज्ड मानकर दरवाजा खोल दें
      setIsAuthorized(true);
    }

    // 2. बैक बटन के कैश को रोकने का नियम
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  // 🛑 जब तक ऑथेंटिकेशन वेरीफाई हो रहा है, तब तक हल्का सा लोडिंग दिखाए (लूप नहीं बनने देगा)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs font-sans">
        Authenticating Secure Session...
      </div>
    );
  }

  // 🚪 सुपर-पावरफुल लॉगआउट फंक्शन
  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Logout error', err);
    }
    
    // 1. लॉगआउट फ्लैग सेट करें
    sessionStorage.setItem('kosisko_logout_active', 'true');
    
    // 2. सब कुछ साफ़ करें
    localStorage.clear();
    
    // 3. लॉगिन पर भेजें
    window.location.replace('/login?logout=true');
  };

  const currentBrandName = isWhiteLabeled ? customBrand.name : 'Kosisko';
  const currentLogoText = isWhiteLabeled ? customBrand.logoText : 'K';

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="w-64 bg-slate-900 border-r border-white/10 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-cyan-500/20">
              {currentLogoText}
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">{currentBrandName}</h2>
              <p className="text-[10px] text-slate-400">Workspace Portal</p>
            </div>
          </div>

          <nav className="space-y-2">
            <Link href="/customer/dashboard" className="block px-4 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition-all">
              📊 Dashboard
            </Link>

            {installedApps['pos'] && Date.now() < installedApps['pos'].expiresAt && (
              <Link href="/customer/pos" className="block px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all">
                🧾 POS & GST Billing
              </Link>
            )}

            {installedApps['crm'] && Date.now() < installedApps['crm'].expiresAt && (
              <Link href="/customer/crm" className="block px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-all">
                📈 CRM & Sales Pipeline
              </Link>
            )}

            <Link href="/customer/marketplace" className="block px-4 py-2.5 rounded-xl text-xs font-bold text-cyan-400 hover:bg-cyan-500/10 transition-all mt-4 border border-cyan-500/20">
              ⚡ App Marketplace
            </Link>
          </nav>
        </div>

        <div className="border-t border-white/10 pt-4 mt-auto">
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

      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}