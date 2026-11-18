'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CommandPalette from '@/components/CommandPalette';
import CustomizerPanel from '@/components/CustomizerPanel';
import { useTheme } from '@/context/ThemeContext';

export default function HomeCommandCenter() {
  const router = useRouter();
  const { themeConfig } = useTheme();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState('Operational (0.1ms Latency)');
  const [activeActionFeedback, setActiveActionFeedback] = useState('');

  // ⌨️ Keyboard Shortcut (Ctrl + K) to open Command Center
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectModule = (moduleCode: string) => {
    setActiveActionFeedback(`Launching module: ${moduleCode}...`);
    setIsCommandOpen(false);

    setTimeout(() => {
      router.push(`/dashboard?module=${moduleCode}`);
    }, 400);
  };

  const handleRunCommand = (command: any) => {
    setActiveActionFeedback(`Executing system command: ${command.title}`);
    setIsCommandOpen(false);

    if (command.id === 'customize_ui') {
      setIsCustomizerOpen(true);
    } else {
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">

      {/* 🌟 1. Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-[0_0_15px_rgba(0,243,255,0.4)]">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black tracking-wider text-white">
                Kosisko Ventures
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                Enterprise Cloud OS
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="hidden sm:flex px-4 py-2 bg-slate-900 border border-cyan-500/40 rounded-xl text-cyan-300 items-center gap-2 hover:bg-cyan-500/20 transition-all font-bold text-xs cursor-pointer shadow-lg"
          >
            <span>🔍 Command Hub</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-400">Ctrl + K</kbd>
          </button>

          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-slate-200 hover:text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md"
          >
            Login
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 rounded-xl font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.25)]"
          >
            Client Console
          </button>

          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all text-xs cursor-pointer"
            title="Customize UI"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* 🌟 2. Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-5xl mx-auto">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6 shadow-[0_0_20px_rgba(0,243,255,0.15)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          Next-Gen Enterprise Cloud ERP, IoT & Unified SaaS Platform
        </div>

        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
          Intelligent Infrastructure for <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-500">
            Modern Scalable Enterprises
          </span>
        </h2>

        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mb-10 leading-relaxed">
          Kosisko OS empowers high-growth operations with multi-tenant cloud architectures, real-time IoT hardware telemetry, automated billing pipelines, and AI-driven CRM workflows.
        </p>

        {activeActionFeedback && (
          <div className="mb-6 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold animate-pulse">
            {activeActionFeedback}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:scale-105 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-[0_0_25px_rgba(0,243,255,0.3)] cursor-pointer flex items-center gap-2"
          >
            <span>Launch Command Palette</span>
            <kbd className="px-2 py-0.5 bg-slate-900/30 rounded text-[10px] text-slate-900 font-extrabold">Ctrl + K</kbd>
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3.5 bg-slate-900 border border-white/15 hover:bg-white/5 text-slate-200 font-bold rounded-2xl text-sm transition-all cursor-pointer"
          >
            Explore System Dashboard &rarr;
          </button>
        </div>

        {/* 🌟 3. Product Offerings & Capabilities Grid (Crucial for Meta/Policy Verification) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-8 border-t border-white/10">
          
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/40 transition-all">
            <div className="text-2xl mb-3">🏢</div>
            <h3 className="text-white font-bold text-base mb-2">Cloud ERP & SaaS Workflows</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Multi-tenant architecture designed for seamless resource planning, multi-location inventory, and operational governance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/40 transition-all">
            <div className="text-2xl mb-3">📡</div>
            <h3 className="text-white font-bold text-base mb-2">IoT Telemetry & Rental Hub</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              End-to-end device tracking, water purification telemetry, predictive maintenance, and recurring equipment rental cycles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/40 transition-all">
            <div className="text-2xl mb-3">💬</div>
            <h3 className="text-white font-bold text-base mb-2">Omnichannel CRM & Messaging</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Automated customer communication powered by verified WhatsApp Cloud API, webhooks, and transactional delivery engines.
            </p>
          </div>

        </div>

      </main>

      {/* 🌟 4. Comprehensive Legal & Compliance Footer (Razorpay & Meta Ready) */}
      <footer className="w-full border-t border-white/10 bg-slate-950 px-6 py-8 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

          {/* बायाँ हिस्सा: कंपनी विवरण व संपर्क */}
          <div className="space-y-1">
            <div className="text-white font-bold text-sm tracking-wide">
              Kosisko Ventures Private Limited
            </div>
            <p className="text-slate-500 text-[11px] max-w-md">
              Ratan Flour Mill, In Front Of Sant Nirankari Bhawan, Binjhiya, Mandla, Madhya Pradesh 481661, India
            </p>
            <p className="text-slate-500 text-[11px]">
              Corporate Support: <a href="mailto:admin@kosisko.com" className="text-cyan-400 hover:underline">admin@kosisko.com</a> | Helpline: <span className="text-slate-300 font-semibold">+91 9203401296</span>
            </p>
          </div>

          {/* दायाँ हिस्सा: स्टेटस + 5 लीगल व कंप्लायंस लिंक्स + कॉपीराइट */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 self-stretch lg:self-auto border-t lg:border-t-0 border-white/10 pt-4 lg:pt-0">
            
            {/* सिस्टम स्टेटस */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium text-[11px]">Status: <span className="text-emerald-400 font-bold">{systemStatus}</span></span>
            </div>

            {/* 5 अनिवार्य लीगल पेजों के लिंक्स */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium">
              <a href="/terms" className="text-slate-400 hover:text-cyan-400 transition-colors">
                Terms & Conditions
              </a>
              <span className="text-slate-700">&bull;</span>
              <a href="/privacy-policy" className="text-slate-400 hover:text-cyan-400 transition-colors">
                Privacy Policy
              </a>
              <span className="text-slate-700">&bull;</span>
              <a href="/refund-policy" className="text-slate-400 hover:text-cyan-400 transition-colors">
                Refund Policy
              </a>
              <span className="text-slate-700">&bull;</span>
              <a href="/pricing" className="text-slate-400 hover:text-cyan-400 transition-colors">
                Pricing
              </a>
              <span className="text-slate-700">&bull;</span>
              <a href="/contact" className="text-slate-400 hover:text-cyan-400 transition-colors">
                Contact Us
              </a>
              <span className="text-slate-700">&bull;</span>
              <a href="/shipping-policy" className="text-slate-400 hover:text-cyan-400 transition-colors">
                Shipping & Delivery
              </a>
            </div>

            {/* कॉपीराइट */}
            <div className="text-slate-500 text-[10px]">
              &copy; 2026 Kosisko Ventures Pvt. Ltd. All rights reserved.
            </div>

          </div>

        </div>
      </footer>

      {/* Existing Modals */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onSelectModule={handleSelectModule}
        onRunCommand={handleRunCommand}
      />

      <CustomizerPanel
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
      />

    </div>
  );
}
