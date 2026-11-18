'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Kosisko PWA ServiceWorker Registered: ', registration.scope);
          })
          .catch((err) => {
            console.error('Kosisko PWA ServiceWorker Registration Failed: ', err);
          });
      });
    }
  }, []);

  return null;
}
