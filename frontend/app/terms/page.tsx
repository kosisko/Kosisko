import React from 'react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-slate-900/80 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <Link href="/login" className="text-xs text-amber-400 font-bold hover:underline">
            ← Back to Portal
          </Link>
          <span className="text-[10px] uppercase font-mono text-slate-400">Legal Document</span>
        </div>

        <h1 className="text-3xl font-black text-white mb-2">Terms and Conditions</h1>
        <p className="text-xs text-slate-400 mb-8 font-mono">Last Updated: October 2026</p>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Acceptance of Terms</h2>
            <p>Welcome to <strong>kosisko.com</strong>, operated by <strong>Kosisko Ventures Private Limited</strong>. By accessing our platform and services, you agree to comply with and be bound by these Terms and Conditions.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. SaaS Services & Workspaces</h2>
            <p>Kosisko provides cloud-based software solutions, including POS & GST Billing, CRM & Sales Pipeline management, and Custom White-Label branding services for businesses and retail enterprises.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. User Responsibilities & Account Security</h2>
            <p>Users must provide accurate registration details. You are solely responsible for maintaining the confidentiality of your master password, biometric access, and account credentials.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Payment & Subscription Terms</h2>
            <p>Subscription fees are billed on a recurring monthly or one-time license basis through authorized payment aggregators (Razorpay). Access to premium features is granted immediately upon successful payment verification.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Governing Law & Jurisdiction</h2>
            <p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Madhya Pradesh, India.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
