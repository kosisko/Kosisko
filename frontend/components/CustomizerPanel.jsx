'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function CustomizerPanel({ isOpen, onClose }) {
  const { themeConfig, updateConfig } = useTheme();
  const panelRef = useRef(null);
  const [isPanelHovered, setIsPanelHovered] = useState(true);

  // डैशबोर्ड पर बाहर क्लिक करने पर ऑटोमैटिक क्लोज
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 5 MB फ़ाइल साइज़ लिमिट चेंकर और कंप्रेसर
  const processImageUpload = (file, key, isLogo = false) => {
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Limit

    if (file.size > MAX_SIZE_BYTES) {
      alert(`⚠️ फ़ाइल साइज़ ${(file.size / (1024 * 1024)).toFixed(2)} MB है। 5 MB से बड़ी फ़ाइल अपलोड नहीं की जा सकती।`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = isLogo ? 500 : 1600;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (isLogo) {
          ctx.clearRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = isLogo ? 'image/png' : 'image/jpeg';
        const finalBase64 = canvas.toDataURL(mimeType, 0.85);

        updateConfig({ [key]: finalBase64 });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleBgFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) processImageUpload(file, 'bgImage', false);
  };

  const handleLogoFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) processImageUpload(file, 'logoImg', true);
  };

  const handleFaviconFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) processImageUpload(file, 'faviconImg', true);
  };

  // 50 Enterprise Themes Presets
  const themePresets = {
    cyberpunk: { name: '1. Cyberpunk Neon', bg: '#020617', side: '#0f172a', accent: '#00f3ff' },
    deep_dark: { name: '2. Deep Obsidian', bg: '#000000', side: '#0a0a0a', accent: '#6366f1' },
    midnight: { name: '3. Midnight Blue', bg: '#0b1329', side: '#111c38', accent: '#38bdf8' },
    sunset: { name: '4. Sunset Gold', bg: '#180c04', side: '#281408', accent: '#f59e0b' },
    matrix: { name: '5. Matrix Terminal', bg: '#02200f', side: '#033b1b', accent: '#10b981' },
    royal: { name: '6. Royal Purple', bg: '#0f071f', side: '#1a0d33', accent: '#a855f7' },
    rose: { name: '7. Neon Rose', bg: '#1f070f', side: '#330d1a', accent: '#f43f5e' },
    emerald: { name: '8. Emerald Forest', bg: '#021a14', side: '#042f24', accent: '#34d399' },
    crimson: { name: '9. Crimson Red', bg: '#1a0505', side: '#2d0a0a', accent: '#ef4444' },
    amber: { name: '10. Amber Glow', bg: '#1c1202', side: '#332104', accent: '#fbbf24' },
    slate: { name: '11. Titanium Slate', bg: '#0f172a', side: '#1e293b', accent: '#94a3b8' },
    coffee: { name: '12. Espresso Coffee', bg: '#140c08', side: '#24160f', accent: '#d97706' },
    arctic: { name: '13. Arctic Ice', bg: '#08131a', side: '#0f222e', accent: '#22d3ee' },
    neon_violet: { name: '14. Neon Violet', bg: '#13071f', side: '#210d38', accent: '#c084fc' },
    plasma: { name: '15. Plasma Pink', bg: '#1f0718', side: '#380d2d', accent: '#ec4899' },
    solar: { name: '16. Solar Flare', bg: '#1c0a02', side: '#331304', accent: '#f97316' },
    cyber_yellow: { name: '17. Cyber Yellow', bg: '#1a1802', side: '#302c04', accent: '#eab308' },
    hacker: { name: '18. Hacker Green', bg: '#011c08', side: '#023310', accent: '#22c55e' },
    deep_space: { name: '19. Deep Space', bg: '#050514', side: '#0a0a24', accent: '#818cf8' },
    minimal_light: { name: '20. Clean Light Mode', bg: '#f8fafc', side: '#e2e8f0', accent: '#0284c7' },
    obsidian_gold: { name: '21. Obsidian Gold', bg: '#080808', side: '#141414', accent: '#d4af37' },
    neon_teal: { name: '22. Neon Teal', bg: '#021217', side: '#05222b', accent: '#06b6d4' },
    carbon: { name: '23. Carbon Fiber', bg: '#111111', side: '#1c1c1c', accent: '#a855f7' },
    tokyo_night: { name: '24. Tokyo Night', bg: '#1a1b26', side: '#24283b', accent: '#7aa2f7' },
    dracula: { name: '25. Dracula Dark', bg: '#282a36', side: '#44475a', accent: '#ff79c6' },
    nordic: { name: '26. Nordic Frost', bg: '#2e3440', side: '#3b4252', accent: '#88c0d0' },
    solarized: { name: '27. Solarized Dark', bg: '#002b36', side: '#073642', accent: '#2aa198' },
    synthwave: { name: '28. Synthwave 84', bg: '#241b2f', side: '#34294f', accent: '#ff7edb' },
    monokai: { name: '29. Monokai Pro', bg: '#2d2a2e', side: '#403e41', accent: '#ffd866' },
    matrix_red: { name: '30. Matrix Red-Eye', bg: '#1c0202', side: '#330505', accent: '#ff3333' },
    azure: { name: '31. Azure Horizon', bg: '#031b33', side: '#072d54', accent: '#3b82f6' },
    bordeaux: { name: '32. Bordeaux Wine', bg: '#210915', side: '#381025', accent: '#e11d48' },
    lime_tech: { name: '33. Lime Tech', bg: '#0a1f02', side: '#123804', accent: '#84cc16' },
    copper: { name: '34. Antique Copper', bg: '#1c100a', side: '#301c13', accent: '#ea580c' },
    platinum: { name: '35. Platinum Elite', bg: '#121518', side: '#1e2329', accent: '#cbd5e1' },
    amethyst: { name: '36. Amethyst Glow', bg: '#140a1c', side: '#221130', accent: '#d946ef' },
    sapphire: { name: '37. Sapphire Night', bg: '#081026', side: '#0f1d42', accent: '#60a5fa' },
    peacock: { name: '38. Peacock Blue', bg: '#041c24', side: '#0a303d', accent: '#14b8a6' },
    velvet: { name: '39. Velvet Night', bg: '#17081c', side: '#2a0f33', accent: '#e879f9' },
    hyper_dark: { name: '40. Hyper-Dark OLED', bg: '#000000', side: '#030303', accent: '#ffffff' },
    laser_cyan: { name: '41. Laser Cyan Stream', bg: '#01151a', side: '#03262e', accent: '#00f0ff' },
    blood_moon: { name: '42. Blood Moon', bg: '#1a0003', side: '#2b0207', accent: '#ff003c' },
    golden_empire: { name: '43. Golden Empire', bg: '#1a1400', side: '#2e2303', accent: '#ffd700' },
    electric_violet: { name: '44. Electric Violet', bg: '#0d001a', side: '#1a0233', accent: '#9d00ff' },
    jade_matrix: { name: '45. Jade Matrix', bg: '#001a0e', side: '#02331d', accent: '#00ff88' },
    quantum_blue: { name: '46. Quantum Blue', bg: '#000d1a', side: '#021c38', accent: '#0088ff' },
    neon_coral: { name: '47. Neon Coral', bg: '#1a050d', side: '#330c1b', accent: '#ff5588' },
    cyber_bronze: { name: '48. Cyber Bronze', bg: '#140d05', side: '#26170a', accent: '#cd7f32' },
    ghost_white: { name: '49. Ghost White Suite', bg: '#f1f5f9', side: '#cbd5e1', accent: '#0284c7' },
    charlotte_pink: { name: '50. Charlotte Cyber Pink', bg: '#1a0013', side: '#2e0223', accent: '#ff00aa' },
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-end">
      <div 
        ref={panelRef}
        onMouseEnter={() => setIsPanelHovered(true)}
        onMouseLeave={() => setIsPanelHovered(false)}
        style={{
          opacity: isPanelHovered ? 1 : 0.4,
        }}
        className="pointer-events-auto h-full w-[460px] bg-slate-950/95 border-l border-cyan-500/40 p-6 shadow-2xl overflow-y-auto text-slate-100 text-xs transition-opacity duration-300"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-black text-cyan-400 flex items-center gap-2">
              🎛️ Enterprise Master Customizer (10 Sections)
            </h3>
            <p className="text-[10px] text-slate-400">Full White-Labeling • Click Outside to Close</p>
          </div>
          <button onClick={onClose} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold">✕ Close</button>
        </div>

        <div className="space-y-6 mt-5 pb-16">

          {/* SECTION 1: Ready Themes Presets */}
          <div>
            <label className="text-[11px] font-extrabold uppercase text-cyan-400 tracking-wider">1. Ready Themes (50 Presets)</label>
            <select
              value={themeConfig.themePreset || 'cyberpunk'}
              onChange={(e) => {
                const preset = themePresets[e.target.value];
                if (preset) {
                  updateConfig({
                    themePreset: e.target.value,
                    dashboardBg: preset.bg,
                    sidebarBg: preset.side,
                    accentColor: preset.accent,
                  });
                }
              }}
              className="w-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold outline-none cursor-pointer"
            >
              {Object.entries(themePresets).map(([key, val]) => (
                <option key={key} value={key}>{val.name}</option>
              ))}
            </select>
          </div>

          {/* SECTION 2: Dashboard Wallpaper Engine */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800">
            <label className="text-[11px] font-extrabold uppercase text-cyan-400 tracking-wider">2. Dashboard Wallpaper (Max 5MB)</label>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">📁 PC / मोबाइल से फोटो अपलोड करें</span>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleBgFileUpload}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-xs text-slate-300 cursor-pointer file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">🔗 या ऑनलाइन फोटो यूआरएल (URL) पेस्ट करें</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="https://..."
                  value={themeConfig.bgImage || ''}
                  onChange={(e) => updateConfig({ bgImage: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none placeholder:text-slate-600"
                />
                {themeConfig.bgImage && (
                  <button onClick={() => updateConfig({ bgImage: '' })} className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-bold shrink-0 hover:bg-red-500/30">
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: Enterprise White-Label Branding */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="text-[11px] font-extrabold uppercase text-cyan-400 tracking-wider">3. Enterprise Branding & Logo</label>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Company / Enterprise Name</span>
              <input 
                type="text" 
                value={themeConfig.enterpriseName || ''}
                onChange={(e) => updateConfig({ enterpriseName: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">God Mode Badge Text</span>
              <input 
                type="text" 
                value={themeConfig.godModeLabel || ''}
                onChange={(e) => updateConfig({ godModeLabel: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-amber-300 outline-none font-bold"
              />
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-cyan-300 font-bold block">Company Logo Customizer (Transparent PNG)</span>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Logo Text Initial (If no image)</span>
                <input 
                  type="text" 
                  maxLength={3}
                  value={themeConfig.logoText || ''}
                  onChange={(e) => updateConfig({ logoText: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none text-center font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">📁 PC / मोबाइल से लोगो अपलोड करें (Max 5MB)</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoFileUpload}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-xs text-slate-300 cursor-pointer file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">🔗 या ऑनलाइन लोगो यूआरएल (URL) पेस्ट करें</span>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="https://.../logo.png"
                    value={themeConfig.logoImg || ''}
                    onChange={(e) => updateConfig({ logoImg: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                  />
                  {themeConfig.logoImg && (
                    <button onClick={() => updateConfig({ logoImg: '' })} className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-bold shrink-0 hover:bg-red-500/30">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Favicon & Browser Tab Customizer */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800">
            <label className="text-[11px] font-extrabold uppercase text-cyan-400 tracking-wider">4. Favicon & Browser Tab Icon</label>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">📁 फ़ेविकॉन आइकॉन अपलोड करें (PNG/ICO - Max 5MB)</span>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFaviconFileUpload}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-1.5 text-xs text-slate-300 cursor-pointer file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-400"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">🔗 या फ़ेविकॉन URL पेस्ट करें</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="https://.../favicon.ico"
                  value={themeConfig.faviconImg || ''}
                  onChange={(e) => updateConfig({ faviconImg: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none"
                />
                {themeConfig.faviconImg && (
                  <button 
                    onClick={() => updateConfig({ faviconImg: '' })} 
                    className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-[10px] font-bold shrink-0 hover:bg-red-500/30 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 5: Granular Pixel Font Sizes */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="text-[11px] font-extrabold uppercase text-cyan-400 tracking-wider">5. Independent Font Sizes (In Pixels)</label>
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span>Sidebar / Menu Font Size</span>
                <span className="text-cyan-400 font-bold">{themeConfig.sidebarFontSize || 13}px</span>
              </div>
              <input type="range" min="10" max="22" value={themeConfig.sidebarFontSize || 13} onChange={(e) => updateConfig({ sidebarFontSize: Number(e.target.value) })} className="w-full accent-cyan-400 cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span>Main Dashboard Body Font Size</span>
                <span className="text-cyan-400 font-bold">{themeConfig.dashboardFontSize || 14}px</span>
              </div>
              <input type="range" min="11" max="24" value={themeConfig.dashboardFontSize || 14} onChange={(e) => updateConfig({ dashboardFontSize: Number(e.target.value) })} className="w-full accent-cyan-400 cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span>Header Main Title Size</span>
                <span className="text-cyan-400 font-bold">{themeConfig.headerTitleFontSize || 24}px</span>
              </div>
              <input type="range" min="18" max="40" value={themeConfig.headerTitleFontSize || 24} onChange={(e) => updateConfig({ headerTitleFontSize: Number(e.target.value) })} className="w-full accent-cyan-400 cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span>Cards / Widgets Header Size</span>
                <span className="text-cyan-400 font-bold">{themeConfig.cardTitleFontSize || 16}px</span>
              </div>
              <input type="range" min="12" max="28" value={themeConfig.cardTitleFontSize || 16} onChange={(e) => updateConfig({ cardTitleFontSize: Number(e.target.value) })} className="w-full accent-cyan-400 cursor-pointer" />
            </div>
          </div>

          {/* SECTION 6: Granular Spacing & Layout Controls */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <label className="text-[11px] font-extrabold uppercase text-cyan-400 tracking-wider">6. Granular Spacing Controls (Pixels)</label>
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span>Sidebar Menu Width</span>
                <span className="text-cyan-400 font-bold">{themeConfig.sidebarWidth || 260}px</span>
              </div>
              <input type="range" min="180" max="360" value={themeConfig.sidebarWidth || 260} onChange={(e) => updateConfig({ sidebarWidth: Number(e.target.value) })} className="w-full accent-cyan-400 cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span>Grid Gap Between Cards</span>
                <span className="text-cyan-400 font-bold">{themeConfig.gridGap || 20}px</span>
              </div>
              <input type="range" min="8" max="40" value={themeConfig.gridGap || 20} onChange={(e) => updateConfig({ gridGap: Number(e.target.value) })} className="w-full accent-cyan-400 cursor-pointer" />
            </div>
            <div>
              <div className="flex justify-between mb-1 text-[11px]">
                <span>Inside Card Padding</span>
                <span className="text-cyan-400 font-bold">{themeConfig.cardPadding || 20}px</span>
              </div>
              <input type="range" min="8" max="36" value={themeConfig.cardPadding || 20} onChange={(e) => updateConfig({ cardPadding: Number(e.target.value) })} className="w-full accent-cyan-400 cursor-pointer" />
            </div>
          </div>

          {/* SECTION 7: Color Palette Override */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800">
            <label className="text-[11px] font-extrabold uppercase text-cyan-400 tracking-wider">7. Color Palette Override</label>
            <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span>Main Dashboard BG</span>
              <input type="color" value={themeConfig.dashboardBg || '#020617'} onChange={(e) => updateConfig({ dashboardBg: e.target.value })} className="w-7 h-7 rounded border-none cursor-pointer bg-transparent" />
            </div>
            <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span>Sidebar Menu BG</span>
              <input type="color" value={themeConfig.sidebarBg || '#0f172a'} onChange={(e) => updateConfig({ sidebarBg: e.target.value })} className="w-7 h-7 rounded border-none cursor-pointer bg-transparent" />
            </div>
            <div className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span>Accent / Highlighter Color</span>
              <input type="color" value={themeConfig.accentColor || '#00f3ff'} onChange={(e) => updateConfig({ accentColor: e.target.value })} className="w-7 h-7 rounded border-none cursor-pointer bg-transparent" />
            </div>
          </div>

          {/* SECTION 8: Layout & Hide Toggles */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <label className="text-[11px] font-extrabold uppercase text-cyan-400 tracking-wider">8. Navigation & Layout Toggles</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {['left', 'right', 'top'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => updateConfig({ sidebarPosition: pos })}
                  className={`p-2 text-xs rounded-xl border capitalize font-bold ${
                    themeConfig.sidebarPosition === pos ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : 'border-slate-800 bg-slate-800/40 text-slate-400'
                  }`}
                >
                  {pos} Nav
                </button>
              ))}
            </div>

            {[
              { key: 'showGodMode', label: 'Show GOD-MODE Badge' },
              { key: 'hideHeader', label: 'Hide Main Top Header' },
              { key: 'hideSidebar', label: 'Hide Navigation Sidebar' },
              { key: 'hideBorders', label: 'Remove Card Borders' },
            ].map((item) => (
              <div key={item.key} className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={themeConfig[item.key] ?? true}
                  onChange={(e) => updateConfig({ [item.key]: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* SECTION 9: Bento Grid Widget Visibility Control (Restored & Enhanced) */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <label className="text-[11px] font-extrabold uppercase text-cyan-400 tracking-wider">9. Bento Grid Widget Visibility</label>
            {[
              { key: 'show3DCanvas', label: 'Show 3D Spatial Canvas' },
              { key: 'showAnalytics', label: 'Show Real-Time ECharts' },
              { key: 'showHighlights', label: 'Show Module Highlights Box' },
              { key: 'showLogs', label: 'Show AI System Logs' },
            ].map((item) => (
              <div key={item.key} className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={themeConfig[item.key] ?? true}
                  onChange={(e) => updateConfig({ [item.key]: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </div>
            ))}
          </div>

          {/* SECTION 10: Advanced UI Glassmorphism & Effects */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <label className="text-[11px] font-extrabold uppercase text-cyan-400 tracking-wider">10. Advanced Visual Effects</label>
            {[
              { key: 'enableGlassmorphism', label: 'Enable Glassmorphism Blur' },
              { key: 'enableGlowEffects', label: 'Enable Cyan Glow Effects' },
            ].map((item) => (
              <div key={item.key} className="flex justify-between items-center bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={themeConfig[item.key] ?? true}
                  onChange={(e) => updateConfig({ [item.key]: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}