'use client';

import React, { useState, useEffect } from 'react';

export default function TeamMarketplacePage() {
  const [apps, setApps] = useState<any[]>([
    { 
      id: 1, 
      code: 'pos_billing', 
      name: 'POS & GST Billing', 
      desc: 'Fast Retail Billing, GST Invoicing & WhatsApp Share', 
      installed: true 
    },
    { 
      id: 2, 
      code: 'crm_pipeline', 
      name: 'CRM & Sales Pipeline', 
      desc: 'Manage Leads, Customer Contacts & Sales Pipeline', 
      installed: true 
    },
    { 
      id: 3, 
      code: 'iot_telemetry', 
      name: '3D Spatial Telemetry', 
      desc: 'Real-time 3D IoT sensor monitoring and holographic data stream', 
      installed: false 
    },
    { 
      id: 4, 
      code: 'agentic_ai', 
      name: 'Agentic AI Autopilot', 
      desc: 'Autonomous enterprise AI agents for automated workflow execution', 
      installed: false 
    }
  ]);

  const [loadingAppId, setLoadingAppId] = useState<number | null>(null);

  // 🔄 Django API से डेटा लोड करने के लिए useEffect
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/v1/marketplace/')
      .then((res) => {
        if (!res.ok) throw new Error("API not available");
        return res.json();
      })
      .then((data) => {
        if (data && data.length > 0) {
          setApps(data);
        }
      })
      .catch((err) => {
        console.warn("Using default layout apps (Backend offline or route not mapped yet):", err);
      });
  }, []);

  // ऐप को इनस्टॉल या अनइनस्टॉल करने का फंक्शन (Django API इंटीग्रेशन के साथ)
  const handleToggleInstall = async (id: number, currentStatus: boolean) => {
    setLoadingAppId(id);
    
    // भविष्य के लिए Django API कॉल:
    // await fetch('http://127.0.0.1:8000/api/v1/marketplace/toggle/', { 
    //   method: 'POST', 
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ id, action: !currentStatus }) 
    // });

    setTimeout(() => {
      setApps(apps.map(app => app.id === id ? { ...app, installed: !currentStatus } : app));
      setLoadingAppId(null);
    }, 400); // छोटा सा स्मूथ डिले
  };

  return (
    <div>
      {/* 🏷️ टॉप हेडर */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">App Marketplace</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage and provision business modules for your team workspace</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Tata Motors Hub
        </span>
      </div>

      {/* 🏪 बिजनेस ऐप स्टोर बैनर */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-white/10 p-6 rounded-3xl mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
          <span>🏪</span> Business App Store
        </h3>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          अपनी जरूरत के हिसाब से ऐप्स चुनें और अनलॉक करें। जितने ऐप्स आप इस्तेमाल करेंगे, आपका सिस्टम उतना ही शक्तिशाली और मॉड्यूलर होता जाएगा।
        </p>
      </div>

      {/* 📦 ऐप्स ग्रिड कार्ड्स */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {apps.map((app) => (
          <div 
            key={app.id} 
            className="bg-slate-900/70 border border-white/10 p-6 rounded-3xl flex flex-col justify-between backdrop-blur-xl hover:border-white/20 transition-all shadow-lg"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-lg shadow-inner">
                  📦
                </div>
                {app.installed ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Installed
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold">
                    Available
                  </span>
                )}
              </div>
              <h4 className="font-bold text-base text-white mb-1.5">{app.name}</h4>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">{app.desc}</p>
            </div>

            <button
              onClick={() => handleToggleInstall(app.id, app.installed)}
              disabled={loadingAppId === app.id}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                app.installed 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20' 
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              }`}
            >
              {loadingAppId === app.id ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                app.installed ? 'Uninstall App' : 'Install App'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}