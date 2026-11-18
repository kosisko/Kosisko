'use client';

import React from 'react';

interface DesignerToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function DesignerToggle({ isOpen, onToggle }: DesignerToggleProps) {
  return (
    <button
      onClick={onToggle}
      type="button"
      aria-label="Toggle Workspace Menu"
      className="group relative flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-amber-500/40 hover:border-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.4)] transition-all duration-300 active:scale-95 z-50 cursor-pointer"
    >
      {/* एंबिएंट गोल्ड ग्लो */}
      <div className="absolute inset-0 rounded-2xl bg-amber-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm pointer-events-none" />

      {/* हाई-टेक डिज़ाइनर बार्स */}
      <div className="relative w-5 h-4 flex flex-col justify-between items-center pointer-events-none">
        {/* ऊपरी बार */}
        <span
          className={`h-[2.5px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 rounded-full transition-all duration-300 origin-center shadow-[0_0_8px_rgba(245,158,11,0.6)] ${
            isOpen ? 'w-5 translate-y-[7px] rotate-45' : 'w-5'
          }`}
        />
        
        {/* मध्य बार (डायनामिक पल्सिंग बीड) */}
        <div
          className={`flex items-center justify-center transition-all duration-200 ${
            isOpen ? 'opacity-0 scale-0' : 'w-5 opacity-100'
          }`}
        >
          <span className="h-[2px] w-2.5 bg-gradient-to-r from-amber-300 to-amber-100 rounded-full" />
          <span className="w-1.5 h-1.5 mx-0.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.9)] animate-pulse" />
          <span className="h-[2px] w-1 bg-gradient-to-r from-amber-300 to-amber-200 rounded-full" />
        </div>

        {/* निचला बार */}
        <span
          className={`h-[2.5px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 rounded-full transition-all duration-300 origin-center shadow-[0_0_8px_rgba(245,158,11,0.6)] ${
            isOpen ? 'w-5 -translate-y-[7px] -rotate-45' : 'w-4 self-start'
          }`}
        />
      </div>
    </button>
  );
}
