'use client';

import React from 'react';

export default function TeamDashboardPage() {
  return (
    <div>
      {/* 🏷️ टॉप हेडर */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Team Operations Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">Welcome back, Team Workspace Manager</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            System Live & Secure
          </span>
        </div>
      </div>

      {/* 📊 क्विक स्टेट्स ग्रिड (Quick Stats) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Active Modules</span>
          <div className="text-2xl font-black text-white">4 / 4</div>
          <span className="text-[10px] text-cyan-400 mt-2 inline-block font-semibold">100% Operational</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">POS Transactions</span>
          <div className="text-2xl font-black text-white">₹1,42,850</div>
          <span className="text-[10px] text-emerald-400 mt-2 inline-block font-semibold">+18% from yesterday</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">CRM Active Leads</span>
          <div className="text-2xl font-black text-white">384</div>
          <span className="text-[10px] text-amber-400 mt-2 inline-block font-semibold">12 Follow-ups pending</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-5 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">AI Swarm Status</span>
          <div className="text-2xl font-black text-white">99.4%</div>
          <span className="text-[10px] text-purple-400 mt-2 inline-block font-semibold">Optimized Accuracy</span>
        </div>
      </div>

      {/* 🚀 रीसेंट एक्टिविटी और शॉर्टकट सेक्शन */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* रीसेंट एक्टिविटी लॉग */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>⚡</span> Real-time Team Activity Stream
          </h3>
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white block mb-0.5">POS Billing Invoice #1042 Generated</span>
                <span className="text-slate-400 text-[10px]">Tata Motors Retail Desk - Instant Settlement</span>
              </div>
              <span className="text-emerald-400 font-mono font-bold">10 mins ago</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white block mb-0.5">New Lead Added to CRM Funnel</span>
                <span className="text-slate-400 text-[10px]">Enterprise Client - Fleet Management Inquiry</span>
              </div>
              <span className="text-cyan-400 font-mono font-bold">25 mins ago</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white block mb-0.5">App Marketplace Module Updated</span>
                <span className="text-slate-400 text-[10px]">Inventory & Stock AI synchronized</span>
              </div>
              <span className="text-amber-400 font-mono font-bold">1 hour ago</span>
            </div>
          </div>
        </div>

        {/* क्विक शॉर्टकट्स पैनल */}
        <div className="bg-slate-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Quick Shortcuts</h3>
            <div className="space-y-2.5">
              <a href="/team/marketplace" className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-between transition-all">
                <span>🏪 Browse App Store</span>
                <span>→</span>
              </a>
              <a href="/team/pos" className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-between transition-all">
                <span>🛒 Open POS Billing</span>
                <span>→</span>
              </a>
              <a href="/team/crm" className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-between transition-all">
                <span>👥 View CRM Leads</span>
                <span>→</span>
              </a>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <span className="text-[10px] text-slate-500 font-bold block">Kosisko Enterprise Core v3.7</span>
          </div>
        </div>
      </div>
    </div>
  );
}