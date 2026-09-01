'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function MarketplacePage() {
  const { installedApps, installApp, uninstallApp, customPricing, isWhiteLabeled, setIsWhiteLabeled } = useApp();

  // 🎟️ कूपन और डिस्काउंट के लिए स्टेट्स (हर ऐप के लिए अलग इनपुट ट्रैक करने हेतु अपडेटेड)
  const [couponCodes, setCouponCodes] = useState<{ [key: string]: string }>({});
  const [appliedCoupons, setAppliedCoupons] = useState<{ [key: string]: { code: string; discount: number } }>({});
  const [couponMessage, setCouponMessage] = useState<{ [key: string]: { text: string; type: 'success' | 'error' } }>({});
  const [loadingApp, setLoadingApp] = useState<string | null>(null);

  // चेक करने का तरीका कि ऐप अभी एक्टिव है या नहीं
  const isAppActive = (code: string) => {
    const app = installedApps[code];
    if (!app) return false;
    return Date.now() < app.expiresAt;
  };

  // 🎫 कूपन अप्लाई करने का फंक्शन (Django API इंटीग्रेशन के साथ)
  const handleApplyCoupon = async (appCode: string, basePrice: number) => {
    const currentCoupon = couponCodes[appCode] || '';
    if (!currentCoupon.trim()) {
      setCouponMessage(prev => ({ ...prev, [appCode]: { text: 'Please enter a coupon code', type: 'error' } }));
      return;
    }

    setLoadingApp(appCode);
    try {
      // Django API कॉल जो हमने views.py में बनाई है
      const response = await fetch('/api/v1/calculate-price/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_code: appCode, coupon_code: currentCoupon.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppliedCoupons(prev => ({
          ...prev,
          [appCode]: { code: currentCoupon.trim(), discount: data.discount_applied }
        }));
        setCouponMessage(prev => ({
          ...prev,
          [appCode]: { text: `Success! Saved ₹${data.discount_applied}`, type: 'success' }
        }));
      } else {
        setCouponMessage(prev => ({
          ...prev,
          [appCode]: { text: data.error || 'Invalid coupon code', type: 'error' }
        }));
      }
    } catch (error) {
      setCouponMessage(prev => ({
        ...prev,
        [appCode]: { text: 'Server connection error', type: 'error' }
      }));
    } finally {
      setLoadingApp(null);
    }
  };

  // फाइनल पेबल अमाउंट कैलकुलेट करने के लिए
  const getFinalPrice = (appCode: string, basePrice: number) => {
    const coupon = appliedCoupons[appCode];
    if (coupon) {
      return Math.max(0, basePrice - coupon.discount);
    }
    return basePrice;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">App Marketplace & Subscriptions</h1>
        <p className="text-xs text-slate-400 mt-1">
          Install modules. Uninstall anytime—reinstalling within your active 30-day billing cycle is completely free.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. POS App */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-2xl">🧾</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full font-bold">
                ₹{getFinalPrice('pos', customPricing['pos'])} / mo 
                {appliedCoupons['pos'] && <span className="ml-1 text-emerald-400">(Discount Applied)</span>}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">POS & GST Billing</h3>
            <p className="text-xs text-slate-400 mt-1">Fast retail billing, automated GST invoicing, and WhatsApp receipts.</p>
          
            {/* 🎟️ कूपन इनपुट सेक्शन */}
            {!isAppActive('pos') && (
              <div className="mt-4 p-3 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Coupon (e.g. TATA20)"
                    value={couponCodes['pos'] || ''}
                    onChange={(e) => setCouponCodes(prev => ({ ...prev, pos: e.target.value }))}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button 
                    type="button"
                    onClick={() => handleApplyCoupon('pos', customPricing['pos'])}
                    disabled={loadingApp === 'pos'}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage['pos'] && (
                  <p className={`text-[10px] font-bold ${couponMessage['pos'].type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {couponMessage['pos'].text}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            {isAppActive('pos') ? (
              <>
                <button 
                  onClick={() => uninstallApp('pos')}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  Uninstall App
                </button>
                <button disabled className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 cursor-default">
                  ✓ Active (30 Days)
                </button>
              </>
            ) : (
              <button 
                onClick={() => installApp('pos', getFinalPrice('pos', customPricing['pos']))}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                Pay & Install (₹{getFinalPrice('pos', customPricing['pos'])})
              </button>
            )}
          </div>
        </div>

        {/* 2. CRM App */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-2xl">📈</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full font-bold">
                ₹{getFinalPrice('crm', customPricing['crm'])} / mo 
                {appliedCoupons['crm'] && <span className="ml-1 text-emerald-400">(Discount Applied)</span>}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">CRM & Sales Pipeline</h3>
            <p className="text-xs text-slate-400 mt-1">Manage enterprise leads, customer contacts, and deal pipelines.</p>
          
            {/* 🎟️ कूपन इनपुट सेक्शन */}
            {!isAppActive('crm') && (
              <div className="mt-4 p-3 bg-slate-950/60 rounded-2xl border border-white/5 space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Coupon (e.g. TATA20)"
                    value={couponCodes['crm'] || ''}
                    onChange={(e) => setCouponCodes(prev => ({ ...prev, crm: e.target.value }))}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button 
                    type="button"
                    onClick={() => handleApplyCoupon('crm', customPricing['crm'])}
                    disabled={loadingApp === 'crm'}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage['crm'] && (
                  <p className={`text-[10px] font-bold ${couponMessage['crm'].type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {couponMessage['crm'].text}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            {isAppActive('crm') ? (
              <>
                <button 
                  onClick={() => uninstallApp('crm')}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                >
                  Uninstall App
                </button>
                <button disabled className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 cursor-default">
                  ✓ Active (30 Days)
                </button>
              </>
            ) : (
              <button 
                onClick={() => installApp('crm', getFinalPrice('crm', customPricing['crm']))}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                Pay & Install (₹{getFinalPrice('crm', customPricing['crm'])})
              </button>
            )}
          </div>
        </div>

        {/* 3. White-Label Branding (प्रीमियम फीचर) */}
        <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-purple-500/20 p-6 rounded-3xl flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-2xl">🌟</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full font-bold">Enterprise Add-on (₹9,999)</span>
            </div>
            <h3 className="text-sm font-bold text-white">Custom White-Label Branding</h3>
            <p className="text-xs text-slate-300 mt-1">Remove 'Kosisko' branding entirely. Display your own company name, logo, custom domain, and favicon across the platform.</p>
          </div>

          <div className="mt-6">
            {isWhiteLabeled ? (
              <button disabled className="w-full py-2.5 rounded-xl bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 cursor-default">
                ✓ White-Label Active (Branded workspace)
              </button>
            ) : (
              <button 
                onClick={() => setIsWhiteLabeled(true)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-purple-500/20"
              >
                Unlock White-Label Rights
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}