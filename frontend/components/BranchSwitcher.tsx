'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Branch {
  id: number;
  branch_code: string;
  name: string;
  is_main_branch: boolean;
  is_current: boolean;
}

export default function BranchSwitcher() {
  const [branches, setBranches] = useState<Branch[]>([]);
  // ⚡ लोकल स्टोरेज से तुरंत सक्रिय स्टोर उठाएँ (नो लोडिंग स्क्रीन)
  const [activeBranch, setActiveBranch] = useState<Branch | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('kosisko_active_branch');
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasTenant, setHasTenant] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const hostParts = window.location.hostname.toLowerCase().split('.');
      if (hostParts.length >= 3 && !['www', 'api', 'admin', 'mail', 'app', 'kosisko'].includes(hostParts[0])) {
        return true;
      }
      if (document.cookie.includes('kosisko_active_tenant=__none__')) return false;
      if (localStorage.getItem('kosisko_active_branch')) return true;
    }
    return false;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // 🖱️ बाहर क्लिक करते ही ड्रॉपडाउन बंद करना
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getDetectedSubdomain = () => {
    if (typeof window === 'undefined') return '';
    const hostParts = window.location.hostname.toLowerCase().split('.');
    if (hostParts.length >= 3 && !['www', 'api', 'admin', 'mail', 'app', 'kosisko'].includes(hostParts[0])) {
      return hostParts[0];
    }
    const match = document.cookie.match(/(?:^|;\s*)kosisko_active_tenant=([^;]+)/);
    const ck = match ? decodeURIComponent(match[1]).trim().toLowerCase() : '';
    if (ck && ck !== '__none__' && ck !== 'workspace') return ck;
    return '';
  };

  const fetchBranches = async () => {
    const activeSub = getDetectedSubdomain();
    try {
      const headers: Record<string, string> = {};
      const tok =
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('kosisko_token');
      if (tok && tok !== 'null' && tok !== 'undefined') headers['Authorization'] = `Bearer ${tok}`;
      if (activeSub) headers['X-Tenant-Subdomain'] = activeSub;

      const res = await fetch('/api/v1/tenant/branches/', { credentials: 'include', headers });
      const data = await res.json();
      if (res.ok) {
        if (data.status === 'no_tenant' && !activeSub) {
          try { localStorage.removeItem('kosisko_active_branch'); } catch {}
          setHasTenant(false);
          return;
        }
        setHasTenant(true);
        if (data.branches && data.branches.length > 0) {
          setBranches(data.branches);
          const current = data.branches.find((b: Branch) => b.is_current) || data.branches[0];
          setActiveBranch(current);
          try {
            localStorage.setItem('kosisko_active_branch', JSON.stringify(current));
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to load branches', err);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSwitch = async (branchId: number) => {
    try {
      const res = await fetch('/api/v1/tenant/branches/switch/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ branch_id: branchId })
      });
      if (res.ok) {
        setIsOpen(false);
        const switched = branches.find((b) => b.id === branchId);
        if (switched) {
          localStorage.setItem('kosisko_active_branch', JSON.stringify(switched));
        }
        window.location.reload();
      }
    } catch (err) {
      console.error('Switch error', err);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/v1/tenant/branches/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newBranchName.trim() })
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok && data.status === 'success') {
        setNewBranchName('');
        setShowAddModal(false);
        fetchBranches();
      }
    } catch {
      setLoading(false);
    }
  };

  if (!hasTenant && !getDetectedSubdomain()) {
    return (
      <a
        href="/onboarding"
        className="w-full py-2 px-3 rounded-xl pill-os-accent font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all"
      >
        <span>⚡</span> <span>Setup Store & Subdomain</span>
      </a>
    );
  }

  // सक्रिय कोड व नाम
  const displayCode = activeBranch ? activeBranch.branch_code : 'BR-002';
  const displayName = activeBranch ? activeBranch.name : 'Main Store';

  return (
    <div ref={containerRef} className="relative w-full text-left">
      {/* ट्रिगर बटन */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-os-strong text-xs font-bold text-card-primary transition-all cursor-pointer shadow-md"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-os-accent font-mono text-[11px] flex-shrink-0">
            [{displayCode}]
          </span>
          <span className="truncate text-card-primary font-semibold">
            {displayName}
          </span>
        </div>
        <span className={`text-[10px] text-card-muted ml-1.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-os-accent' : ''}`}>
          ▼
        </span>
      </button>

      {/* 🌟 100% फिट ड्रॉपडाउन कार्ड (साइडबार से कभी बाहर नहीं जाएगा) */}
      {isOpen && (
        <div className="absolute left-0 right-0 w-full mt-2 rounded-2xl bg-os-s1 border border-white/10 shadow-2xl p-2.5 z-50 backdrop-blur-xl">
          <div className="px-2 py-1.5 border-b border-white/5 text-[9px] uppercase tracking-wider text-card-muted font-bold truncate">
            Select Active Branch (100 Store Grid)
          </div>

          <div className="max-h-52 overflow-y-auto space-y-1 my-1.5 pr-0.5">
            {branches.length > 0 ? (
              branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSwitch(b.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                    activeBranch && b.id === activeBranch.id
                      ? 'pill-os-accent font-bold'
                      : 'text-card-primary hover:bg-white/5'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="font-semibold truncate">{b.name}</div>
                    <div className="text-[10px] font-mono text-card-muted">
                      {b.branch_code} {b.is_main_branch && '• (Main HQ)'}
                    </div>
                  </div>
                  {activeBranch && b.id === activeBranch.id && (
                    <span className="text-emerald-400 text-xs font-bold flex-shrink-0">✓</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-2.5 py-2 text-xs text-card-muted">
                {displayName} [{displayCode}]
              </div>
            )}
          </div>

          <div className="border-t border-white/5 pt-2">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowAddModal(true);
              }}
              type="button"
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs hover:opacity-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>+</span> <span>नई शाखा / फ़्रैंचाइज़ी जोड़ें</span>
            </button>
          </div>
        </div>
      )}

      {/* शाखा पंजीकरण मॉडल */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-os-s1 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-black text-card-primary mb-1">🏢 नई दुकान / फ़्रैंचाइज़ी रजिस्टर करें</h3>
            <p className="text-xs text-card-muted mb-4">सिस्टम स्वतः यूनिक ब्रांच कोड (e.g. BR-002) अलॉट करेगा।</p>

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-card-primary mb-1">शाखा का नाम</label>
                <input
                  type="text"
                  required
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="उदा. स्टेशन रोड शाखा"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-card-primary text-xs font-semibold focus:border-os-strong focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-card-muted hover:bg-white/10"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-os-accent text-xs font-black hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                >
                  {loading ? 'रजिस्टर हो रहा है...' : 'सुरक्षित जोड़ें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
