import React from 'react';
import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-slate-900/80 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <Link href="/login" className="text-xs text-amber-400 font-bold hover:underline">
            ← Back to Portal
          </Link>
          <span className="text-[10px] uppercase font-mono text-slate-400">Compliance & Billing</span>
        </div>

        <h1 className="text-3xl font-black text-white mb-2">Refund & Cancellation Policy</h1>
        <p className="text-xs text-slate-400 mb-8 font-mono">Last Updated: October 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Subscription Cancellation</h2>
            <p>Subscribers can cancel their module subscriptions (POS & GST Billing, CRM Pipeline) at any time directly through their Workspace Portal settings. Upon cancellation, access remains active until the end of the current 30-day billing cycle with no future renewals charged.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Refund Policy</h2>
            <p>For recurring software subscriptions, if you experience unresolved technical issues preventing service access, you may request a refund within <strong>7 days of payment</strong> by contacting our billing support team.</p>
            <p className="mt-2 text-slate-400 text-xs">Note: One-time Custom White-Label setup fees (₹10,000) are non-refundable once custom domain SSL provisioning and build deployments are completed.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Refund Processing Timeline</h2>
            <p>Approved refunds are initiated within <strong>5 to 7 business days</strong> and credited back strictly to the original payment source (bank account, UPI, or card) via Razorpay.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Support Contact for Billing</h2>
            <p>For any refund or cancellation inquiries, write to us at <strong>billing@kosisko.com</strong> or <strong>support@kosisko.com</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
