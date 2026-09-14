'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import CommandPalette from '@/components/CommandPalette';
import CustomizerPanel from '@/components/CustomizerPanel';
import { useTheme } from '@/context/ThemeContext';

const Spatial3DCanvas = dynamic(() => import('@/components/Spatial3DCanvas'), { ssr: false });
const EChartsAnalytics = dynamic(() => import('@/components/EChartsAnalytics'), { ssr: false });

export default function MasterEnterpriseDashboard() {
  const { themeConfig, updateConfig } = useTheme();

  const [activeModule, setActiveModule] = useState('iot_telemetry');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [widgetLayout, setWidgetLayout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // 🎙️ Gemini Autonomous AI & Command States
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [voiceErrorMsg, setVoiceErrorMsg] = useState('');
  const [sidebarCommandInput, setSidebarCommandInput] = useState('');

  // 🔔 प्रीमियम ऑडियो फीडबैक ('टुक' साउंड जेनरेटर)
  const playBeepSound = (type: 'start' | 'end' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      if (type === 'start') {
        oscillator.frequency.setValueAtTime(650, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.06);
      } else if (type === 'end') {
        oscillator.frequency.setValueAtTime(450, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.06);
      } else {
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.12);
      }
    } catch (e) {
      // AudioContext blocked/unsupported fallback
    }
  };

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

  // 🎙️ Robust Speech Recognition Engine with Audio Feedback & Timeout
  useEffect(() => {
    let recognitionInstance: any = null;
    let silenceTimer: any = null;

    if (isVoiceActive) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser. Please use Google Chrome.");
        setIsVoiceActive(false);
        return;
      }

      recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'hi-IN';
      recognitionInstance.interimResults = true;
      recognitionInstance.continuous = true;
      recognitionInstance.maxAlternatives = 3;

      let processingDone = false;

      recognitionInstance.onstart = () => {
        playBeepSound('start'); // 🔔 माइक चालू होने पर 'टुक' साउंड
        processingDone = false;
        setSpokenTranscript('Listening... Speak naturally.');
        setVoiceErrorMsg('');
      };

      recognitionInstance.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = final || interim;
        if (currentText) {
          setSpokenTranscript(currentText);
        }

        const textToProcess = (final || interim).trim();

        // ⚡ INSTANT TRIGGER: अगर यूजर ने बोल दिया है, तो ज़रा भी इंतज़ार न करें!
        if (textToProcess.length > 1 && !processingDone) {
          if (silenceTimer) clearTimeout(silenceTimer);
          
          // जैसे ही कोई स्पष्ट शब्द मिले, तुरंत बिना 1 सेकंड रुके प्रोसेस करें (0.2 सेकंड का शार्प कटऑफ़)
          silenceTimer = setTimeout(() => {
            if (!processingDone) {
              processingDone = true;
              try { recognitionInstance.stop(); } catch (e) {}
              processVoiceWithGeminiAI(textToProcess);
              setIsVoiceActive(false);
            }
          }, 200); // ⚡ इसे 1500ms से घटाकर सिर्फ 200ms कर दिया है!
        }
      };

      recognitionInstance.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          playBeepSound('error');
          setVoiceErrorMsg(`Speech error: ${event.error}`);
        }
      };

      recognitionInstance.onend = () => {
        if (!spokenTranscript || spokenTranscript === 'Listening... Speak naturally.') {
          playBeepSound('error');
          setVoiceErrorMsg('Try again (No speech detected).');
        }
        setIsVoiceActive(false);
      };

      try {
        recognitionInstance.start();
      } catch (err) {
        console.error("Mic start error:", err);
        setIsVoiceActive(false);
      }
    }

    return () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (recognitionInstance) {
        try { recognitionInstance.stop(); } catch (e) {}
      }
    };
  }, [isVoiceActive]);

  // 🧠 Autonomous Self-Learning Memory & Hybrid Dispatcher (Instant 0-Sec Execution)
  const processVoiceWithGeminiAI = async (inputText: string) => {
    const cleanInput = inputText.toLowerCase().trim();

    // ⚡ LAYER 1: Hardcoded / Fast-Path
    const fastPathActions: { [key: string]: string } = {
      'डैशबोर्ड': 'open_dashboard',
      'dashboard': 'open_dashboard',
      'सेटिंग्स': 'open_customizer',
      'customizer': 'open_customizer',
      'खोजो': 'open_search',
      'search': 'open_search',
      'सर्च': 'open_search',
      'साइडबार': 'toggle_sidebar',
    };

    if (fastPathActions[cleanInput]) {
      playBeepSound('end');
      executeAIGuidedAction({ action: fastPathActions[cleanInput], message: "Instant Fast-Path Executed" });
      setSpokenTranscript(`⚡ Fast-Path: [${fastPathActions[cleanInput]}]`);
      return;
    }

    // 🧠 LAYER 2: Local Memory & Self-Learned Dictionary Check (0 सेकंड में रिस्पॉन्स)
    const savedMemory = localStorage.getItem('ai_learned_memory');
    const memory = savedMemory ? JSON.parse(savedMemory) : {};

    if (memory[cleanInput]) {
      playBeepSound('end');
      executeAIGuidedAction({ action: memory[cleanInput], message: "From Local Memory" });
      setSpokenTranscript(`🧠 Memory Recall: Executing [${memory[cleanInput]}]`);
      return;
    }

    // 🚀 LAYER 3: Autonomous AI (Gemini 3.7 Flash Backend Call)
    setSpokenTranscript(`Gemini AI learning: "${inputText}"...`);
    setVoiceErrorMsg(''); 

    const dynamicApplicationState = {
      current_active_module: activeModule,
      available_modules: modules.map((m: any) => m.code)
    };

    try {
      const response = await fetch('/api/v1/ai-intent/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript: inputText,
          app_state: dynamicApplicationState 
        })
      });

      if (!response.ok) throw new Error("Gemini API connection error");

      const aiResponse = await response.json();
      
      // ✨ सेल्फ-लर्निंग: नया सफल जवाब मिलते ही हमेशा के लिए लोकल मेमोरी में सेव करें
      if (aiResponse.action && aiResponse.action !== 'error_invalid_command') {
        memory[cleanInput] = aiResponse.action;
        localStorage.setItem('ai_learned_memory', JSON.stringify(memory));
      }

      playBeepSound('end');
      executeAIGuidedAction(aiResponse);

    } catch (err) {
      console.warn("AI Fallback error...", err);
      playBeepSound('error');
      setVoiceErrorMsg("AI Engine is offline or unreachable.");
    }
  };

  const executeAIGuidedAction = (payload: any) => {
    const { action, message } = payload;

    if (action === 'error_invalid_command') {
      playBeepSound('error');
      setVoiceErrorMsg(message || "Invalid command. That feature doesn't exist.");
      setSpokenTranscript("");
      setTimeout(() => setIsVoiceActive(false), 2500);
      return;
    }

    if (['open_customizer', 'open_search'].includes(action)) {
       if (action === 'open_customizer') setIsCustomizerOpen(true);
       if (action === 'open_search') setIsCommandOpen(true);
    } 
    else if (action === 'toggle_sidebar') {
       updateConfig((prev: any) => ({ ...prev, hideSidebar: !prev.hideSidebar, isSidebarCollapsed: !prev.isSidebarCollapsed }));
    } 
    else {
       setActiveModule(action);
    }

    setSpokenTranscript(`AI Executed: ${action}`);
    setVoiceErrorMsg('');

    const newLog = {
      id: Date.now(),
      agent: "Gemini 3.7 Flash Autonomous AGI",
      action: `Executed intent: ${action}`,
      timestamp: new Date().toLocaleTimeString(),
      confidence: 1.0
    };

    setDashboardData((prevData: any) => ({
      ...prevData,
      ai_action_logs: [newLog, ...(prevData?.ai_action_logs || [])]
    }));

    setTimeout(() => {
      setIsVoiceActive(false);
    }, 200);
  };
  
  useEffect(() => {
    fetch('/api/v1/bootstrap/')
      .then((res) => {
        if (!res.ok) throw new Error("API not reachable");
        return res.json();
      })
      .then((data) => {
        setDashboardData(data);
        if (data.widget_layout) setWidgetLayout(data.widget_layout);
        if (data.unlocked_modules && data.unlocked_modules.length > 0) setActiveModule(data.unlocked_modules[0].code);
        setLoading(false);
      })
      .catch(() => {
        setDashboardData({
          is_god_mode: true,
          unlocked_modules: [
            { code: 'iot_telemetry', name: '3D Spatial Telemetry', icon: 'bi-cpu' },
            { code: 'crm_leads', name: 'CRM & Funnel Leads', icon: 'bi-people' },
            { code: 'billing_desk', name: '0% TDR Revenue Desk', icon: 'bi-wallet2' },
            { code: 'agentic_ai', name: 'Agentic AI Autopilot', icon: 'bi-robot' }
          ],
          ai_action_logs: [
            { id: 1, agent: "Autonomous Core AI", action: "Predictive Maintenance Alert triggered", timestamp: "10:45:00", confidence: 0.98 }
          ]
        });
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/global-stream/');
    ws.onopen = () => setRealtimeConnected(true);
    ws.onclose = () => setRealtimeConnected(false);
    return () => ws.close();
  }, []);

  const handleRunCommand = (command: any) => {
    const newLog = {
      id: Date.now(),
      agent: command.category === 'AI Tools' ? "Agentic AI Swarm" : "Super Admin",
      action: command.title,
      timestamp: new Date().toLocaleTimeString(),
      confidence: 0.99
    };
    setDashboardData((prevData: any) => ({
      ...prevData,
      ai_action_logs: [newLog, ...(prevData?.ai_action_logs || [])]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-bold">
        Bootstrapping Kosisko OS Core Engine...
      </div>
    );
  }

  const modules = dashboardData?.unlocked_modules || [];
  const aiLogs = dashboardData?.ai_action_logs || [];
  const isTopNav = themeConfig.sidebarPosition === 'top';
  const borderClass = themeConfig.hideBorders ? 'border-none' : 'border border-white/10';
  const isCollapsed = themeConfig.isSidebarCollapsed || false;

  return (
    <div className={`min-h-screen text-slate-100 flex ${isTopNav ? 'flex-col' : ''}`}>
      
      {/* 🧭 NAVIGATION SIDEBAR */}
      {!themeConfig.hideSidebar && (
        <aside 
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          style={{ 
            backgroundColor: themeConfig.sidebarBg,
            width: isTopNav ? '100%' : (isCollapsed ? '70px' : `${themeConfig.sidebarWidth}px`),
            fontSize: `${themeConfig.sidebarFontSize}px`
          }}
          className={`${
            isTopNav 
              ? 'w-full px-6 py-2.5 flex flex-row items-center justify-between' 
              : `p-1 flex flex-col justify-between ${themeConfig.sidebarPosition === 'right' ? 'order-2 border-l' : 'border-r'} border-white/10 relative`
          } backdrop-blur-3xl transition-all duration-200`}
        >
          <div>
            <div className="flex flex-col items-center justify-center mb-5 w-full relative pt-1">
              {themeConfig.logoImg ? (
                <div onClick={() => window.location.href = '/dashboard'} className="flex items-center justify-center w-full group cursor-pointer py-1" title="Go to Dashboard">
                  <img src={themeConfig.logoImg} alt="Enterprise Logo" className="max-h-20 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-120" />
                </div>
              ) : (
                <div onClick={() => window.location.href = '/dashboard'} className="flex flex-col items-center justify-center text-center w-full cursor-pointer group" title="Go to Dashboard">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div style={{ backgroundColor: themeConfig.accentColor }} className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-slate-950 text-sm shadow-md shrink-0 group-hover:scale-110 transition-transform">
                      {themeConfig.logoText || 'K'}
                    </div>
                    {!isCollapsed && !isTopNav && (
                      <h1 className="font-black tracking-wider text-white text-base leading-none">KOSISKO</h1>
                    )}
                  </div>
                  {!isCollapsed && !isTopNav && (
                    <span className="text-[10px] font-extrabold uppercase tracking-widest block truncate max-w-full px-1" style={{ color: themeConfig.accentColor }}>
                      {themeConfig.enterpriseName}
                    </span>
                  )}
                </div>
              )}
            </div>

            <nav className={`flex ${isTopNav ? 'flex-row gap-2' : 'space-y-1.5 flex-col mt-4'}`}>
              {!isTopNav && !isCollapsed && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Modules ({modules.length})</div>}
              {modules.map((mod: any) => (
                <button
                  key={mod.code}
                  onClick={() => setActiveModule(mod.code)}
                  style={{
                    backgroundColor: activeModule === mod.code ? themeConfig.accentColor : 'transparent',
                    color: activeModule === mod.code ? '#000' : '',
                    fontSize: `${themeConfig.sidebarFontSize}px`
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                    activeModule === mod.code ? 'shadow-md font-black' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                  title={isCollapsed ? mod.name : ''}
                >
                  <i className={`bi ${mod.icon} text-base`}></i>
                  {(!isCollapsed || isTopNav) && <span className="truncate">{mod.name}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* 🌟 AI Command Box (Type + Mic) at the Bottom of Left Sidebar */}
          {!isTopNav && !isCollapsed && (
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold" style={{ color: themeConfig.accentColor }}>AI COMMAND BAR</span>
                <span className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`}></span>
              </div>
              
              <div className="flex items-center gap-1 bg-slate-900/90 border border-cyan-500/30 rounded-xl px-2 py-1">
                <input
                  type="text"
                  value={sidebarCommandInput}
                  onChange={(e) => setSidebarCommandInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && sidebarCommandInput.trim()) {
                      processVoiceWithGeminiAI(sidebarCommandInput.trim());
                      setSidebarCommandInput('');
                    }
                  }}
                  placeholder="Type command..."
                  className="w-full bg-transparent text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (sidebarCommandInput.trim()) {
                      processVoiceWithGeminiAI(sidebarCommandInput.trim());
                      setSidebarCommandInput('');
                    }
                  }}
                  className="px-2 py-1 bg-cyan-500 text-slate-950 font-bold rounded-lg text-[10px] cursor-pointer"
                >
                  ➔
                </button>
                <button
                  onClick={() => setIsVoiceActive(true)}
                  className="p-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs cursor-pointer hover:bg-cyan-500/30 transition-all"
                  title="Voice Command"
                >
                  🎙️
                </button>
              </div>

              {voiceErrorMsg && (
                <div className="text-[10px] text-red-400 font-bold px-1 bg-red-500/10 p-1.5 rounded-lg border border-red-500/20">
                  {voiceErrorMsg}
                </div>
              )}
            </div>
          )}
        </aside>
      )}

      {/* Main Canvas */}
      <main className="flex-1 p-6 overflow-y-auto">
        {!themeConfig.hideHeader && (
          <header className={`flex justify-between items-center mb-6 pb-4 ${borderClass}`}>
            <div>
              <span style={{ color: themeConfig.accentColor, borderColor: `${themeConfig.accentColor}44` }} className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 border font-bold mb-1 inline-block">
                Connected to Django Core API Engine (Gemini 3.7 Flash)
              </span>
              <h2 style={{ fontSize: `${themeConfig.headerTitleFontSize}px` }} className="font-black text-white capitalize tracking-tight">
                {activeModule.replace('_', ' ')} Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCommandOpen(true)}
                className="px-3 py-1.5 bg-slate-900 border border-cyan-500/40 rounded-xl text-cyan-300 flex items-center gap-2 hover:bg-cyan-500/20 transition-all font-bold text-xs"
              >
                <span>🔍 Search</span>
                <kbd className="px-1 py-0.2 bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-400">Ctrl + K</kbd>
              </button>

              <button
                onClick={() => setIsCustomizerOpen(true)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all font-bold text-xs"
              >
                ⚙️ Customize UI
              </button>

              {themeConfig.showGodMode && (
                <span className="px-3 py-1.5 rounded-2xl text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  {themeConfig.godModeLabel || '👑 GOD-MODE SUPER ADMIN'}
                </span>
              )}

              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
                AC
              </div>
            </div>
          </header>
        )}

        {/* Bento Grid */}
        <div style={{ gap: `${themeConfig.gridGap}px` }} className="grid grid-cols-12">
          {themeConfig.show3DCanvas && (widgetLayout?.show_3d_canvas ?? true) && (
            <div style={{ padding: `${themeConfig.cardPadding}px` }} className={`col-span-12 lg:col-span-7 rounded-3xl bg-white/5 ${borderClass} backdrop-blur-2xl min-h-[320px]`}>
              <div className="flex justify-between items-center mb-3">
                <h3 style={{ fontSize: `${themeConfig.cardTitleFontSize}px` }} className="font-bold text-white capitalize">Three.js Spatial Holographic Matrix</h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">3D WebGL Active</span>
              </div>
              <div className="h-56 rounded-2xl border border-white/10 flex items-center justify-center bg-slate-900/50">
                <Spatial3DCanvas activeModule={activeModule} />
              </div>
            </div>
          )}

          {themeConfig.showAnalytics && (
            <div style={{ padding: `${themeConfig.cardPadding}px` }} className={`${themeConfig.show3DCanvas ? 'lg:col-span-5' : 'lg:col-span-12'} col-span-12 rounded-3xl bg-white/5 ${borderClass} backdrop-blur-2xl`}>
              <h3 style={{ fontSize: `${themeConfig.cardTitleFontSize}px` }} className="font-bold text-white mb-3">Real-Time ECharts Stream</h3>
              <EChartsAnalytics />
            </div>
          )}

          {/* Module Highlights Section */}
          {themeConfig.showHighlights && (
            <div style={{ padding: `${themeConfig.cardPadding}px` }} className={`col-span-12 rounded-2xl bg-white/5 ${borderClass} backdrop-blur-xl`}>
              {activeModule === 'agentic_ai' && (
                <div className="flex items-center gap-3 text-pink-300 font-bold">
                  <span className="text-xl">🤖</span>
                  <div>Agentic AI Autopilot: 12 Autonomous Swarm Workers Operating at 99.4% Accuracy.</div>
                </div>
              )}
              {activeModule === 'crm_leads' && (
                <div className="flex items-center gap-3 text-teal-300 font-bold">
                  <span className="text-xl">📊</span>
                  <div>CRM Pipeline Active: 1,420 High-Value Enterprise Funnel Leads Tracked.</div>
                </div>
              )}
              {activeModule === 'billing_desk' && (
                <div className="flex items-center gap-3 text-amber-300 font-bold">
                  <span className="text-xl">💰</span>
                  <div>0% TDR Revenue Desk: ₹0 Payment Gateway Fees Incurred (Instant Settlement).</div>
                </div>
              )}
              {activeModule === 'iot_telemetry' && (
                <div className="flex items-center gap-3 text-cyan-300 font-bold">
                  <span className="text-xl">🛰️</span>
                  <div>3D Spatial Telemetry: Live WebGL Holographic Stream active for All Active IoT Nodes.</div>
                </div>
              )}
            </div>
          )}

          {/* AI Action Logs Section */}
          {themeConfig.showLogs && (
            <div style={{ padding: `${themeConfig.cardPadding}px` }} className={`col-span-12 rounded-3xl bg-white/5 ${borderClass}`}>
              <h3 style={{ fontSize: `${themeConfig.cardTitleFontSize}px` }} className="font-bold text-white mb-3">🤖 Recent Agentic AI System Logs</h3>
              <div style={{ gap: `${themeConfig.gridGap}px` }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {aiLogs.map((log: any, index: number) => (
                  <div key={`${log.id}-${index}`} className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex justify-between font-bold mb-1" style={{ color: themeConfig.accentColor }}>
                      <span>{log.agent}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="text-slate-200 font-medium mb-1">{log.action}</div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      Confidence: {(log.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 🌟 Voice Assistant Popup Modal */}
      {isVoiceActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,243,255,0.2)] flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 text-2xl mb-4 shadow-[0_0_20px_rgba(0,243,255,0.4)] animate-pulse">
              🎙️
            </div>
            <h3 className="text-base font-black text-white tracking-wider mb-1">Kosisko Autonomous AI</h3>
            <p className="text-xs text-slate-400 mb-6">Listening and indexing intent dynamically...</p>
            
            <div className="w-full min-h-[50px] bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mb-4 flex items-center justify-center">
              <p className="text-xs text-cyan-300 font-mono italic">
                {spokenTranscript ? `"${spokenTranscript}"` : "Listening..."}
              </p>
            </div>

            {voiceErrorMsg && (
              <div className="w-full mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                {voiceErrorMsg}
              </div>
            )}

            <button
              onClick={() => setIsVoiceActive(false)}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} onSelectModule={(moduleCode: string) => setActiveModule(moduleCode)} onRunCommand={handleRunCommand} />
      <CustomizerPanel isOpen={isCustomizerOpen} onClose={() => setIsCustomizerOpen(false)} />
    </div>
  );
}