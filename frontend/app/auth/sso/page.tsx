'use client';

import { useEffect } from 'react';

export default function SSOConsumePage() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        window.location.replace('/login');
        return;
      }

      // कस्टम डोमेन पर टोकन एक्सचेंज करें
      fetch('/api/v1/auth/sso/consume/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sso_token: token })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'success') {
            document.cookie = 'kosisko_logged_in=true; path=/; max-age=604800; SameSite=Lax';
            window.location.replace('/customer/marketplace');
          } else {
            window.location.replace('/login');
          }
        })
        .catch(() => {
          window.location.replace('/login');
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
