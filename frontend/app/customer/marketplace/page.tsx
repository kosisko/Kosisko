'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function MarketplacePage() {
  const { installedApps, installApp, uninstallApp, customPricing, isWhiteLabeled, setIsWhiteLabeled } = useApp();

  // 🎟️ कूपन और डिस्काउंट स्टेट्स
  const [couponCodes, setCouponCodes] = useState<{ [key: string]: string }>({});
  const [appliedCoupons, setAppliedCoupons] = useState<{ [key: string]: { code: string; discount: number } }>({});
  const [couponMessage, setCouponMessage] = useState<{ [key: string]: { text: string; type: 'success' | 'error' } }>({});
  const [loadingApp, setLoadingApp] = useState<string | null>(null);

  // ऐप सक्रियता जाँच
  const isAppActive = (code: string) => {
    const app = installedApps[code];
    if (!app) return false;
    return Date.now() < app.expiresAt;
  };

  // कूपन सत्यापन
  const handleApplyCoupon = async (appCode: string, basePrice: number) => {
    const currentCoupon = couponCodes[appCode] || '';
    if (!currentCoupon.trim()) {
      setCouponMessage(prev => ({ ...prev, [appCode]: { text: 'Please enter a coupon code', type: 'error' } }));
      return;
    }

    setLoadingApp(appCode);
    try {
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

  // अंतिम देय राशि
  const getFinalPrice = (appCode: string, basePrice: number) => {
    const coupon = appliedCoupons[appCode];
    if (coupon) {
      return Math.max(0, basePrice - coupon.discount);
    }
    return basePrice;
  };

  // 💳 Razorpay SDK डायनामिक लोडर
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // 💳 Live Checkout & Verification Handler
  const handleRazorpayCheckout = async (appCode: string, amount: number) => {
    setLoadingApp(appCode);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Razorpay SDK लोड करने में समस्या आई। इंटरनेट कनेक्शन जाँचें।');
        setLoadingApp(null);
        return;
      }

      const slugMap: { [key: string]: string } = {
        pos: 'pos_billing',
        crm: 'crm_workflows',
        whitelabel: 'enterprise_erp',
        test: 'test_order'
      };
      const moduleSlug = slugMap[appCode] || appCode;

      // 1. Django Backend से लाइव ऑर्डर प्राप्त करें
      const orderRes = await fetch('/api/v1/payments/create-order/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_slug: moduleSlug,
          amount: amount
        })
      });

      const orderData = await orderRes.json();
      if (orderData.status !== 'success') {
        alert('Order creation failed: ' + (orderData.message || 'Unknown error'));
        setLoadingApp(null);
        return;
      }

      // 2. Razorpay Live Checkout Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Kosisko Ventures Private Limited',
        description: `Subscription: ${appCode.toUpperCase()} Activation`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // 3. Signature Verification
            const verifyRes = await fetch('/api/v1/payments/verify/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                module_slug: moduleSlug
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.status === 'success') {
              if (appCode === 'whitelabel') {
                setIsWhiteLabeled(true);
              } else if (appCode !== 'test') {
                installApp(appCode, amount);
              }
              alert('🎉 भुगतान सफल रहा! मॉड्यूल सक्रिय हो गया है।');
            } else {
              alert('Verification Failed: ' + verifyData.message);
            }
          } catch (err) {
            alert('पेमेंट सत्यापन में नेटवर्क त्रुटि।');
          } finally {
            setLoadingApp(null);
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingApp(null);
          }
        },
        theme: {
          color: '#06b6d4'
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error(err);
      alert('चेकआउट शुरू करने में त्रुटि।');
      setLoadingApp(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full min-w-0 max-w-7xl mx-auto px-3 sm:px-6 py-4">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white tracking-tight">App Marketplace & Subscriptions</h1>
        <p className="text-xs text-slate-400 mt-1">
          Install modules. Uninstall anytime—reinstalling within your active 30-day billing cycle is completely free.
        </p>
      </div>

      {/* ⚡ Live Gateway Audit Test Card */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-amber-400">⚡ Live Gateway Audit Test</p>
          <p className="text-[11px] text-slate-400">Test live UPI / QR payment with ₹1 deduction directly to bank.</p>
        </div>
        <button
          onClick={() => handleRazorpayCheckout('test', 1)}
          disabled={loadingApp === 'test'}
          className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
        >
          {loadingApp === 'test' ? 'Opening...' : 'Test ₹1 UPI'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0">

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

            {/* कूपन इनपुट */}
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
                onClick={() => handleRazorpayCheckout('pos', getFinalPrice('pos', customPricing['pos']))}
                disabled={loadingApp === 'pos'}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {loadingApp === 'pos' ? 'Connecting Gateway...' : `Pay & Install (₹${getFinalPrice('pos', customPricing['pos'])})`}
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

            {/* कूपन इनपुट */}
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
                onClick={() => handleRazorpayCheckout('crm', getFinalPrice('crm', customPricing['crm']))}
                disabled={loadingApp === 'crm'}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {loadingApp === 'crm' ? 'Connecting Gateway...' : `Pay & Install (₹${getFinalPrice('crm', customPricing['crm'])})`}
              </button>
            )}
          </div>
        </div>

        {/* 3. White-Label Branding */}
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
                onClick={() => handleRazorpayCheckout('whitelabel', 9999)}
                disabled={loadingApp === 'whitelabel'}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-black hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {loadingApp === 'whitelabel' ? 'Connecting Gateway...' : 'Unlock White-Label Rights (₹9,999)'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
