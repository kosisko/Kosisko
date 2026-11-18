'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getSharedDeviceId } from '../../components/SessionDraftGuard';

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    buffer[i] = rawData.charCodeAt(i);
  }
  return buffer.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

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
    if (did) {
      headers['X-Device-ID'] = did;
    }
  }
  return headers;
}

interface PasskeyData {
  id: number;
  subdomain: string;
  created_at: string;
  created_icon: string;
  last_used: string;
  last_icon: string;
}

interface ActiveSession {
  id: number;
  device_type: string;
  device_icon: string;
  device_name: string;
  ip_address: string;
  last_activity: string;
  is_current: boolean;
}

export default function SecurityProfilePage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [passkeys, setPasskeys] = useState<PasskeyData[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [authMethod, setAuthMethod] = useState<'biometric' | 'password'>('biometric');
  const [masterPassword, setMasterPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchData = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const res = await fetch('/api/v1/auth/passkey/status', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated === true) {
          setPasskeys(data.passkeys || []);
          setSessions(data.active_sessions || []);
        }
      }
    } catch (e) {
      console.error('Failed to load security status:', e);
    } finally {
      fetchingRef.current = false;
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const liveSync = setInterval(fetchData, 3000);
    return () => clearInterval(liveSync);
  }, []);

  const handleRegisterPasskey = async () => {
    if (!window.PublicKeyCredential) {
      setMsg({ text: 'Biometric passkeys are not supported on this browser.', ok: false });
      return;
    }

    setActionLoading(true);
    setMsg(null);

    try {
      const res = await fetch('/api/v1/auth/passkey/register-options', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const options = await res.json();
      if (!res.ok) throw new Error(options.error || 'Failed to initialize passkey registration');

      options.challenge = base64UrlToBuffer(options.challenge);
      options.user.id = base64UrlToBuffer(options.user.id);

      const credential = (await navigator.credentials.create({ publicKey: options })) as PublicKeyCredential;
      if (!credential) throw new Error('Authentication process was cancelled.');

      const rawResponse = credential.response as AuthenticatorAttestationResponse;

      const verifyRes = await fetch('/api/v1/auth/passkey/register-verify', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          id: credential.id,
          rawId: bufferToBase64Url(credential.rawId),
          response: {
            clientDataJSON: bufferToBase64Url(rawResponse.clientDataJSON),
            attestationObject: bufferToBase64Url(rawResponse.attestationObject),
          },
        }),
      });

      const data = await verifyRes.json();
      if (verifyRes.ok && data.status === 'success') {
        setMsg({ text: data.message || 'Passkey successfully created and verified for your workspace.', ok: true });
        await fetchData();
      } else {
        throw new Error(data.error || 'Verification failed');
      }
    } catch (err: any) {
      if (
        err.name === 'NotAllowedError' ||
        (err.message && (err.message.includes('not allowed') || err.message.includes('timed out')))
      ) {
        setMsg({ text: 'Passkey registration cancelled or timed out. Please try again when ready.', ok: false });
      } else {
        setMsg({ text: err.message || 'Device registration could not be completed.', ok: false });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokePasskey = async () => {
    if (!confirm('Are you sure you want to revoke this passkey? You will need to use standard credentials.')) return;

    try {
      const res = await fetch('/api/v1/auth/passkey/delete', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
      });

      const data = await res.json();
      if (res.ok) {
        setMsg({ text: data.message || 'Passkey has been successfully revoked.', ok: true });
        await fetchData();
      } else {
        throw new Error(data.error || 'Failed to revoke passkey.');
      }
    } catch (e: any) {
      setMsg({ text: e.message || 'Failed to revoke passkey.', ok: false });
    }
  };

  const executeRevokeSession = async () => {
    if (!selectedSession) return;
    setAuthError(null);
    setActionLoading(true);

    try {
      let credentialId = '';
      if (authMethod === 'biometric') {
        if (passkeys.length === 0) {
          setAuthError('Biometric passkey is disabled on this account. Please use your Master Password.');
          setActionLoading(false);
          return;
        }
        const optRes = await fetch('/api/v1/auth/passkey/login-options', {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        const options = await optRes.json();
        if (!optRes.ok) throw new Error(options.error || 'Biometric challenge failed');

        options.challenge = base64UrlToBuffer(options.challenge);
        if (options.allowCredentials && Array.isArray(options.allowCredentials)) {
          options.allowCredentials = options.allowCredentials.map((c: any) => ({
            ...c,
            id: base64UrlToBuffer(c.id),
          }));
        }

        const assertion = (await navigator.credentials.get({ publicKey: options })) as PublicKeyCredential;
        if (!assertion) throw new Error('Biometric authorization cancelled.');
        credentialId = assertion.id;
      } else if (authMethod === 'password') {
        if (!masterPassword.trim()) {
          setAuthError('Please enter your master account password.');
          setActionLoading(false);
          return;
        }
      }

      const res = await fetch('/api/v1/auth/session/revoke', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify({
          id: selectedSession.id,
          auth_type: authMethod,
          password: masterPassword,
          credential_id: credentialId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setMsg({ text: `'${selectedSession.device_name}' has been securely logged out.`, ok: true });
        setSessions((prev) => prev.filter((item) => item.id !== selectedSession.id));
        setSelectedSession(null);
        setMasterPassword('');
        await fetchData();
      } else {
        throw new Error(data.error || 'Authorization failed.');
      }
    } catch (err: any) {
      if (
        err.name === 'NotAllowedError' ||
        (err.message && (err.message.includes('not allowed') || err.message.includes('timed out')))
      ) {
        setAuthError('Biometric verification was cancelled or timed out. Please try again or use your Master Password.');
      } else {
        setAuthError(err.message || 'Authorization failed. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-black tracking-widest uppercase text-amber-500 block mb-1">
              ENTERPRISE SECURITY & IDENTITY HUB
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Hardware Security & Active Sessions
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Manage cryptographic passkeys, monitor live client nodes, and control remote access with step-up verification.
            </p>
          </div>

          <Link
            href="/customer/marketplace"
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all shadow-md"
          >
            ← Back to Marketplace
          </Link>
        </div>

        {/* Feedback Banner */}
        {msg && (
          <div
            className={`p-4 rounded-2xl border text-xs md:text-sm font-semibold flex items-center justify-between shadow-lg ${
              msg.ok
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
            }`}
          >
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="ml-4 opacity-60 hover:opacity-100 font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* SECTION 1: Hardware Passkey Vault */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔐</span>
                <h2 className="text-lg font-bold text-white">Hardware Passkey Vault</h2>
                {!initialLoading && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                    passkeys.length > 0 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-slate-700/20 text-slate-400 border-slate-700/30'
                  }`}>
                    {passkeys.length > 0 ? 'ACTIVATED & SECURED' : 'NOT LINKED'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                FIDO2 hardware biometric passkey for passwordless 1-tap workspace sign in.
              </p>
            </div>

            {!initialLoading && passkeys.length === 0 && (
              <button
                onClick={handleRegisterPasskey}
                disabled={actionLoading}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Authenticating...' : '+ Register Biometric Key'}
              </button>
            )}
          </div>

          <div className="mt-6">
            {initialLoading ? (
              <div className="text-center py-8 text-xs text-slate-500 animate-pulse">
                Verifying cryptographic vault status...
              </div>
            ) : passkeys.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-2xl">
                <span className="text-3xl block mb-2 opacity-50">🔑</span>
                <p className="text-sm font-semibold text-slate-300">No hardware passkey linked</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click '+ Register Biometric Key' above to link your fingerprint, screen lock, or security key.
                </p>
              </div>
            ) : (
              passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700/80 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl shrink-0">
                      🔐
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-white">Cloud-Synced Passkey</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          [{pk.subdomain}]
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Active on Workspace
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-1 text-xs text-slate-400 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{pk.created_icon}</span>
                          <span>Registered: <strong className="text-slate-200">{pk.created_at}</strong></span>
                        </div>
                        <span className="hidden sm:inline text-slate-600">•</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{pk.last_icon}</span>
                          <span>Last Unlocked: <strong className="text-emerald-400">{pk.last_used}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleRevokePasskey}
                    className="self-end md:self-auto px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🗑️</span>
                    <span>Revoke Passkey</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 2: Active Logged-in Devices */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🌐</span>
                <h2 className="text-lg font-bold text-white">Device Access & Active Sessions</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {sessions.length} Active Now
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Live presence monitor of hardware nodes signed into this workspace.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {initialLoading ? (
              <div className="text-center py-8 text-xs text-slate-500 animate-pulse">
                Auditing live security nodes...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No active device sessions found.
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    s.is_current
                      ? 'bg-slate-950/80 border-emerald-500/40 shadow-emerald-950/20 shadow-md'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                      {s.device_icon}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{s.device_name}</h4>
                        {s.is_current ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            This Device (Active Now)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 bg-slate-800/60 border border-slate-700/60">
                            Active Remote Session
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 mt-1.5">
                        <span>Last Activity: <strong className="text-slate-300">{s.last_activity}</strong></span>
                        <span className="hidden sm:inline">•</span>
                        <span className="break-all font-mono">
                          IP: <strong className="text-slate-300 select-all">{s.ip_address}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {s.is_current ? (
                    <span className="self-end md:self-auto text-xs font-semibold text-slate-500 px-3 py-1.5 bg-slate-900/40 rounded-lg border border-slate-800">
                      Current Active Node
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedSession(s);
                        setAuthMethod(passkeys.length > 0 ? 'biometric' : 'password');
                        setAuthError(null);
                        setMasterPassword('');
                      }}
                      className="self-end md:self-auto px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🔴</span>
                      <span>Log Out Device</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* STEP-UP AUTHORIZATION MODAL */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-rose-400 block mb-1">
                SECURITY PRIVILEGE VERIFICATION
              </span>
              <h3 className="text-xl font-bold text-white">Authorize Remote Termination</h3>
              <p className="text-xs text-slate-400 mt-1.5">
                You are about to terminate session for <strong className="text-slate-200">{selectedSession.device_name}</strong> ({selectedSession.ip_address}).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-300 flex items-start gap-2.5">
              <span className="text-base">🛡️</span>
              <span>
                <strong>Draft Safeguard Active:</strong> In-memory forms and active inputs on that device will be automatically cached to prevent data loss.
              </span>
            </div>

            <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                disabled={passkeys.length === 0}
                onClick={() => {
                  if (passkeys.length > 0) {
                    setAuthMethod('biometric');
                    setAuthError(null);
                  }
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  passkeys.length === 0
                    ? 'opacity-40 cursor-not-allowed text-slate-500 bg-slate-900/50'
                    : authMethod === 'biometric'
                    ? 'bg-amber-500 text-slate-950 shadow-md cursor-pointer'
                    : 'text-slate-400 hover:text-white cursor-pointer'
                }`}
              >
                {passkeys.length === 0 ? '🔒 Biometric (Disabled)' : '🔐 Biometric Scan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password');
                  setAuthError(null);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  authMethod === 'password' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔑 Master Password
              </button>
            </div>

            {authMethod === 'password' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Confirm Master Password</label>
                <input
                  type="password"
                  placeholder="Enter your account password..."
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            )}

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                {authError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeRevokeSession}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {actionLoading ? 'Verifying...' : 'Authorize & Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
