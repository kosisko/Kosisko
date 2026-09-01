'use client';

import React from 'react';

export default function AdminDashboardPage() {
  return (
    <div>
      {/* 🏷️ टॉप हेडर */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Super Admin Control Center</h2>
          <p className="text-xs text-slate-400 mt-0.5">Master overview of Kosisko Enterprise OS & AI Kernels</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          Root Access Granted
        </span>
      </div>

      {/* 📊 ग्लोबल स्टेट्स ग्रिड */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Total Organizations</span>
          <div className="text-2xl font-black text-white">12 Active</div>
          <span className="text-[10px] text-emerald-400 mt-2 inline-block font-semibold">Tata Motors, Reliance, etc.</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">AI API Calls (Today)</span>
          <div className="text-2xl font-black text-white">24,890</div>
          <span className="text-[10px] text-cyan-400 mt-2 inline-block font-semibold">Gemini 3.7 Flash Optimized</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Server Health</span>
          <div className="text-2xl font-black text-emerald-400">99.9%</div>
          <span className="text-[10px] text-slate-400 mt-2 inline-block font-semibold">Zero 503 Errors Reported</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Active Revenue</span>
          <div className="text-2xl font-black text-white">₹8.4L / mo</div>
          <span className="text-[10px] text-amber-400 mt-2 inline-block font-semibold">+22% growth</span>
        </div>
      </div>

      {/* 🚀 एआई और सिस्टम कंट्रोल पैनल */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gemini API कंट्रोल */}
        <div className="bg-slate-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>🧠</span> Gemini AI Core Status
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Model currently bound to <strong className="text-white">gemini-3.7-flash</strong> with automatic fallback heuristics enabled for high-demand filtering.
            </p>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Rate Limit Threshold:</span>
                <span className="font-bold text-emerald-400">Normal (Safe)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Local Fallback Rules:</span>
                <span className="font-bold text-cyan-400">Active (Zero Downtime)</span>
              </div>
            </div>
          </div>
          <button className="mt-6 w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all">
            Purge AI Cache & Restart Kernel
          </button>
        </div>

        {/* क्विक मास्टर एक्शंस */}
        <div className="bg-slate-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Master Quick Actions</h3>
            <div className="space-y-2.5">
              <a href="/admin/marketplace-manage" className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-between transition-all">
                <span>📦 Deploy New App to Marketplace</span>
                <span>→</span>
              </a>
              <a href="/admin/users" className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-between transition-all">
                <span>👥 Manage Enterprise Tenants</span>
                <span>→</span>
              </a>
              <a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noopener noreferrer" className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-amber-400 flex items-center justify-between transition-all">
                <span>🔧 Open Raw Django DB Admin</span>
                <span>↗</span>
              </a>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <span className="text-[10px] text-slate-500 font-bold block">Kosisko Security Protocol: Secured via JWT & Django Backend</span>
          </div>
        </div>
      </div>
    </div>
  );
}