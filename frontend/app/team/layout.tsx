'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/team/dashboard', icon: 'bi-speedometer2' },
    { name: 'POS Billing', href: '/team/pos', icon: 'bi-receipt' },
    { name: 'CRM Pipeline', href: '/team/crm', icon: 'bi-people' },
    { name: 'App Marketplace', href: '/team/marketplace', icon: 'bi-shop' },
    { name: 'Theme Settings', href: '/team/settings', icon: 'bi-gear' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* 🧭 टीम पोर्टल साइडबार */}
      <aside className="w-64 bg-slate-900 border-r border-white/10 p-4 flex flex-col justify-between">
        <div>
          {/* कंपनी या टीम का लोगो/नाम */}
          <div className="flex items-center gap-3 mb-8 px-2 py-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-black text-slate-950 shadow-lg">
              TM
            </div>
            <div>
              <h1 className="font-black text-xs tracking-wider text-white">Tata Motors</h1>
              <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">Team Portal</span>
            </div>
          </div>

          {/* नेविगेशन लिंक्स */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <i className={`bi ${item.icon} text-base`}></i>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* नीचे टीम का स्टेटस */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400 font-bold">Workspace</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <p className="text-xs font-bold text-white truncate">Team Operations Active</p>
        </div>
      </aside>

      {/* मुख्य कंटेंट एरिया */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}