'use client';

import { DEFAULT_STUDIO_STATE, applyStudioTokensToDocument } from '@/components/KosiskoStudioDrawer';

import React, { useState } from 'react';

function useOnboardingThemeSync() {
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('kosisko_os_studio_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        applyStudioTokensToDocument({
          ...DEFAULT_STUDIO_STATE,
          ...parsed,
          zones: { ...DEFAULT_STUDIO_STATE.zones, ...(parsed.zones || {}) },
          features: { ...DEFAULT_STUDIO_STATE.features, ...(parsed.features || {}) },
        });
      } else {
        applyStudioTokensToDocument(DEFAULT_STUDIO_STATE);
      }
    } catch {
      applyStudioTokensToDocument(DEFAULT_STUDIO_STATE);
    }
  }, []);
}

export default function OnboardingWizardPage() {
  useOnboardingThemeSync();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // फ़ॉर्म स्टेट
  const [businessName, setBusinessName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [category, setCategory] = useState('grocery_supermarket');
  const [branchName, setBranchName] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');

  // सबडोमेन ऑटो-सजेशन
  const handleBusinessNameChange = (val: string) => {
    setBusinessName(val);
    if (!subdomain || subdomain === businessName.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      setSubdomain(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  };

  const handleCompleteSetup = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/v1/tenant/onboarding/complete/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          business_name: businessName,
          subdomain: subdomain,
          business_category: category,
          branch_name: branchName || `${businessName} - Main Store`,
          gstin: gstin,
          address: address,
          city: city,
          pincode: pincode,
          invoice_prefix: invoicePrefix
        })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.status === 'success') {
        // कुकीज़ रीफ्रेश करें
        document.cookie = 'kosisko_logged_in=true; path=/; domain=.kosisko.com; max-age=604800; SameSite=Lax';
        document.cookie = 'kosisko_logged_in=true; path=/; max-age=604800; SameSite=Lax';
        
        // सीधे नए सबडोमेन वर्कस्पेस पर लॉन्च करें
        window.location.href = data.workspace_url;
      } else {
        setErrorMsg(data.error || 'सेटअप पूरा करने में समस्या आई। कृपया पुनः प्रयास करें।');
      }
    } catch {
      setLoading(false);
      setErrorMsg('सर्वर से संपर्क नहीं हो सका। कृपया इंटरनेट कनेक्शन जाँचें।');
    }
  };

  return (
    <div className="min-h-screen kosisko-os-shell bg-os-base text-white flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* शीर्ष हेडर */}
      <header className="px-8 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-amber-500/20">
            K
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-card-primary">Kosisko Enterprise</h1>
            <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Smart Store Provisioning Engine</p>
          </div>
        </div>

        {/* स्टेप्स इंडिकेटर व Skip बटन */}
        <div className="flex items-center gap-3 text-xs font-bold">
          <a
            href="/customer/dashboard"
            className="px-3.5 py-2 rounded-xl bg-os-s2 hover:border-os-strong border border-os text-xs font-bold text-card-primary transition-all inline-flex items-center gap-1.5"
          >
            <span>Skip for Now → Dashboard</span>
          </a>
          <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-amber-500 text-black' : 'bg-white/10 text-card-muted'}`}>1. ब्रांड व सबडोमेन</span>
          <span className="text-os-subtle">→</span>
          <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-amber-500 text-black' : 'bg-white/10 text-card-muted'}`}>2. पहली HQ शाखा</span>
          <span className="text-os-subtle">→</span>
          <span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-amber-500 text-black' : 'bg-white/10 text-card-muted'}`}>3. लॉन्च व एक्टिवेशन</span>
        </div>
      </header>

      {/* मुख्य कंटेनर */}
      <main className="max-w-6xl mx-auto w-full px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* बायाँ फ़ॉर्म सेक्शन */}
        <div className="lg:col-span-7 bg-os-s1 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-card-primary">दुकान या कंपनी की पहचान</h2>
                <p className="text-xs text-card-muted mt-1">अपने व्यापार का नाम और मनपसंद डिजिटल सबडोमेन दर्ज करें।</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-card-primary mb-2">व्यापार का नाम (Business Name)</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  placeholder="उदा. Ratan Enterprises"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none text-sm font-semibold transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-card-primary mb-2">डिजिटल सबडोमेन (Live Address)</label>
                <div className="flex items-center rounded-2xl bg-white/5 border border-white/10 overflow-hidden focus-within:border-amber-400">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="ratan"
                    className="flex-1 px-4 py-3 bg-transparent text-sm font-bold text-amber-400 focus:outline-none"
                  />
                  <span className="px-4 py-3 text-xs font-bold text-card-muted bg-white/5 border-l border-white/10">.kosisko.com</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-card-primary mb-2">व्यापार की श्रेणी (Business Category)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-os-s1 border border-white/10 focus:border-amber-400 text-sm font-semibold text-card-primary focus:outline-none"
                >
                  <option value="grocery_supermarket">🛒 किराना, सुपरमार्ट व FMCG (500+ ऑटो-कैटलॉग)</option>
                  <option value="apparel_fashion">👗 कपड़े, गारमेंट्स व फुटवियर</option>
                  <option value="electronics_hardware">⚡ इलेक्ट्रॉनिक्स, मोबाइल व हार्डवेयर</option>
                  <option value="pharmacy_wellness">💊 मेडिकल स्टोर व फार्मेसी</option>
                  <option value="restaurant_cafe">☕ रेस्टोरेंट, बेकरी व कैफ़े</option>
                  <option value="general_retail">📦 सामान्य रिटेल व अन्य</option>
                </select>
              </div>

              <button
                disabled={!businessName || !subdomain}
                onClick={() => setStep(2)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 disabled:opacity-40 transition-all cursor-pointer"
              >
                आगे बढ़ें: पहली शाखा जोड़ें →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-card-primary">पहली मुख्य दुकान (HQ Store)</h2>
                <p className="text-xs text-card-muted mt-1">आपकी पहली दुकान को सिस्टम HQ-001 कोड से रजिस्टर करेगा (भविष्य में 100 दुकानें जोड़ सकते हैं)।</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-card-primary mb-2">शाखा का नाम</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="उदा. मेन रोड स्टोर"
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-400 text-sm font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-card-primary mb-2">इनवॉइस प्रीफ़िक्स</label>
                  <input
                    type="text"
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                    placeholder="INV"
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-400 text-sm font-semibold focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-card-primary mb-2">दुकान का GSTIN (वैकल्पिक)</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="23AAAAA0000A1Z5"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-400 text-sm font-semibold focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-card-primary mb-2">दुकान का पता व शहर</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="दुकान नंबर 12, मेन मार्केट"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-400 text-sm font-semibold focus:outline-none mb-3"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="शहर (उदा. भोपाल/जबलपुर)"
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-400 text-sm font-semibold focus:outline-none"
                  />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="पिनकोड"
                    className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-400 text-sm font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-card-primary hover:bg-white/10 transition-all cursor-pointer"
                >
                  ← पीछे
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  अंतिम समीक्षा व लॉन्च →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-card-primary">सिस्टम लॉन्च के लिए तैयार है!</h2>
                <p className="text-xs text-card-muted mt-1">नीचे दिए गए विवरण की पुष्टि करें। "लॉन्च वर्कस्पेस" दबाते ही आपका सुरक्षित पोर्टल लाइव हो जाएगा।</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-card-muted">कंपनी (Tenant):</span>
                  <span className="font-bold text-card-primary">{businessName}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-card-muted">डिजिटल डोमेन:</span>
                  <span className="font-bold text-amber-400">https://{subdomain}.kosisko.com</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-card-muted">पहली शाखा (HQ):</span>
                  <span className="font-bold text-card-primary">{branchName || `${businessName} - Main Store`} (Code: HQ-001)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-card-muted">आपका रोल:</span>
                  <span className="font-bold text-cyan-400">Tenant Administrator (Full Control)</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  disabled={loading}
                  onClick={() => setStep(2)}
                  className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-card-primary hover:bg-white/10 transition-all cursor-pointer"
                >
                  ← बदलाव करें
                </button>
                <button
                  disabled={loading}
                  onClick={handleCompleteSetup}
                  className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:opacity-95 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? 'डिजिटल स्टोर प्रोविज़न हो रहा है...' : '🚀 लॉन्च माय वर्कस्पेस (Launch Store)'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* दायाँ लाइव प्रिव्यू कार्ड (Interactive Preview) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                Live Storefront Card
              </span>
              <span className="text-[10px] text-os-subtle">v1.0 Ready</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20 mb-4">
              {businessName ? businessName.charAt(0).toUpperCase() : 'K'}
            </div>

            <h3 className="text-xl font-black text-card-primary tracking-tight">{businessName || 'आपकी दुकान का नाम'}</h3>
            <p className="text-xs text-amber-400 font-mono mt-1 font-bold">
              {subdomain ? `${subdomain}.kosisko.com` : 'your-shop.kosisko.com'}
            </p>

            <div className="mt-6 pt-4 border-t border-white/10 space-y-2 text-[11px] text-card-muted">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> <span>सेंट्रल क्लाउड आर्किटेक्चर (100 ब्रांच सपोर्ट)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> <span>शून्य-इंटरनेट ऑफ़लाइन POS इंजन</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> <span>WhatsApp डिजिटल बिल व खाता सिंक</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* पाद लेख (Footer) */}
      <footer className="px-8 py-4 border-t border-white/10 text-center text-os-subtle text-xs">
        Powered by Kosisko Ventures Private Limited • Built for Enterprise Scale
      </footer>
    </div>
  );
}
