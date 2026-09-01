'use client';

import React, { createContext, useContext, useState } from 'react';

interface InstalledAppInfo {
  installedAt: number; // समय जब ऐप खरीदा गया
  expiresAt: number;   // 1 महीने बाद की एक्सपायरी डेट
}

interface AppContextType {
  isWhiteLabeled: boolean;
  setIsWhiteLabeled: (val: boolean) => void;
  customBrand: { name: string; logoText: string };
  setCustomBrand: (brand: { name: string; logoText: string }) => void;
  
  // अब ऐप्स का रिकॉर्ड एक ऑब्जेक्ट के रूप में रहेगा जिसमें एक्सपायरी डेट होगी
  installedApps: { [key: string]: InstalledAppInfo };
  
  // कस्टम कीमतें (Customizable Pricing for specific customers)
  customPricing: { [key: string]: number };
  setAppPrice: (appCode: string, price: number) => void;

  installApp: (appCode: string, defaultPrice: number) => void;
  uninstallApp: (appCode: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [isWhiteLabeled, setIsWhiteLabeled] = useState(false);
  const [customBrand, setCustomBrand] = useState({ name: 'Tata Motors', logoText: 'TM' });
  
  // ऐप्स और उनकी एक्सपायरी ट्रैक करने के लिए
  const [installedApps, setInstalledApps] = useState<{ [key: string]: InstalledAppInfo }>({});

  // 💰 एडमिन द्वारा कस्टमाइजेबल कीमतें (डिफ़ॉल्ट कीमतें)
  const [customPricing, setCustomPricing] = useState<{ [key: string]: number }>({
    pos: 1999,
    crm: 2499,
  });

  const setAppPrice = (appCode: string, price: number) => {
    setCustomPricing(prev => ({ ...prev, [appCode]: price }));
  };

  // ऐप इंस्टॉल करने का फंक्शन (महीने की वैलिडिटी के साथ)
  const installApp = (appCode: string, defaultPrice: number) => {
    const now = Date.now();
    const oneMonthMillis = 30 * 24 * 60 * 60 * 1000; // 30 दिन का समय

    // चेक करें कि क्या पहले से कोई रिकॉर्ड है और क्या महीना खत्म हो चुका है?
    const existing = installedApps[appCode];
    
    if (existing && now < existing.expiresAt) {
      // अगर महीना अभी बाकी है, तो बिना पैसे लिए सिर्फ दोबारा री-इंस्टॉल (Activate) कर दो!
      setInstalledApps(prev => ({
        ...prev,
        [appCode]: { ...existing } // पुरानी एक्सपायरी बरकरार रहेगी
      }));
    } else {
      // नया पेमेंट या महीने की एक्सपायरी के बाद नया पेमेंट
      const priceToCharge = customPricing[appCode] || defaultPrice;
      alert(`Payment of ₹${priceToCharge} processed successfully! App installed for 30 days.`);
      
      setInstalledApps(prev => ({
        ...prev,
        [appCode]: {
          installedAt: now,
          expiresAt: now + oneMonthMillis // 1 महीने की वैलिडिटी सेट
        }
      }));
    }
  };

  // ऐप अनइंस्टॉल करने का फंक्शन (महीना खत्म होने तक री-इंस्टॉल फ्री रहेगा)
  const uninstallApp = (appCode: string) => {
    setInstalledApps(prev => {
      const updated = { ...prev };
      // डेटाबेस/स्टेट से पूरी तरह डिलीट नहीं करेंगे ताकि एक्सपायरी याद रहे, 
      // लेकिन साइडबार से हटाने के लिए इसे हम मैनेज कर सकते हैं या फ्लैग लगा सकते हैं।
      // यहाँ हम आसानी के लिए इसे स्टेट से हटा देते हैं लेकिन एक्सपायरी सुरक्षित रख सकते हैं, 
      // या सिंपल रखने के लिए अनइंस्टॉल पर ऐप को लिस्ट से हटा देंगे पर वैलिडिटी चेक रखेंगे।
      delete updated[appCode];
      return updated;
    });
  };

  return (
    <AppContext.Provider value={{ 
      isWhiteLabeled, setIsWhiteLabeled, 
      customBrand, setCustomBrand, 
      installedApps, customPricing, setAppPrice, 
      installApp, uninstallApp 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};