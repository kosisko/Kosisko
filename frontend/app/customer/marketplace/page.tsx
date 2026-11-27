'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function MarketplacePage() {
  const { installedApps, installApp, uninstallApp, customPricing, isWhiteLabeled, setIsWhiteLabeled } = useApp();

  const [couponCodes, setCouponCodes] = useState<{ [key: string]: string }>({});
  const [appliedCoupons, setAppliedCoupons] = useState<{ [key: string]: { code: string; discount: number } }>({});
  const [couponMessage, setCouponMessage] = useState<{ [key: string]: { text: string; type: 'success' | 'error' } }>({});
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{ text: string; ok: boolean } | null>(null);

  const isAppActive = (code: string) => {
    const app = installedApps[code];
    if (!app) return false;
    return Date.now() < app.expiresAt;
  };

  const handleApplyCoupon = async (appCode: string) => {
    const currentCoupon = couponCodes[appCode] || '';
    if (!currentCoupon.trim()) {
      setCouponMessage((prev) => ({ ...prev, [appCode]: { text: 'Please enter a coupon code', type: 'error' } }));
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
        setAppliedCoupons((prev) => ({
          ...prev,
          [appCode]: { code: currentCoupon.trim(), discount: data.discount_applied },
        }));
        setCouponMessage((prev) => ({
          ...prev,
          [appCode]: { text: `Success! Saved Rs. ${data.discount_applied}`, type: 'success' },
        }));
      } else {
        setCouponMessage((prev) => ({
          ...prev,
          [appCode]: { text: data.error || 'Invalid coupon code', type: 'error' },
        }));
      }
    } catch {
      setCouponMessage((prev) => ({
        ...prev,
        [appCode]: { text: 'Server connection error', type: 'error' },
      }));
    } finally {
      setLoadingApp(null);
    }
  };

  const getFinalPrice = (appCode: string, basePrice: number) => {
    const coupon = appliedCoupons[appCode];
    if (coupon) return Math.max(0, basePrice - coupon.discount);
    return basePrice;
  };

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

  const handleRazorpayCheckout = async (appCode: string, amount: number) => {
    setLoadingApp(appCode);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setStatusBanner({ text: 'Unable to load payment gateway SDK. Check internet connection.', ok: false });
        setLoadingApp(null);
        return;
      }

      const slugMap: { [key: string]: string } = {
        pos: 'pos_billing',
        crm: 'crm_workflows',
        whitelabel: 'enterprise_erp',
        test: 'test_order',
      };
      const moduleSlug = slugMap[appCode] || appCode;

      const orderRes = await fetch('/api/v1/payments/create-order/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_slug: moduleSlug, amount }),
      });

      const orderData = await orderRes.json();
      if (orderData.status !== 'success') {
        setStatusBanner({ text: 'Order creation failed: ' + (orderData.message || 'Unknown error'), ok: false });
        setLoadingApp(null);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Kosisko Ventures Private Limited',
        description: `Subscription: ${appCode.toUpperCase()} Activation`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/v1/payments/verify/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                module_slug: moduleSlug,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.status === 'success') {
              if (appCode === 'whitelabel') {
                setIsWhiteLabeled(true);
              } else if (appCode !== 'test') {
                installApp(appCode, amount);
              }
              (window as any).triggerKosiskoCelebration?.();
              setStatusBanner({ text: 'Payment verified successfully. Module activated in your sidebar.', ok: true });
            } else {
              setStatusBanner({ text: 'Verification Failed: ' + verifyData.message, ok: false });
            }
          } catch {
            setStatusBanner({ text: 'Network error during payment verification.', ok: false });
          } finally {
            setLoadingApp(null);
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingApp(null);
          },
        },
        theme: { color: '#F59E0B' },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch {
      setStatusBanner({ text: 'Unable to initialize checkout.', ok: false });
      setLoadingApp(null);
    }
  };

  return (
    <div className="workspace-container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-os">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-os-accent">
            MODULAR SAAS ECOSYSTEM
          </div>
          <h1 className="os-page-title font-extrabold text-os-primary mt-1">
            App Marketplace & Subscriptions
          </h1>
          <p className="text-xs text-os-muted mt-1">
            Install operational ERP modules. Reinstalling within your active 30-day billing cycle is free.
          </p>
        </div>

        <span className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-os-s2 border border-os font-mono text-xs text-card-primary">
          30-Day Billing Protection
        </span>
      </div>

      {statusBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            statusBanner.ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button onClick={() => setStatusBanner(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Live Gateway Audit Card */}
      <div className="os-card spotlight-target conic-beam-hero beam-pinned os-card-pad flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 pr-6">
          <div className="w-10 h-10 rounded-xl pill-os-accent flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-card-primary">Live Gateway Audit Test</p>
            <p className="text-[11px] text-card-muted">
              Verify live UPI / QR settlement with Rs. 1 audit transaction.
            </p>
          </div>
        </div>
        <button
          onClick={() => handleRazorpayCheckout('test', 1)}
          disabled={loadingApp === 'test'}
          className="px-4 py-2.5 bg-os-accent font-bold text-xs rounded-xl cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loadingApp === 'test' ? 'Opening...' : 'Test Rs. 1 UPI'}
        </button>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. POS & GST Billing */}
        <div className="os-card os-card-lift spotlight-target os-card-pad flex flex-col justify-between gap-5">
          <div className="space-y-3 pr-5">
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-os-s1 border border-os flex items-center justify-center text-os-accent">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                  <path d="M8 7h8M8 11h8M8 15h5" />
                </svg>
              </div>
              <span className="px-2.5 py-0.5 rounded-full pill-os-accent font-mono text-[10px] font-bold">
                Rs. {getFinalPrice('pos', customPricing['pos'])} / mo
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-card-primary">POS & GST Billing</h3>
              <p className="text-xs text-card-muted mt-1 leading-relaxed">
                Fast retail checkout, automated CGST/SGST invoicing, and digital WhatsApp receipts.
              </p>
            </div>

            {!isAppActive('pos') && (
              <div className="p-3 bg-os-s1 rounded-xl border border-os space-y-2">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Coupon (e.g. TATA20)"
                    value={couponCodes['pos'] || ''}
                    onChange={(e) => setCouponCodes((prev) => ({ ...prev, pos: e.target.value }))}
                    className="flex-1 bg-os-input rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon('pos')}
                    disabled={loadingApp === 'pos'}
                    className="px-3 py-1.5 rounded-lg bg-os-s2 border border-os text-xs font-bold text-card-primary cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage['pos'] && (
                  <p className={`text-[10px] font-bold ${couponMessage['pos'].type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {couponMessage['pos'].text}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-os flex gap-2">
            {isAppActive('pos') ? (
              <>
                <button
                  onClick={() => { uninstallApp('pos'); (window as any).triggerKosiskoCelebration?.(); setStatusBanner({ text: 'POS & GST Billing removed from operational sidebar.', ok: true }); }}
                  className="flex-1 py-2 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/25 cursor-pointer"
                >
                  Uninstall
                </button>
                <span className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/25 text-center">
                  Active (30d)
                </span>
              </>
            ) : (
              <button
                onClick={() => handleRazorpayCheckout('pos', getFinalPrice('pos', customPricing['pos']))}
                disabled={loadingApp === 'pos'}
                className="w-full py-2.5 rounded-xl bg-os-accent text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {loadingApp === 'pos' ? 'Connecting...' : `Pay & Install (Rs. ${getFinalPrice('pos', customPricing['pos'])})`}
              </button>
            )}
          </div>
        </div>

        {/* 2. CRM & Sales Pipeline */}
        <div className="os-card os-card-lift spotlight-target os-card-pad flex flex-col justify-between gap-5">
          <div className="space-y-3 pr-5">
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-os-s1 border border-os flex items-center justify-center text-os-accent">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <span className="px-2.5 py-0.5 rounded-full pill-os-accent font-mono text-[10px] font-bold">
                Rs. {getFinalPrice('crm', customPricing['crm'])} / mo
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-card-primary">CRM & Sales Pipeline</h3>
              <p className="text-xs text-card-muted mt-1 leading-relaxed">
                Manage enterprise B2B leads, customer credit accounts, and automated follow-ups.
              </p>
            </div>

            {!isAppActive('crm') && (
              <div className="p-3 bg-os-s1 rounded-xl border border-os space-y-2">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Coupon (e.g. TATA20)"
                    value={couponCodes['crm'] || ''}
                    onChange={(e) => setCouponCodes((prev) => ({ ...prev, crm: e.target.value }))}
                    className="flex-1 bg-os-input rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon('crm')}
                    disabled={loadingApp === 'crm'}
                    className="px-3 py-1.5 rounded-lg bg-os-s2 border border-os text-xs font-bold text-card-primary cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponMessage['crm'] && (
                  <p className={`text-[10px] font-bold ${couponMessage['crm'].type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {couponMessage['crm'].text}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-os flex gap-2">
            {isAppActive('crm') ? (
              <>
                <button
                  onClick={() => { uninstallApp('crm'); (window as any).triggerKosiskoCelebration?.(); setStatusBanner({ text: 'CRM & Sales Pipeline removed from operational sidebar.', ok: true }); }}
                  className="flex-1 py-2 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/25 cursor-pointer"
                >
                  Uninstall
                </button>
                <span className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/25 text-center">
                  Active (30d)
                </span>
              </>
            ) : (
              <button
                onClick={() => handleRazorpayCheckout('crm', getFinalPrice('crm', customPricing['crm']))}
                disabled={loadingApp === 'crm'}
                className="w-full py-2.5 rounded-xl bg-os-accent text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {loadingApp === 'crm' ? 'Connecting...' : `Pay & Install (Rs. ${getFinalPrice('crm', customPricing['crm'])})`}
              </button>
            )}
          </div>
        </div>

        {/* 3. Custom White-Label Branding */}
        <div className="os-card os-card-lift spotlight-target os-card-pad flex flex-col justify-between gap-5">
          <div className="space-y-3 pr-5">
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-os-s1 border border-os flex items-center justify-center text-os-accent">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <span className="px-2.5 py-0.5 rounded-full pill-os-accent font-mono text-[10px] font-bold">
                Rs. 9,999 Add-on
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-card-primary">Custom White-Label Branding</h3>
              <p className="text-xs text-card-muted mt-1 leading-relaxed">
                Display your own company name, logo, custom domain, and favicon across the entire workspace.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-os">
            {isWhiteLabeled ? (
              <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/25 text-center">
                White-Label Rights Active
              </div>
            ) : (
              <button
                onClick={() => handleRazorpayCheckout('whitelabel', 9999)}
                disabled={loadingApp === 'whitelabel'}
                className="w-full py-2.5 rounded-xl bg-os-accent text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {loadingApp === 'whitelabel' ? 'Connecting...' : 'Unlock White-Label Rights (Rs. 9,999)'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
