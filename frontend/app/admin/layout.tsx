'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const adminNavItems = [
    { name: 'System Overview', href: '/admin/dashboard', icon: 'bi-speedometer2' },
    { name: 'AI Engine (Gemini 3.7)', href: '/admin/ai-control', icon: 'bi-cpu' },
    { name: 'User & Team Mgmt', href: '/admin/users', icon: 'bi-people-fill' },
    { name: 'App Marketplace Control', href: '/admin/marketplace-manage', icon: 'bi-shop' },
    { name: 'Global Settings', href: '/admin/settings', icon: 'bi-gear-fill' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* 🧭 सुपर एडमिन साइडबार */}
      <aside className="w-64 bg-slate-900 border-r border-red-500/20 p-4 flex flex-col justify-between">
        <div>
          {/* ब्रैंडिंग */}
          <div className="flex items-center gap-3 mb-8 px-2 py-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-black text-slate-950 shadow-lg shadow-red-500/20">
              KA
            </div>
            <div>
              <h1 className="font-black text-xs tracking-wider text-white">Kosisko Core</h1>
              <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest">Super Admin</span>
            </div>
          </div>

          {/* नेविगेशन लिंक्स */}
          <nav className="space-y-1.5">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-red-500 text-slate-950 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
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

        {/* सिस्टम स्टेटस बॉक्स */}
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-red-400 font-bold uppercase">Master Engine</span>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          </div>
          <p className="text-xs font-bold text-white truncate">Gemini 3.7 Flash Active</p>
        </div>
      </aside>

      {/* मुख्य कंटेंट एरिया */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}