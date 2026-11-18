import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-slate-900/80 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <Link href="/login" className="text-xs text-amber-400 font-bold hover:underline">
            ← Back to Portal
          </Link>
          <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">Transparent Plans</span>
        </div>

        <h1 className="text-3xl font-black text-white mb-2">Pricing & Subscription Plans</h1>
        <p className="text-xs text-slate-400 mb-8 font-mono">Simple, modular enterprise plans. Zero hidden charges.</p>

        <div className="grid md:grid-cols-2 gap-6 my-8">
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">Monthly Plan</span>
              <h3 className="text-xl font-bold text-white mt-4">POS & GST Billing</h3>
              <p className="text-xs text-slate-400 mt-2">Fast retail billing, GST invoicing, automated receipts, and inventory tracking.</p>
              <div className="text-2xl font-black text-white mt-4">₹1,999 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
            </div>
            <Link href="/login" className="mt-6 block text-center py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all">
              Get Started
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-white/10 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">Monthly Plan</span>
              <h3 className="text-xl font-bold text-white mt-4">CRM & Sales Pipeline</h3>
              <p className="text-xs text-slate-400 mt-2">Lead management, customer contacts, deal tracking, and automated communication logs.</p>
              <div className="text-2xl font-black text-white mt-4">₹2,499 <span className="text-xs text-slate-400 font-normal">/ month</span></div>
            </div>
            <Link href="/login" className="mt-6 block text-center py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all">
              Get Started
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-800/40 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full border border-purple-400/20">Enterprise Add-on</span>
            <h4 className="text-lg font-bold text-white mt-2">Custom White-Label Rights</h4>
            <p className="text-xs text-slate-400 mt-1">Remove all Kosisko branding. Use your own company name, logo, custom domain, and custom favicon.</p>
          </div>
          <div className="text-xl font-black text-white whitespace-nowrap">₹10,000 <span className="text-xs text-slate-400 font-normal">One-Time</span></div>
        </div>
      </div>
    </div>
  );
}
