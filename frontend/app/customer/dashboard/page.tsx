'use client';

import React, { useState, useEffect } from 'react';

function RollingNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const enabled = typeof window !== 'undefined' && (window as any).isKosiskoRollingEnabled?.() !== false;
    if (!enabled || display === value) {
      setDisplay(value);
      return;
    }
    const start = display;
    const t0 = performance.now();
    const dur = 450;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{prefix}{display.toLocaleString('en-IN')}</>;
}
import Link from 'next/link';
import { useApp } from '@/context/AppContext';

export default function CustomerDashboardPage() {
  const { installedApps } = useApp();
  const [revenue, setRevenue] = useState(235000);
  const [invoices, setInvoices] = useState(148);
  const [flowPct, setFlowPct] = useState(94.0);
  const [horizon, setHorizon] = useState<'today' | 'week' | 'month'>('today');
  const [banner, setBanner] = useState<string | null>(null);

  const [txns, setTxns] = useState([
    { id: 'INV-DS802-148', node: '[DS-802] Main HQ', summary: 'GST Retail Settlement — Apparel Counter', amount: 6420 },
    { id: 'INV-RE001-147', node: '[RE-001] Mandla', summary: 'UPI QR Verified Checkout', amount: 3190 },
  ]);

  const activeCount = Object.values(installedApps).filter(
    (a) => a && Date.now() < a.expiresAt
  ).length;

  const handleRecordExpressSale = () => {
    const saleAmt = 4850;
    const nextInv = invoices + 1;
    setRevenue((r) => r + saleAmt);
    setInvoices(nextInv);
    setFlowPct((f) => Math.min(100, +(f + 1.9).toFixed(1)));
    setTxns((prev) => [
      {
        id: `INV-POS-${nextInv}`,
        node: '[DS-802] Active',
        summary: 'Express Counter Retail Checkout',
        amount: saleAmt,
      },
      ...prev,
    ]);
    (window as any).triggerKosiskoCelebration?.();
    setBanner(`Invoice INV-POS-${nextInv} settled (+Rs. ${saleAmt.toLocaleString('en-IN')}).`);
    setTimeout(() => setBanner(null), 4000);
  };

  useEffect(() => {
    const onAiSale = () => handleRecordExpressSale();
    window.addEventListener('kosisko-ai-record-sale', onAiSale);
    return () => window.removeEventListener('kosisko-ai-record-sale', onAiSale);
  });

  const ringOffset = (138.23 * (1 - flowPct / 100)).toFixed(2);

  const chartPath =
    horizon === 'week'
      ? 'M0 135 C 120 120, 200 92, 310 98 C 420 104, 510 58, 630 44 C 710 35, 760 22, 800 18'
      : horizon === 'month'
      ? 'M0 155 C 150 140, 260 115, 400 88 C 540 62, 660 36, 800 12'
      : 'M0 150 C 90 142, 140 118, 220 112 C 300 106, 360 76, 440 82 C 520 88, 590 48, 680 34 C 730 26, 765 18, 800 14';

  return (
    <div className="workspace-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-os">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-os-accent">
            EXECUTIVE COMMAND TELEMETRY
          </div>
          <h1 className="os-page-title font-extrabold text-os-primary mt-1">
            Command Dashboard
          </h1>
          <p className="text-xs text-os-muted mt-1">
            Real-time net revenue velocity, GST invoice settlement, and multi-branch node health.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/customer/marketplace"
            className="px-3.5 py-2.5 rounded-xl bg-os-s2 hover:border-os-strong border border-os text-xs font-semibold text-card-primary"
          >
            Active Modules: <strong className="text-os-accent">{activeCount} Subscribed</strong>
          </Link>

          <button
            onClick={handleRecordExpressSale}
            className="px-4 py-2.5 rounded-xl bg-os-accent text-xs font-bold cursor-pointer inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Record Express POS Sale</span>
          </button>
        </div>
      </div>

      {banner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="os-card os-card-lift spotlight-target conic-beam-hero beam-pinned os-card-pad stagger-1 space-y-2.5">
          <div className="flex items-center justify-between pr-5">
            <span className="font-mono text-[10px] font-semibold uppercase text-card-muted">Net Revenue</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-semibold">
              +18.4%
            </span>
          </div>
          <div className="text-2xl font-extrabold text-card-primary tabular-nums">
            <RollingNumber value={revenue} prefix="Rs. " />
          </div>
          <svg className="w-full h-7" viewBox="0 0 160 28" fill="none">
            <path d="M2 23 L28 19 L54 21 L80 13 L106 15 L132 7 L158 3" className="sparkline-stroke" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="os-card os-card-lift spotlight-target os-card-pad space-y-2.5">
          <div className="flex items-center justify-between pr-5">
            <span className="font-mono text-[10px] font-semibold uppercase text-card-muted">GST Invoices</span>
            <span className="font-mono text-[10px] text-sky-400 font-semibold">Synced</span>
          </div>
          <div className="text-2xl font-extrabold text-card-primary tabular-nums">
            <RollingNumber value={invoices} />
          </div>
          <svg className="w-full h-7" viewBox="0 0 160 28" fill="none">
            <path d="M2 24 L32 20 L64 16 L96 17 L128 9 L158 5" className="sparkline-stroke" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="os-card os-card-lift spotlight-target os-card-pad flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="font-mono text-[10px] font-semibold uppercase text-card-muted">Daily Target</span>
            <div className="text-2xl font-extrabold text-card-primary tabular-nums">
              {flowPct.toFixed(1)}%
            </div>
            <div className="font-mono text-[10px] text-card-muted">Rs. 2.50L Goal</div>
          </div>

          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="var(--border-strong)" strokeWidth="4.5" />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray="138.23"
                strokeDashoffset={ringOffset}
              />
            </svg>
            <span className="absolute font-mono text-[10px] font-bold text-card-primary">
              {Math.round(flowPct)}%
            </span>
          </div>
        </div>

        <div className="os-card os-card-lift spotlight-target os-card-pad space-y-2.5">
          <div className="flex items-center justify-between pr-5">
            <span className="font-mono text-[10px] font-semibold uppercase text-card-muted">Store Nodes</span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Online
            </span>
          </div>
          <div className="text-2xl font-extrabold text-card-primary tabular-nums">
            2 / 2 Active
          </div>
          <div className="font-mono text-[11px] text-card-muted pt-1">
            Enterprise Pro • Active
          </div>
        </div>
      </div>

      {/* Revenue & GST Settlement Area Chart */}
      <div className="os-card spotlight-target os-card-pad space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-os pr-6">
          <div>
            <h3 className="text-sm font-bold text-card-primary">Revenue & GST Settlement Curve</h3>
            <p className="text-xs text-card-muted">Live checkout velocity across Main Store HQ & regional nodes</p>
          </div>
          <div className="inline-flex p-0.5 rounded-lg bg-os-input font-mono text-[10px]">
            {(['today', 'week', 'month'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-2.5 py-1 rounded-md cursor-pointer capitalize ${
                  horizon === h ? 'bg-os-accent font-bold' : 'text-os-muted hover:text-os-primary'
                }`}
              >
                {h === 'today' ? 'Today' : h === 'week' ? '7 Days' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full overflow-hidden pt-2">
          <svg className="w-full h-44" viewBox="0 0 800 180" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="revChartGradLive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.34" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="35" x2="800" y2="35" stroke="var(--border-color)" strokeDasharray="4 4" />
            <line x1="0" y1="85" x2="800" y2="85" stroke="var(--border-color)" strokeDasharray="4 4" />
            <line x1="0" y1="135" x2="800" y2="135" stroke="var(--border-color)" strokeDasharray="4 4" />
            <path d={`${chartPath} L 800 175 L 0 175 Z`} fill="url(#revChartGradLive)" />
            <path d={chartPath} stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Recent Live Transactions Table */}
      <div className="os-card overflow-hidden">
        <div className="px-5 py-4 border-b border-os flex items-center justify-between pr-8">
          <h3 className="text-sm font-bold text-card-primary">Recent Live Transactions</h3>
          <span className="font-mono text-[10px] text-card-muted">Real-Time Ledger</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-os font-mono text-[10px] uppercase text-card-muted">
                <th className="py-3 px-5">Invoice ID</th>
                <th className="py-3 px-5">Store Node</th>
                <th className="py-3 px-5">Summary</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {txns.map((t) => (
                <tr key={t.id}>
                  <td className="py-3 px-5 font-mono text-card-muted">{t.id}</td>
                  <td className="py-3 px-5 font-mono text-card-primary">{t.node}</td>
                  <td className="py-3 px-5 text-card-primary">{t.summary}</td>
                  <td className="py-3 px-5 font-mono font-semibold text-card-primary tabular-nums">
                    Rs. {t.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-5 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[10px]">
                      Settled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
