'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SpeedOptimizer() {
  const router = useRouter();

  useEffect(() => {
    // सभी मुख्य रूट्स को तुरंत बैकग्राउंड में प्री-लोड करना ताकि क्लिक करते ही 0ms में खुलें
    const routesToWarm = ['/', '/login', '/customer/marketplace', '/customer/dashboard', '/profile'];
    const timer = setTimeout(() => {
      routesToWarm.forEach((route) => {
        try {
          router.prefetch(route);
        } catch (e) {}
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [router]);

  return null;
}
