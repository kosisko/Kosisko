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
  const [systemStatus, setSystemStatus] = useState('Online (0.1ms Latency)');
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

  // 🎯 Command Palette से किसी भी मॉड्यूल या कमांड को चुनने पर यह काम करेगा
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 selection:bg-cyan-500 selection:text-slate-950">

      {/* 🌟 Top Navigation Header */}
      <header className="flex justify-between items-center w-full border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping"></div>
          <h1 className="text-lg font-black tracking-wider text-white">
            {themeConfig.enterpriseName || 'Tata Motors Enterprises'}
          </h1>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
            {themeConfig.godModeLabel || 'v1.0 3D Master'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="px-4 py-2 bg-slate-900 border border-cyan-500/40 rounded-xl text-cyan-300 flex items-center gap-2 hover:bg-cyan-500/20 transition-all font-bold text-xs cursor-pointer shadow-lg"
          >
            <span>🔍 Search / Commands</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-400">Ctrl + K</kbd>
          </button>

          <button
            onClick={() => setIsCustomizerOpen(true)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all font-bold text-xs cursor-pointer"
          >
            ⚙️ Customize UI
          </button>
        </div>
      </header>

      {/* 🌟 Center Command Hub Body */}
      <main className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-auto py-12">
        <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-4 tracking-wide shadow-[0_0_20px_rgba(0,243,255,0.15)]">
          ✨ Hyper-Personalized Spatial Workspace Active
        </span>

        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
          Welcome to Kosisko <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">
            Command Center
          </span>
        </h2>

        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Press <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300">Ctrl + K</kbd> to open the Global Spotlight Palette, launch modules, or click the buttons below to navigate.
        </p>

        {activeActionFeedback && (
          <div className="mb-6 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold animate-pulse">
            {activeActionFeedback}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:scale-105 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-[0_0_25px_rgba(0,243,255,0.3)] cursor-pointer"
          >
            Launch Command Palette
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-slate-900 border border-white/10 hover:bg-white/5 text-slate-200 font-bold rounded-2xl text-sm transition-all cursor-pointer"
          >
            Open Full Dashboard
          </button>
        </div>
      </main>

      {/* 🌟 Bottom Status Bar & Copyright + Privacy Policy Footer */}
      <footer className="w-full flex flex-col sm:flex-row justify-between items-center border-t border-white/10 pt-4 text-xs text-slate-500 gap-2">
        <div>
          System Status: <span className="text-emerald-400 font-bold">{systemStatus}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>&copy; 2026 Kosisko. All Rights Reserved.</span>
          <span>&bull;</span>
          <a href="/privacy-policy" className="text-cyan-400 hover:underline font-semibold">
            Privacy Policy
          </a>
        </div>
      </footer>

      {/* Command Palette & Customizer Modals */}
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
