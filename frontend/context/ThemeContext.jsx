'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeConfig, setThemeConfig] = useState({
    themePreset: 'cyberpunk',
    dashboardBg: '#020617',
    sidebarBg: '#0f172a',
    accentColor: '#00f3ff',
    cardBgColor: 'rgba(255, 255, 255, 0.05)',
    textColor: '#f8fafc',
    bgImage: '',
    
    sidebarFontSize: 13,
    dashboardFontSize: 14,
    headerTitleFontSize: 24,
    cardTitleFontSize: 16,

    sidebarWidth: 260,
    gridGap: 20,
    cardPadding: 20,
    
    enterpriseName: 'Tata Motors Enterprise',
    godModeLabel: '👑 GOD-MODE SUPER ADMIN',
    logoText: 'K',
    logoImg: '',
    faviconImg: '',
    
    sidebarPosition: 'left',
    isSidebarCollapsed: false,
    hideHeader: false,
    hideSidebar: false,
    hideBorders: false,
    showGodMode: true,
    
    show3DCanvas: true,
    showAnalytics: true,
    showHighlights: true,
    showLogs: true,
    enableGlassmorphism: true,
    enableGlowEffects: true,
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('kosisko_enterprise_master_v8');
    if (savedConfig) {
      try {
        setThemeConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Config load error", e);
      }
    }
  }, []);

  // Favicon updater effect
  useEffect(() => {
    if (themeConfig.faviconImg) {
      let link = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = themeConfig.faviconImg;
    }
  }, [themeConfig.faviconImg]);

  const updateConfig = (newSettings) => {
    const updated = { ...themeConfig, ...newSettings };
    setThemeConfig(updated);

    try {
      localStorage.setItem('kosisko_enterprise_master_v8', JSON.stringify(updated));
    } catch (e) {
      console.warn("LocalStorage Quota warning. Saving without heavy base64.");
      try {
        const lightweightConfig = { 
          ...updated, 
          bgImage: updated.bgImage?.startsWith('data:') ? '' : updated.bgImage,
          logoImg: updated.logoImg?.startsWith('data:') ? '' : updated.logoImg,
          faviconImg: updated.faviconImg?.startsWith('data:') ? '' : updated.faviconImg
        };
        localStorage.setItem('kosisko_enterprise_master_v8', JSON.stringify(lightweightConfig));
      } catch (innerErr) {
        console.error("Storage Error:", innerErr);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ themeConfig, updateConfig }}>
      <div 
        style={{ 
          backgroundColor: themeConfig.dashboardBg,
          backgroundImage: themeConfig.bgImage ? `url(${themeConfig.bgImage})` : 'none',
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          color: themeConfig.textColor,
          fontSize: `${themeConfig.dashboardFontSize}px`
        }} 
        className="transition-all duration-200 min-h-screen relative font-sans overflow-x-hidden"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);