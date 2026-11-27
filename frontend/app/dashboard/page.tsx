'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function LegacyDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/customer/dashboard');
  }, [router]);
  return <div className="min-h-screen bg-[#07090E]" />;
}
