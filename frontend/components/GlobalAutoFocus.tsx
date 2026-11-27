'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function GlobalAutoFocus() {
  const pathname = usePathname();

  useEffect(() => {
    const isAuthOrFormRoute =
      pathname?.startsWith('/login') ||
      pathname?.startsWith('/signup') ||
      pathname?.startsWith('/reset-password') ||
      pathname?.startsWith('/verify-otp') ||
      pathname?.startsWith('/onboarding');

    if (!isAuthOrFormRoute) return;

    let lastFocusedEl: HTMLElement | null = null;

    const focusPrimaryInput = () => {
      const candidates = Array.from(
        document.querySelectorAll(
          'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([disabled]):not([readonly])'
        )
      ) as HTMLInputElement[];

      const visibleInputs = candidates.filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          el.offsetParent !== null &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          el.getBoundingClientRect().width > 0
        );
      });

      if (visibleInputs.length === 0) return;

      // यदि यूज़र पहले से किसी दृश्य इनपुट पर टाइप कर रहा है तो उसे न बदलें
      if (
        document.activeElement &&
        visibleInputs.includes(document.activeElement as HTMLInputElement)
      ) {
        return;
      }

      // पहला खाली इनपुट चुनें (या पहला उपलब्ध इनपुट)
      const target = visibleInputs.find((el) => !el.value) || visibleInputs[0];
      if (target && target !== lastFocusedEl) {
        lastFocusedEl = target;
        target.focus({ preventScroll: true });
        try {
          const len = target.value.length;
          target.setSelectionRange(len, len);
        } catch {}
      }
    };

    focusPrimaryInput();
    const t1 = setTimeout(focusPrimaryInput, 80);
    const t2 = setTimeout(focusPrimaryInput, 250);
    const t3 = setTimeout(focusPrimaryInput, 600);

    // जब भी नया स्टेप (Password / OTP / Signup / Onboarding) DOM में खुले, तुरंत फ़ोकस करें
    const observer = new MutationObserver(() => {
      setTimeout(focusPrimaryInput, 40);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
