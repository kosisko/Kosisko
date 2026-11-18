import React from 'react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-16 px-6 font-sans">
      <div className="max-w-4xl mx-auto bg-slate-900/80 border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <Link href="/" className="text-xs text-cyan-400 font-bold hover:underline">
            ← Back to Home
          </Link>
          <span className="text-[10px] uppercase font-mono text-slate-400">Official Support Desk</span>
        </div>

        <h1 className="text-3xl font-black text-white mb-2">Contact Us</h1>
        <p className="text-xs text-slate-400 mb-8 font-mono">
          We are here to assist you with enterprise onboarding, technical support, and billing inquiries.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Legal Entity & Office Address */}
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">Registered Office Address</h3>
            <div className="text-sm text-slate-300 leading-relaxed">
              <p className="font-bold text-white text-base">Kosisko Ventures Private Limited</p>
              <p className="mt-2 text-slate-400">
                Ratan Flour Mill, In Front Of Sant Nirankari Bhawan,<br />
                Binjhiya, Mandla, Madhya Pradesh - 481661, India
              </p>
            </div>
            <div className="pt-2 border-t border-white/10 text-xs text-slate-400">
              <strong>Corporate Identification (CIN):</strong> Registered Private Limited Company
            </div>
          </div>

          {/* Direct Support & Helpline */}
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">Customer Support & Helpline</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <div>
                <span className="text-xs text-slate-400 block">Helpline / Phone:</span>
                <a href="tel:+919203401296" className="text-white font-bold hover:text-cyan-400">
                  +91 9203401296
                </a>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Official Support Email:</span>
                <a href="mailto:support@kosisko.com" className="text-cyan-400 hover:underline">
                  support@kosisko.com
                </a>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Corporate Inquiries:</span>
                <a href="mailto:admin@kosisko.com" className="text-cyan-400 hover:underline">
                  admin@kosisko.com
                </a>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Operational Hours:</span>
                <span className="text-slate-300">Monday to Saturday, 9:30 AM to 6:30 PM IST</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
