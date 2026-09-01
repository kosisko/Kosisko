'use client';

import React, { useState, useEffect } from 'react';

export default function CommandPalette({ isOpen, onClose, onSelectModule, onRunCommand }) {
  const [query, setQuery] = useState('');

  const actions = [
    { id: 'iot_telemetry', title: 'Go to 3D Spatial Telemetry', category: 'Modules', shortcut: 'G S' },
    { id: 'crm_leads', title: 'Open CRM & Funnel Leads', category: 'Modules', shortcut: 'G C' },
    { id: 'billing_desk', title: 'Open 0% TDR Revenue Desk', category: 'Modules', shortcut: 'G R' },
    { id: 'agentic_ai', title: 'Launch Agentic AI Autopilot', category: 'Modules', shortcut: 'G A' },
    { id: 'cmd_ai_alert', title: 'Run AI Predictive Maintenance Check', category: 'AI Tools', shortcut: 'A I' },
    { id: 'cmd_impersonate', title: 'Tenant Impersonation Mode', category: 'Admin Tools', shortcut: 'A M' },
  ];

  const filteredActions = query === '' 
    ? actions 
    : actions.filter(action => 
        action.title.toLowerCase().includes(query.toLowerCase()) ||
        action.category.toLowerCase().includes(query.toLowerCase())
      );

  // Close on Escape Key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemSelect = (item) => {
    if (item.category === 'Modules' && onSelectModule) {
      onSelectModule(item.id);
    } else if (onRunCommand) {
      onRunCommand(item);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,243,255,0.2)] overflow-hidden">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-950/50">
          <span className="text-cyan-400 mr-3 text-xl">🔍</span>
          <input
            type="text"
            className="w-full bg-transparent text-white placeholder-slate-500 outline-none text-base"
            placeholder="Type a command or module name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button 
            onClick={onClose}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] rounded border border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">No matching commands found.</div>
          ) : (
            filteredActions.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemSelect(item)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-cyan-500/10 hover:border hover:border-cyan-500/30 cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 font-mono">
                    {item.category}
                  </span>
                  <span className="text-slate-200 group-hover:text-cyan-300 font-medium text-sm">
                    {item.title}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500 group-hover:text-cyan-400">
                  {item.shortcut}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex justify-between text-[11px] text-slate-500 font-mono">
          <span>Click any item to execute command</span>
          <span>Kosisko OS Spotlight v1.0</span>
        </div>

      </div>
    </div>
  );
}