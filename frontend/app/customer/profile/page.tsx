'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSharedDeviceId } from '@/components/SessionDraftGuard';

function getAuthHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('kosisko_token');
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const did = getSharedDeviceId();
    if (did) headers['X-Device-ID'] = did;
  }
  return headers;
}

export default function CustomerProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [roleDisplay, setRoleDisplay] = useState('Tenant Owner');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCategory, setBusinessCategory] = useState('general_retail');
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [subdomain, setSubdomain] = useState('');

  const hydrate = (data: any) => {
    if (data.user) {
      setUsername(data.user.username || '');
      setEmail(data.user.email || '');
      setFirstName(data.user.first_name || '');
      setLastName(data.user.last_name || '');
    }
    if (data.profile) {
      setRoleDisplay(data.profile.role_display || 'Tenant Owner');
      setMobileNumber(data.profile.mobile_number || '');
      setOrganizationName(data.profile.organization_name || '');
      setGstNumber(data.profile.gst_number || '');
      setBusinessAddress(data.profile.business_address || '');
    }
    if (data.tenant) {
      setSubdomain(data.tenant.subdomain || '');
      setBusinessCategory(data.tenant.business_category || 'general_retail');
      if (!data.profile?.organization_name && data.tenant.name) {
        setOrganizationName(data.tenant.name);
      }
    }
    if (Array.isArray(data.business_categories)) {
      setCategories(data.business_categories);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/auth/profile/', {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        if (res.ok) hydrate(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/v1/auth/profile/', {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          mobile_number: mobileNumber,
          organization_name: organizationName,
          gst_number: gstNumber,
          business_address: businessAddress,
          business_category: businessCategory,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        hydrate(data);
        setMsg({ text: data.message || 'Profile settings saved successfully.', ok: true });
      } else {
        setMsg({ text: data.error || 'Failed to save profile settings.', ok: false });
      }
    } catch {
      setMsg({ text: 'Connection error while saving profile.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workspace-container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-os">
        <div>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-os-accent">
            MERCHANT & FIRM IDENTITY
          </div>
          <h1 className="os-page-title font-extrabold text-os-primary mt-1">
            Profile Settings
          </h1>
          <p className="text-xs text-os-muted mt-1">
            Manage personal merchant identity, firm details, GSTIN, and workspace configuration.
          </p>
        </div>

        <Link
          href="/customer/security"
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-os-s2 hover:border-os-strong border border-os text-xs font-semibold text-card-primary inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Security Hub (FIDO2)</span>
        </Link>
      </div>

      {msg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            msg.ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="ml-4 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {loading ? (
        <div className="os-card os-card-pad text-center text-xs text-card-muted animate-pulse">
          Loading merchant & workspace profile...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="os-card conic-beam-hero beam-pinned spotlight-target os-card-pad space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-os">
              <div>
                <h3 className="text-sm font-bold text-card-primary">Personal Merchant Identity</h3>
                <p className="text-[11px] text-card-muted mt-0.5">@{username} {email ? `• ${email}` : ''}</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full pill-os-accent font-mono text-[10px] font-semibold uppercase">
                {roleDisplay}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-card-muted mb-1.5">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-os-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-card-muted mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-os-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-card-muted mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-os-input text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="os-card spotlight-target os-card-pad space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-os">
              <h3 className="text-sm font-bold text-card-primary">Firm & Workspace Configuration</h3>
              <span className="font-mono text-[11px] text-sky-400">
                {subdomain ? `${subdomain}.kosisko.com` : 'kosisko.com'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-card-muted mb-1.5">Firm / Organization Name</label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-os-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-card-muted mb-1.5">Business Category</label>
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-os-input text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-card-muted mb-1.5">GSTIN Number</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  maxLength={20}
                  placeholder="23XXXXX0000X1Z5"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-os-input text-xs font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-card-muted mb-1.5">Registered Business Address</label>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Shop / Office address, City, State"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-os-input text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-os-accent text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving Changes...' : 'Save Profile Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
