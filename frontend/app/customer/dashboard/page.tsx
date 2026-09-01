'use client';

import React from 'react';

export default function CustomerDashboardPage() {
  return (
    <div>
      {/* 🏷️ स्वागत संदेश */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Customer Portal Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage your active subscriptions, apps, and services</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
          Active Plan: Enterprise Pro
        </span>
      </div>

      {/* 📊 कस्टमर स्टेट्स ग्रिड */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Active Modules</span>
          <div className="text-2xl font-black text-white">2 Subscribed</div>
          <span className="text-[10px] text-cyan-400 mt-2 inline-block font-semibold">POS & CRM Enabled</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Billing Status</span>
          <div className="text-2xl font-black text-emerald-400">Paid</div>
          <span className="text-[10px] text-slate-400 mt-2 inline-block font-semibold">Next renewal on 1st Sep</span>
        </div>

        <div className="bg-slate-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">AI Voice Credits</span>
          <div className="text-2xl font-black text-white">Unlimited</div>
          <span className="text-[10px] text-purple-400 mt-2 inline-block font-semibold">Pro Tier Access</span>
        </div>
      </div>

      {/* 🛒 माय ऐप्स और सर्विसेज */}
      <div className="bg-slate-900/70 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
        <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">My Subscribed Services</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm text-white">POS & GST Billing Module</h4>
              <p className="text-xs text-slate-400">Fast retail billing and automated invoice generation</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              Active
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-sm text-white">CRM & Sales Pipeline</h4>
              <p className="text-xs text-slate-400">Lead management and customer tracking system</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}