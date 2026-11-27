import SpeedOptimizer from '@/components/SpeedOptimizer';
import SessionDraftGuard from '../components/SessionDraftGuard';
import GlobalAutoFocus from '@/components/GlobalAutoFocus';
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import 'bootstrap-icons/font/bootstrap-icons.css';
import "./globals.css";

import { AppProvider } from "../context/AppContext";
import PWARegister from "@/components/PWARegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  other: { google: "notranslate" },
  title: "Kosisko – Next-Gen Autonomous Workspace",
  description: "Advanced 3D Spatial & Enterprise Operating System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kosisko",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="hi" translate="no" className="notranslate" style={{ backgroundColor: "#020617" }}>
      <body className="min-h-full flex flex-col bg-slate-950 text-white" style={{ backgroundColor: "#020617", margin: 0 }}>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){for(var i=0;i<rs.length;i++)rs[i].unregister();});}var p=location.pathname,s=location.search||'',r=document.referrer||'';var hasAuth=!!(localStorage.getItem('access_token')||localStorage.getItem('token')||localStorage.getItem('kosisko_token')||document.cookie.indexOf('kosisko_logged_in=true')!==-1);var played=sessionStorage.getItem('kosisko_splash_played')==='1';if(p!=='/'||hasAuth||played||s.indexOf('logout=')!==-1||s.indexOf('code=')!==-1||s.indexOf('state=')!==-1||r.indexOf('accounts.google.com')!==-1){return;}sessionStorage.setItem('kosisko_splash_played','1');var d=document.createElement('div');d.id='kosisko-once-splash';d.innerHTML='<style>#kosisko-once-splash{position:fixed;inset:0;z-index:999999;background:radial-gradient(circle at 50% 48%,#0f172a 0%,#060a14 55%,#020617 100%);display:flex;align-items:center;justify-content:center;overflow:hidden;animation:kOnceExit 1.3s cubic-bezier(.22,1,.36,1) forwards}@keyframes kOnceExit{0%,75%{opacity:1;transform:scale(1);visibility:visible;pointer-events:auto}99%{opacity:0;transform:scale(1.03);visibility:visible;pointer-events:none}100%{opacity:0;transform:scale(1.03);visibility:hidden;display:none;pointer-events:none}}@keyframes kSpinCW{0%{transform:rotate(0deg) scale(.9);opacity:.5}50%{opacity:1}100%{transform:rotate(360deg) scale(1);opacity:.95}}@keyframes kSpinCCW{0%{transform:rotate(360deg) scale(1.06);opacity:.4}100%{transform:rotate(0deg) scale(1);opacity:.8}}@keyframes kMedIn{0%{transform:scale(.94);opacity:.9}60%{transform:scale(1.03);opacity:1}100%{transform:scale(1);opacity:1}}</style><div style="position:relative;width:260px;height:260px;display:flex;align-items:center;justify-content:center"><div style="position:absolute;inset:-16px;border-radius:9999px;background:radial-gradient(circle,rgba(251,191,36,.28) 0%,rgba(217,119,6,.08) 52%,transparent 72%)"></div><svg viewBox="0 0 240 240" style="position:absolute;inset:0;width:100%;height:100%;animation:kSpinCW 1s cubic-bezier(.22,1,.36,1) forwards"><circle cx="120" cy="120" r="108" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="480 180" stroke-linecap="round"/></svg><svg viewBox="0 0 240 240" style="position:absolute;inset:0;width:100%;height:100%;animation:kSpinCCW 1.1s cubic-bezier(.22,1,.36,1) forwards"><circle cx="120" cy="120" r="98" fill="none" stroke="#fde68a" stroke-width="1.5" stroke-dasharray="360 240" stroke-linecap="round"/></svg><div style="width:204px;height:204px;border-radius:9999px;overflow:hidden;display:flex;align-items:center;justify-content:center;animation:kMedIn .9s cubic-bezier(.16,1,.3,1) forwards;-webkit-mask-image:radial-gradient(circle,#000 66.5%,rgba(0,0,0,.8) 69.5%,transparent 72.5%);mask-image:radial-gradient(circle,#000 66.5%,rgba(0,0,0,.8) 69.5%,transparent 72.5%)"><img src="/icons/kosisko-medallion.png" alt="Kosisko" style="width:100%;height:100%;object-fit:contain"/></div></div>';document.documentElement.appendChild(d);setTimeout(function(){if(d&&d.parentNode)d.parentNode.removeChild(d);},1350);}catch(e){}})();` }} />
        <SpeedOptimizer />
        <PWARegister />
        
          <AppProvider>
            {children}
          </AppProvider>
        
              <SessionDraftGuard />
          <GlobalAutoFocus />
      </body>
    </html>
  );
}
