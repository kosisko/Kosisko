import React from 'react';
import Link from 'next/link';

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-slate-900/80 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <Link href="/" className="text-xs text-cyan-400 font-bold hover:underline">
            ← Back to Home
          </Link>
          <span className="text-[10px] uppercase font-mono text-slate-400">Fulfillment & Delivery</span>
        </div>

        <h1 className="text-3xl font-black text-white mb-2">Shipping & Delivery Policy</h1>
        <p className="text-xs text-slate-400 mb-8 font-mono">Last Updated: October 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Digital SaaS Delivery</h2>
            <p><strong>Kosisko Ventures Private Limited</strong> provides cloud-based multi-tenant software services (SaaS), including POS Billing, CRM workflows, and custom enterprise modules. All services and subscription add-ons are delivered digitally through our cloud platform (<strong>kosisko.com</strong>).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Delivery Timelines & Mode</h2>
            <p><strong>Instant Online Provisioning:</strong> Upon successful payment confirmation via our payment gateway, access to the purchased module or subscription is provisioned automatically within seconds on your workspace dashboard.</p>
            <p className="mt-2 text-slate-400 text-xs">A digital payment receipt and onboarding confirmation will be instantly delivered to your registered email address and WhatsApp number.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. No Physical Shipping Required</h2>
            <p>Since all our platform products are web-based digital solutions, there are no physical products shipped to physical addresses. Consequently, zero shipping fees or handling charges apply to any transaction on our platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Support & Delivery Inquiries</h2>
            <p>If you experience any delay in workspace activation post-payment, our technical desk will resolve it immediately. Write to us at <strong>support@kosisko.com</strong> or call Helpline: <strong>+91 9203401296</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
