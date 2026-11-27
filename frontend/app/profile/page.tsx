'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function LegacyProfileRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/customer/security'); }, [router]);
  return <div className="min-h-screen bg-[#07090E]" />;
}
