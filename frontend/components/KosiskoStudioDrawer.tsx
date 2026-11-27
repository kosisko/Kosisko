'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  KOSISKO_TEXTURES_REGISTRY,
  ENGLISH_FONTS,
  FEATURE_SWITCHES,
  PRESET_THEMES,
  PresetThemeItem,
  TextureDefinition,
} from '@/config/kosiskoModules';

export type ColorZoneKey = 'accent' | 'canvas' | 'sidebar' | 'topbar' | 'cards' | 'borders';
export type BeamModeType = 'off' | 'hero' | 'all' | 'custom';
export type SidebarStyleMode = 'expanded' | 'compact' | 'floating';
export type MotionVelocityType = 'instant' | 'crisp' | 'fluid';
export type StudioTabKey = 'themes' | 'colors' | 'textures' | 'brand' | 'typography' | 'layout' | 'features';

export interface KosiskoStudioState {
  activeThemeId: string;
  zones: Record<ColorZoneKey, string>;
  manualTextHex: string | null;
  bgTexture: string;
  textureCustomColor: string | null;
  textureScale: number;
  textureOpacity: number;
  customTextures: { id: string; name: string; tag: string; css: string }[];
  beamMode: BeamModeType;
  beamSpeedKey: 'calm' | 'exec' | 'turbo';
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  sidebarMode: SidebarStyleMode;
  navPosition: 'left' | 'right' | 'top';
  sidebarWidth: number;
  gridGap: number;
  cardPadding: number;
  headerTitleSize: number;
  removeCardBorders: boolean;
  dashboardWallpaper: string;
  wallpaperOpacity: number;
  customLogoUrl: string;
  customFaviconUrl: string;
  workspaceWidth: 'full' | 'centered';
  idleLogoutMinutes: number;
  cardRadius: number;
  glassBlur: number;
  velocity: MotionVelocityType;
  features: Record<string, boolean>;
}

export const DEFAULT_STUDIO_STATE: KosiskoStudioState = {
  activeThemeId: 'obsidian-gold',
  zones: {
    accent: '#F59E0B',
    canvas: '#07090E',
    sidebar: 'auto',
    topbar: 'auto',
    cards: 'auto',
    borders: 'auto',
  },
  manualTextHex: null,
  bgTexture: 'solid',
  textureCustomColor: null,
  textureScale: 28,
  textureOpacity: 100,
  customTextures: [],
  beamMode: 'hero',
  beamSpeedKey: 'exec',
  fontFamily: 'Plus Jakarta Sans',
  fontSize: 14,
  fontWeight: 400,
  fontStyle: 'normal',
  sidebarMode: 'expanded',
  navPosition: 'left',
  sidebarWidth: 252,
  gridGap: 16,
  cardPadding: 20,
  headerTitleSize: 26,
  removeCardBorders: false,
  dashboardWallpaper: '',
  wallpaperOpacity: 45,
  customLogoUrl: '',
  customFaviconUrl: '',
  workspaceWidth: 'full',
  idleLogoutMinutes: 30,
  cardRadius: 16,
  glassBlur: 18,
  velocity: 'crisp',
  features: {
    aurora: true,
    spotlight: true,
    glass: true,
    celebrationAnim: true,
    magneticHover: true,
    shimmerSweep: true,
    rollingNumbers: true,
    kinetic: true,
    sound: true,
    aiCopilot: true,
    multiTab: true,
    pulseTicker: true,
    zenFocus: false,
    circadian: false,
    compactDensity: false,
    whiteLabelBrand: false,
  },
};

const ZONE_LABELS: Record<ColorZoneKey, string> = {
  accent: 'Primary Accent Color',
  canvas: 'Main Canvas Background',
  sidebar: 'Left Sidebar Only',
  topbar: 'Top Header Bar Only',
  cards: 'Cards & Boxes Only',
  borders: 'Borders & Dividers Only',
};

const CURATED_SWATCHES = [
  { name: '24K Gold', hex: '#F59E0B' },
  { name: 'Cyber Emerald', hex: '#10B981' },
  { name: 'Electric Cyan', hex: '#06B6D4' },
  { name: 'Royal Sapphire', hex: '#2563EB' },
  { name: 'Crimson Nova', hex: '#EF4444' },
  { name: 'Pitch Obsidian', hex: '#07090E' },
  { name: 'Midnight Navy', hex: '#0A1935' },
  { name: 'Deep Forest', hex: '#07221B' },
  { name: 'Royal Plum', hex: '#1C0D2E' },
  { name: 'Pure Daylight', hex: '#F8FAFC' },
];

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r1 = 0, g1 = 0, b1 = 0;
  if (h >= 0 && h < 60) { r1 = c; g1 = x; }
  else if (h < 120) { r1 = x; g1 = c; }
  else if (h < 180) { g1 = c; b1 = x; }
  else if (h < 240) { g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

function hexToHsv(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h: Math.round(h), s: max === 0 ? 0 : d / max, v: max };
}

function getLuminance(r: number, g: number, b: number) {
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

export function resolveEffectiveZoneHex(st: KosiskoStudioState, key: ColorZoneKey): string {
  const val = st.zones[key];
  if (val && val !== 'auto') return val;
  const base = hexToRgb(st.zones.canvas) || { r: 7, g: 9, b: 14 };
  const isLight = getLuminance(base.r, base.g, base.b) > 0.36;
  if (key === 'sidebar' || key === 'topbar') {
    return rgbToHex(
      Math.min(255, base.r + (isLight ? 4 : 7)),
      Math.min(255, base.g + (isLight ? 4 : 9)),
      Math.min(255, base.b + (isLight ? 4 : 14))
    );
  }
  if (key === 'cards') {
    return rgbToHex(
      Math.min(255, base.r + (isLight ? 7 : 13)),
      Math.min(255, base.g + (isLight ? 7 : 17)),
      Math.min(255, base.b + (isLight ? 7 : 25))
    );
  }
  if (key === 'borders') return isLight ? '#CBD5E1' : '#334155';
  return st.zones.canvas;
}

const loadedFonts = new Set(['Inter', 'Plus Jakarta Sans', 'JetBrains Mono']);
export function ensureGoogleFontLoaded(fontName: string) {
  if (typeof document === 'undefined' || loadedFonts.has(fontName)) return;
  const meta = ENGLISH_FONTS.find((f) => f.name === fontName);
  if (meta?.system) return;
  loadedFonts.add(fontName);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap`;
  document.head.appendChild(link);
}

export function applyStudioTokensToDocument(st: KosiskoStudioState) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const accRgb = hexToRgb(st.zones.accent) || { r: 245, g: 158, b: 11 };
  root.style.setProperty('--accent', st.zones.accent);
  root.style.setProperty('--accent-rgb', `${accRgb.r}, ${accRgb.g}, ${accRgb.b}`);
  root.style.setProperty(
    '--accent-contrast',
    getLuminance(accRgb.r, accRgb.g, accRgb.b) > 0.42 ? '#07090E' : '#FFFFFF'
  );

  const bgRgb = hexToRgb(st.zones.canvas) || { r: 7, g: 9, b: 14 };
  const isCanvasLight = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b) > 0.36;
  root.style.setProperty('--bg-base', st.zones.canvas);
  root.style.setProperty(
    '--bg-outer',
    `rgb(${Math.max(0, bgRgb.r - (isCanvasLight ? 14 : 4))}, ${Math.max(0, bgRgb.g - (isCanvasLight ? 14 : 4))}, ${Math.max(0, bgRgb.b - (isCanvasLight ? 12 : 5))})`
  );

  if (st.manualTextHex) {
    root.style.setProperty('--text-primary', st.manualTextHex);
  } else {
    root.style.setProperty('--text-primary', isCanvasLight ? '#0B1120' : '#F8FAFC');
    root.style.setProperty('--text-muted', isCanvasLight ? '#475569' : '#94A3B8');
  }

  const sbRgb = hexToRgb(resolveEffectiveZoneHex(st, 'sidebar')) || bgRgb;
  const isSbLight = getLuminance(sbRgb.r, sbRgb.g, sbRgb.b) > 0.36;
  root.style.setProperty('--sidebar-bg', `rgba(${sbRgb.r}, ${sbRgb.g}, ${sbRgb.b}, 0.94)`);
  root.style.setProperty('--sidebar-text', isSbLight ? '#0B1120' : '#F8FAFC');
  root.style.setProperty('--sidebar-muted', isSbLight ? '#475569' : '#94A3B8');
  root.style.setProperty('--sidebar-border', isSbLight ? 'rgba(15, 23, 42, 0.11)' : 'rgba(255, 255, 255, 0.08)');

  const tbRgb = hexToRgb(resolveEffectiveZoneHex(st, 'topbar')) || bgRgb;
  const isTbLight = getLuminance(tbRgb.r, tbRgb.g, tbRgb.b) > 0.36;
  root.style.setProperty('--topbar-bg', `rgba(${tbRgb.r}, ${tbRgb.g}, ${tbRgb.b}, 0.92)`);
  root.style.setProperty('--topbar-text', isTbLight ? '#0B1120' : '#F8FAFC');
  root.style.setProperty('--topbar-muted', isTbLight ? '#475569' : '#94A3B8');
  root.style.setProperty('--topbar-border', isTbLight ? 'rgba(15, 23, 42, 0.11)' : 'rgba(255, 255, 255, 0.08)');

  const cardRgb = hexToRgb(resolveEffectiveZoneHex(st, 'cards')) || bgRgb;
  const isCardLight = getLuminance(cardRgb.r, cardRgb.g, cardRgb.b) > 0.36;
  root.style.setProperty('--surface-2', `rgba(${cardRgb.r}, ${cardRgb.g}, ${cardRgb.b}, 0.88)`);
  root.style.setProperty('--surface-1', `rgba(${Math.max(0, cardRgb.r - 6)}, ${Math.max(0, cardRgb.g - 6)}, ${Math.max(0, cardRgb.b - 8)}, 0.90)`);
  root.style.setProperty('--surface-input', `rgba(${Math.max(0, cardRgb.r - 12)}, ${Math.max(0, cardRgb.g - 12)}, ${Math.max(0, cardRgb.b - 14)}, 0.94)`);
  root.style.setProperty('--surface-popover', `rgba(${cardRgb.r}, ${cardRgb.g}, ${cardRgb.b}, 0.98)`);
  root.style.setProperty('--card-text', st.manualTextHex || (isCardLight ? '#0B1120' : '#F8FAFC'));
  root.style.setProperty('--card-muted', isCardLight ? '#475569' : '#94A3B8');

  if (st.zones.borders === 'auto') {
    root.style.setProperty('--border-color', isCanvasLight ? 'rgba(15, 23, 42, 0.10)' : 'rgba(255, 255, 255, 0.09)');
    root.style.setProperty('--border-strong', isCanvasLight ? 'rgba(15, 23, 42, 0.20)' : 'rgba(255, 255, 255, 0.18)');
  } else {
    const bRgb = hexToRgb(st.zones.borders) || { r: 245, g: 158, b: 11 };
    root.style.setProperty('--border-color', `rgba(${bRgb.r}, ${bRgb.g}, ${bRgb.b}, 0.45)`);
    root.style.setProperty('--border-strong', `rgba(${bRgb.r}, ${bRgb.g}, ${bRgb.b}, 0.85)`);
  }

  let stroke = isCanvasLight ? 'rgba(15, 23, 42, 0.075)' : 'rgba(255, 255, 255, 0.065)';
  if (st.textureCustomColor) {
    const tc = hexToRgb(st.textureCustomColor) || { r: 245, g: 158, b: 11 };
    stroke = `rgba(${tc.r}, ${tc.g}, ${tc.b}, 0.18)`;
  }
  const customFound = st.customTextures.find((t) => t.id === st.bgTexture);
  if (customFound) {
    root.style.setProperty('--bg-pattern-image', customFound.css);
  } else {
    const builtIn = KOSISKO_TEXTURES_REGISTRY.find((t) => t.id === st.bgTexture) || KOSISKO_TEXTURES_REGISTRY[0];
    root.style.setProperty('--bg-pattern-image', builtIn.buildCss(stroke));
  }
  root.style.setProperty('--bg-pattern-size', `${st.textureScale}px ${st.textureScale}px`);
  root.style.setProperty('--bg-pattern-opacity', (st.textureOpacity / 100).toFixed(2));

  ensureGoogleFontLoaded(st.fontFamily);
  root.style.setProperty('--os-font-family', `'${st.fontFamily}', 'Inter', system-ui, sans-serif`);
  root.style.setProperty('--os-font-size', `${st.fontSize}px`);
  root.style.setProperty('--os-font-weight', String(st.fontWeight));
  root.style.setProperty('--os-font-style', st.fontStyle || 'normal');
  root.style.setProperty('--radius-card', `${st.cardRadius}px`);
  root.style.setProperty('--glass-blur', `${st.glassBlur}px`);
  const padVal = st.features.compactDensity ? Math.max(12, (st.cardPadding || 20) - 6) : (st.cardPadding || 20);
  const gapVal = st.features.compactDensity ? Math.max(8, (st.gridGap || 16) - 4) : (st.gridGap || 16);
  root.style.setProperty('--card-pad', `${padVal}px`);
  root.style.setProperty('--grid-gap', `${gapVal}px`);
  root.style.setProperty('--sidebar-width', `${st.sidebarWidth || 252}px`);
  root.style.setProperty('--header-title-size', `${st.headerTitleSize || 26}px`);
  const hasWp = Boolean(st.dashboardWallpaper && st.dashboardWallpaper.trim());
  root.style.setProperty('--wallpaper-image', hasWp ? `url("${st.dashboardWallpaper}")` : 'none');
  root.style.setProperty('--wallpaper-opacity', ((st.wallpaperOpacity ?? 45) / 100).toFixed(2));
  document.body.classList.toggle('has-wallpaper', hasWp);
  document.body.classList.toggle('no-card-borders', !!st.removeCardBorders);

  if (st.customFaviconUrl && st.customFaviconUrl.trim()) {
    document.querySelectorAll("link[rel*='icon']").forEach((el) => el.parentNode?.removeChild(el));
    ['icon', 'shortcut icon', 'apple-touch-icon'].forEach((relName) => {
      const link = document.createElement('link');
      link.rel = relName;
      if (relName !== 'apple-touch-icon') link.type = 'image/png';
      link.href = st.customFaviconUrl;
      document.head.appendChild(link);
    });
  }

  if (st.velocity === 'instant') {
    root.style.setProperty('--anim-speed', '0ms');
    root.style.setProperty('--anim-ease', 'linear');
  } else if (st.velocity === 'fluid') {
    root.style.setProperty('--anim-speed', '440ms');
    root.style.setProperty('--anim-ease', 'cubic-bezier(0.22, 1, 0.36, 1)');
  } else {
    root.style.setProperty('--anim-speed', '220ms');
    root.style.setProperty('--anim-ease', 'cubic-bezier(0.16, 1, 0.3, 1)');
  }

  const speedMap = { calm: '6.5s', exec: '4.2s', turbo: '2.0s' };
  root.style.setProperty('--beam-speed', speedMap[st.beamSpeedKey] || '4.2s');
  document.body.classList.remove('beam-mode-off', 'beam-mode-hero', 'beam-mode-all', 'beam-mode-custom');
  document.body.classList.add(`beam-mode-${st.beamMode}`);

  document.body.classList.toggle('feat-spotlight', !!st.features.spotlight);
  document.body.classList.toggle('feat-glass', !!st.features.glass);
  document.body.classList.toggle('feat-kinetic', !!st.features.kinetic);
  document.body.classList.toggle('feat-magnetic', !!st.features.magneticHover);
  document.body.classList.toggle('feat-shimmer', !!st.features.shimmerSweep);
  document.body.classList.toggle('feat-zen', !!st.features.zenFocus);
  document.body.classList.toggle('workspace-centered', st.workspaceWidth === 'centered');
}


function compressImageFileToDataUrl(
  file: File,
  maxWidth: number,
  maxHeight: number,
  mimeType: 'image/jpeg' | 'image/png',
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result || ''));
      img.onload = () => {
        let w = img.width || maxWidth;
        let h = img.height || maxHeight;
        if (mimeType === 'image/png' && maxWidth <= 64) {
          w = 64;
          h = 64;
        } else if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL(mimeType, quality));
        } catch {
          resolve(String(reader.result || ''));
        }
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

interface SavedCustomTheme {
  id: string;
  name: string;
  snapshot: KosiskoStudioState;
}

interface Props {
  isOpen: boolean;
  initialTab: StudioTabKey;
  studio: KosiskoStudioState;
  onUpdate: (next: KosiskoStudioState) => void;
  onClose: () => void;
  onPlaySound: (type: 'click' | 'sweep' | 'chime') => void;
  onToast: (msg: string, ok?: boolean) => void;
}

export default function KosiskoStudioDrawer({
  isOpen,
  initialTab,
  studio,
  onUpdate,
  onClose,
  onPlaySound,
  onToast,
}: Props) {
  const [isPreviewingCanvas, setIsPreviewingCanvas] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsPreviewingCanvas(false);
      return;
    }
    const handleMove = (e: MouseEvent) => {
      const panelWidth = Math.min(490, window.innerWidth);
      const panelLeft = window.innerWidth - panelWidth;
      setIsPreviewingCanvas(e.clientX < panelLeft - 8);
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [open]);

  const [tab, setTab] = useState<StudioTabKey>(initialTab);
  const [themeCat, setThemeCat] = useState<string>('All');
  const [themeSearch, setThemeSearch] = useState('');
  const [customThemeName, setCustomThemeName] = useState('');
  const [savedCustomThemes, setSavedCustomThemes] = useState<SavedCustomTheme[]>([]);

  const [activeZone, setActiveZone] = useState<ColorZoneKey>('accent');
  const [hsv, setHsv] = useState<{ h: number; s: number; v: number }>({ h: 38, s: 0.95, v: 0.96 });
  const [fontSearch, setFontSearch] = useState('');
  const [fontCat, setFontCat] = useState<string>('All');
  const [customTexName, setCustomTexName] = useState('');
  const [customTexCss, setCustomTexCss] = useState('');
  const [dnaModalOpen, setDnaModalOpen] = useState(false);
  const [dnaInput, setDnaInput] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('kosisko_custom_themes_v1');
      if (raw) setSavedCustomThemes(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    const parsed = hexToHsv(resolveEffectiveZoneHex(studio, activeZone));
    if (parsed) setHsv(parsed);
  }, [activeZone]);

  useEffect(() => {
    if (!isOpen || tab !== 'colors') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = 380;
    const h = 156;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pure = hsvToRgb(hsv.h, 1, 1);
    ctx.fillStyle = `rgb(${pure.r}, ${pure.g}, ${pure.b})`;
    ctx.fillRect(0, 0, w, h);

    const wg = ctx.createLinearGradient(0, 0, w, 0);
    wg.addColorStop(0, 'rgba(255,255,255,1)');
    wg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = wg;
    ctx.fillRect(0, 0, w, h);

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, 'rgba(0,0,0,0)');
    bg.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }, [isOpen, tab, hsv]);

  const applyPresetTheme = (t: PresetThemeItem) => {
    onUpdate({
      ...studio,
      activeThemeId: t.id,
      manualTextHex: null,
      bgTexture: t.texture,
      zones: {
        accent: t.accent,
        canvas: t.canvas,
        sidebar: t.sidebar,
        topbar: t.topbar,
        cards: t.cards,
        borders: t.borders,
      },
    });
    onPlaySound('chime');
    onToast(`Applied "${t.name}" theme.`, true);
  };

  const handleSaveCustomTheme = () => {
    const name = customThemeName.trim();
    if (!name) {
      onToast('Enter a name for your Custom Theme.', false);
      return;
    }
    const id = 'custom_theme_' + Date.now();
    const nextList = [{ id, name, snapshot: { ...studio, activeThemeId: id } }, ...savedCustomThemes];
    setSavedCustomThemes(nextList);
    try {
      localStorage.setItem('kosisko_custom_themes_v1', JSON.stringify(nextList));
    } catch {}
    onUpdate({ ...studio, activeThemeId: id });
    setCustomThemeName('');
    onPlaySound('chime');
    onToast(`Custom Theme "${name}" saved permanently!`, true);
  };

  const handleDeleteCustomTheme = (id: string) => {
    const nextList = savedCustomThemes.filter((x) => x.id !== id);
    setSavedCustomThemes(nextList);
    try {
      localStorage.setItem('kosisko_custom_themes_v1', JSON.stringify(nextList));
    } catch {}
    onPlaySound('click');
  };

  const commitZoneHex = (hex: string) => {
    const parsed = hexToHsv(hex);
    if (!parsed) return;
    setHsv(parsed);
    onUpdate({
      ...studio,
      activeThemeId: 'custom',
      zones: { ...studio.zones, [activeZone]: hex.toUpperCase() },
    });
  };

  const handleCanvasPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    const rgb = hsvToRgb(hsv.h, s, v);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setHsv({ h: hsv.h, s, v });
    onUpdate({
      ...studio,
      activeThemeId: 'custom',
      zones: { ...studio.zones, [activeZone]: hex },
    });
  };

  if (!isOpen) return null;

  const effectiveHex = resolveEffectiveZoneHex(studio, activeZone);
  const filteredThemes = PRESET_THEMES.filter((t) => {
    const matchCat = themeCat === 'All' || t.category === themeCat;
    const q = themeSearch.trim().toLowerCase();
    return matchCat && (!q || t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  });

  const filteredFonts = ENGLISH_FONTS.filter((f) => {
    const matchCat = fontCat === 'All' || f.cat === fontCat;
    const q = fontSearch.trim().toLowerCase();
    return matchCat && (!q || f.name.toLowerCase().includes(q));
  });

  const allTextures: TextureDefinition[] = [
    ...KOSISKO_TEXTURES_REGISTRY,
    ...studio.customTextures.map((ct) => ({
      id: ct.id,
      name: ct.name,
      tag: ct.tag,
      buildCss: () => ct.css,
    })),
  ];

  const handleCopyDna = () => {
    const dna = JSON.stringify(studio);
    const ta = document.createElement('textarea');
    ta.value = dna;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
    onPlaySound('chime');
    onToast('Theme DNA JSON copied to clipboard.', true);
  };

  const handleApplyImportedDna = () => {
    try {
      const parsed = JSON.parse(dnaInput.trim());
      onUpdate({
        ...DEFAULT_STUDIO_STATE,
        ...parsed,
        zones: { ...DEFAULT_STUDIO_STATE.zones, ...(parsed.zones || {}) },
        features: { ...DEFAULT_STUDIO_STATE.features, ...(parsed.features || {}) },
      });
      setDnaModalOpen(false);
      setDnaInput('');
      onPlaySound('chime');
      onToast('Theme DNA applied across all workspace zones.', true);
    } catch {
      onToast('Invalid Theme DNA JSON string.', false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] pointer-events-none flex justify-end">
      <div
        onClick={onClose}
        className="flex-1 pointer-events-auto cursor-pointer bg-transparent"
        title="Click outside to close Studio Customizer"
      />
      <aside
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPreviewingCanvas(false)}
        className={`relative z-10 pointer-events-auto w-full max-w-[490px] bg-os-s1 border-l border-os-strong h-full flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-200 ${
          isPreviewingCanvas ? 'opacity-20 blur-[4px]' : 'opacity-100 backdrop-blur-2xl'
        }`}
      >
          {/* Header */}
          <div className="p-5 border-b border-os space-y-4 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-os-accent">
                  WORKSPACE APPEARANCE & PERSONALIZATION
                </span>
                <h2 className="text-lg font-extrabold text-os-primary mt-0.5">Studio Customizer</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-os-s2 border border-os text-os-muted hover:text-os-primary flex items-center justify-center cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 p-1 rounded-xl bg-os-input">
              {(['themes', 'colors', 'textures', 'brand', 'typography', 'layout', 'features'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setTab(k);
                    onPlaySound('click');
                  }}
                  className={`py-2 px-0.5 rounded-lg text-[10px] cursor-pointer transition-all truncate ${
                    tab === k ? 'bg-os-accent font-bold' : 'text-os-muted hover:text-os-primary font-semibold'
                  }`}
                >
                  {k === 'themes'
                    ? 'Themes'
                    : k === 'colors'
                    ? 'Zones'
                    : k === 'textures'
                    ? 'Textures'
                    : k === 'brand'
                    ? 'Brand'
                    : k === 'typography'
                    ? 'Fonts'
                    : k === 'layout'
                    ? 'Layout'
                    : 'Switches'}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* ===============================================================
                TAB 1: 48 PRE-DEFINED THEMES + CUSTOM THEME SAVER
                =============================================================== */}
            {tab === 'themes' && (
              <div className="space-y-4">
                {/* Save Current Configuration as Custom Theme */}
                <div className="p-4 rounded-2xl bg-os-s2 border border-os space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-os-accent">
                      + Save Current Look as Custom Theme
                    </span>
                    <span className="font-mono text-[10px] text-os-muted">
                      {savedCustomThemes.length} Saved
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customThemeName}
                      onChange={(e) => setCustomThemeName(e.target.value)}
                      placeholder="e.g. Ratan Signature Gold"
                      className="flex-1 px-3 py-2 rounded-xl bg-os-input text-xs"
                    />
                    <button
                      onClick={handleSaveCustomTheme}
                      className="px-3.5 py-2 rounded-xl bg-os-accent text-xs font-bold cursor-pointer shrink-0"
                    >
                      Save Theme
                    </button>
                  </div>

                  {savedCustomThemes.length > 0 && (
                    <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-os">
                      {savedCustomThemes.map((ct) => (
                        <div
                          key={ct.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                            studio.activeThemeId === ct.id ? 'pill-os-accent' : 'bg-os-input border-os'
                          }`}
                        >
                          <button
                            onClick={() => {
                              onUpdate({ ...ct.snapshot, activeThemeId: ct.id });
                              onPlaySound('chime');
                              onToast(`Applied custom theme "${ct.name}".`, true);
                            }}
                            className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                          >
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: ct.snapshot.zones.accent }}
                            />
                            <span className="text-xs font-bold text-os-primary truncate">{ct.name}</span>
                            <span className="font-mono text-[9px] text-os-muted">Custom</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCustomTheme(ct.id)}
                            className="text-[10px] font-mono text-rose-400 hover:underline cursor-pointer px-1"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search & Filter 48 Built-in Enterprise Themes */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={themeSearch}
                    onChange={(e) => setThemeSearch(e.target.value)}
                    placeholder="Search 48 pre-defined enterprise themes..."
                    className="w-full px-3.5 py-2 rounded-xl bg-os-input text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['All', 'Dark Luxury', 'Midnight & Cyber', 'Royal Jewel', 'Warm & Earth', 'Daylight Pro'].map(
                      (cat) => (
                        <button
                          key={cat}
                          onClick={() => setThemeCat(cat)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer ${
                            themeCat === cat
                              ? 'pill-os-accent'
                              : 'bg-os-s2 border border-os text-os-muted'
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* 48 Themes Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {filteredThemes.map((t) => {
                    const active = studio.activeThemeId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => applyPresetTheme(t)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all space-y-2 ${
                          active ? 'pill-os-accent' : 'bg-os-s2 border-os hover:border-os-strong'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/25"
                              style={{ backgroundColor: t.canvas }}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/25 -ml-1.5"
                              style={{ backgroundColor: t.sidebar === 'auto' ? t.canvas : t.sidebar }}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/25 -ml-1.5"
                              style={{ backgroundColor: t.accent }}
                            />
                          </div>
                          <span className="font-mono text-[9px] text-os-muted uppercase">{t.texture}</span>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-os-primary truncate">{t.name}</div>
                          <div className="text-[10px] text-os-muted truncate">{t.category}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 2: 6-ZONE PHOTOSHOP 2D HSV COLOR ENGINE
                =============================================================== */}
            {tab === 'colors' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-1.5">
                  {(['accent', 'canvas', 'sidebar', 'topbar', 'cards', 'borders'] as ColorZoneKey[]).map((zk) => {
                    const hex = resolveEffectiveZoneHex(studio, zk);
                    const raw = studio.zones[zk];
                    return (
                      <button
                        key={zk}
                        onClick={() => {
                          setActiveZone(zk);
                          onPlaySound('click');
                        }}
                        className={`p-2.5 rounded-xl text-left cursor-pointer transition-all ${
                          activeZone === zk ? 'pill-os-accent' : 'bg-os-s2 border border-os'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-[11px] font-bold truncate capitalize">
                            {zk === 'canvas' ? 'Canvas Bg' : zk === 'topbar' ? 'Top Bar' : zk}
                          </span>
                        </div>
                        <div className="font-mono text-[9px] opacity-80 mt-0.5 truncate">
                          {raw === 'auto' ? 'Auto' : raw}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 rounded-2xl bg-os-s2 border border-os space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-os-primary">
                      Editing: {ZONE_LABELS[activeZone]}
                    </span>
                    {['sidebar', 'topbar', 'cards', 'borders'].includes(activeZone) &&
                      studio.zones[activeZone] !== 'auto' && (
                        <button
                          onClick={() => {
                            onUpdate({
                              ...studio,
                              zones: { ...studio.zones, [activeZone]: 'auto' },
                            });
                            onPlaySound('click');
                          }}
                          className="px-2 py-0.5 rounded-md pill-os-accent font-mono text-[10px] font-bold cursor-pointer"
                        >
                          Reset Auto
                        </button>
                      )}
                  </div>

                  <div
                    className="relative w-full h-36 rounded-xl overflow-hidden border border-os-strong select-none cursor-crosshair"
                    onMouseDown={(e) => {
                      draggingRef.current = true;
                      handleCanvasPointer(e.clientX, e.clientY);
                    }}
                    onMouseMove={(e) => {
                      if (draggingRef.current) handleCanvasPointer(e.clientX, e.clientY);
                    }}
                    onMouseUp={() => {
                      if (draggingRef.current) {
                        draggingRef.current = false;
                        onPlaySound('click');
                      }
                    }}
                    onMouseLeave={() => {
                      draggingRef.current = false;
                    }}
                  >
                    <canvas ref={canvasRef} className="w-full h-full block" />
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.85)] pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-mono text-[10px] text-os-muted">
                      <span>Hue Spectrum (0° – 360°)</span>
                      <span>{hsv.h}°</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={hsv.h}
                      onChange={(e) => {
                        const h = parseInt(e.target.value, 10) || 0;
                        const rgb = hsvToRgb(h, hsv.s, hsv.v);
                        setHsv({ ...hsv, h });
                        onUpdate({
                          ...studio,
                          activeThemeId: 'custom',
                          zones: { ...studio.zones, [activeZone]: rgbToHex(rgb.r, rgb.g, rgb.b) },
                        });
                      }}
                      className="w-full hue-rainbow"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-9 h-9 rounded-xl border border-os-strong shrink-0"
                      style={{ backgroundColor: effectiveHex }}
                    />
                    <input
                      type="text"
                      value={effectiveHex}
                      maxLength={7}
                      onChange={(e) => {
                        const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value;
                        commitZoneHex(v);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-os-input font-mono text-xs uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {CURATED_SWATCHES.map((sw) => (
                      <button
                        key={sw.hex}
                        onClick={() => {
                          commitZoneHex(sw.hex);
                          onPlaySound('click');
                        }}
                        title={`${sw.name} (${sw.hex})`}
                        className="h-7 rounded-lg border border-os-strong cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: sw.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 3: CUSTOMIZABLE 10+ SURFACE TEXTURES STUDIO
                =============================================================== */}
            {tab === 'textures' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-os-s2 border border-os space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={studio.textureCustomColor || '#F59E0B'}
                        onChange={(e) =>
                          onUpdate({ ...studio, textureCustomColor: e.target.value })
                        }
                        className="w-8 h-8 rounded-lg bg-transparent border border-os-strong cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-bold text-os-primary">Texture Tint Color</div>
                        <div className="font-mono text-[10px] text-os-muted">
                          {studio.textureCustomColor || 'Auto Contrast'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdate({ ...studio, textureCustomColor: null })}
                      className="px-2.5 py-1 rounded-lg pill-os-accent font-mono text-[10px] font-bold cursor-pointer"
                    >
                      Auto Tint
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="text-os-muted">Pattern Scale</span>
                      <span className="text-os-primary font-bold">{studio.textureScale}px</span>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={64}
                      value={studio.textureScale}
                      onChange={(e) =>
                        onUpdate({ ...studio, textureScale: parseInt(e.target.value, 10) })
                      }
                      className="w-full token-slider"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="text-os-muted">Pattern Opacity</span>
                      <span className="text-os-primary font-bold">{studio.textureOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={100}
                      value={studio.textureOpacity}
                      onChange={(e) =>
                        onUpdate({ ...studio, textureOpacity: parseInt(e.target.value, 10) })
                      }
                      className="w-full token-slider"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {allTextures.map((t) => {
                    const active = t.id === studio.bgTexture;
                    const previewCss = t.buildCss(
                      studio.textureCustomColor || 'rgba(255,255,255,0.2)'
                    );
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          onUpdate({ ...studio, bgTexture: t.id });
                          onPlaySound('click');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-2 ${
                          active ? 'pill-os-accent' : 'bg-os-input border-os hover:border-os-strong'
                        }`}
                      >
                        <div
                          className="h-10 w-full rounded-lg border border-os bg-os-base"
                          style={{ backgroundImage: previewCss, backgroundSize: '18px 18px' }}
                        />
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-os-primary truncate">{t.name}</span>
                          <span className="font-mono text-[9px] text-os-muted shrink-0">{t.tag}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 rounded-2xl bg-os-s2 border border-os space-y-2.5">
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-os-accent">
                    + Add Custom SVG / CSS Pattern
                  </span>
                  <input
                    type="text"
                    value={customTexName}
                    onChange={(e) => setCustomTexName(e.target.value)}
                    placeholder="Pattern Name (e.g. Royal Lattice)"
                    className="w-full px-3 py-2 rounded-xl bg-os-input text-xs"
                  />
                  <input
                    type="text"
                    value={customTexCss}
                    onChange={(e) => setCustomTexCss(e.target.value)}
                    placeholder="CSS background-image or url(data:image/svg+xml,...)"
                    className="w-full px-3 py-2 rounded-xl bg-os-input font-mono text-[11px]"
                  />
                  <button
                    onClick={() => {
                      if (!customTexName.trim() || !customTexCss.trim()) {
                        onToast('Enter both pattern name and CSS/SVG string.', false);
                        return;
                      }
                      const id = 'custom_' + Date.now();
                      onUpdate({
                        ...studio,
                        bgTexture: id,
                        customTextures: [
                          ...studio.customTextures,
                          { id, name: customTexName.trim(), tag: 'Custom', css: customTexCss.trim() },
                        ],
                      });
                      setCustomTexName('');
                      setCustomTexCss('');
                      onPlaySound('chime');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-os-accent text-xs font-bold cursor-pointer"
                  >
                    Add & Apply Custom Texture
                  </button>
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 4: 116 ENGLISH FONTS (TIMES NEW ROMAN, SERIF, SCRIPT, ITALIC)
                =============================================================== */}

            {/* ===============================================================
                TAB: BRANDING, LOGO, FAVICON & WALLPAPER
                =============================================================== */}
            {tab === 'brand' && (
              <div className="space-y-4">
                {/* 1. Dashboard Wallpaper */}
                <div className="p-4 rounded-2xl bg-os-s2 border border-os space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-os-accent">
                      1. Dashboard Background Wallpaper
                    </span>
                    {studio.dashboardWallpaper && (
                      <button
                        onClick={() => onUpdate({ ...studio, dashboardWallpaper: '' })}
                        className="text-[10px] font-mono text-rose-400 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const dataUrl = await compressImageFileToDataUrl(file, 1600, 900, 'image/jpeg', 0.80);
                      if (dataUrl) {
                        onUpdate({ ...studio, dashboardWallpaper: dataUrl });
                        onPlaySound('chime');
                        onToast('Dashboard wallpaper applied & saved!', true);
                      }
                    }}
                    className="w-full text-xs text-os-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-os-input file:text-os-primary file:font-semibold cursor-pointer"
                  />

                  <input
                    type="text"
                    value={studio.dashboardWallpaper?.startsWith('data:') ? '' : studio.dashboardWallpaper || ''}
                    onChange={(e) => onUpdate({ ...studio, dashboardWallpaper: e.target.value })}
                    placeholder="Or paste wallpaper image URL (https://...)"
                    className="w-full px-3 py-2 rounded-xl bg-os-input text-xs"
                  />

                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="text-os-muted">Wallpaper Opacity</span>
                      <span className="text-os-primary font-bold">{studio.wallpaperOpacity ?? 45}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={80}
                      value={studio.wallpaperOpacity ?? 45}
                      onChange={(e) =>
                        onUpdate({ ...studio, wallpaperOpacity: parseInt(e.target.value, 10) })
                      }
                      className="w-full token-slider"
                    />
                  </div>
                </div>

                {/* 2. Company Logo Customizer */}
                <div className="p-4 rounded-2xl bg-os-s2 border border-os space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-os-primary">
                      2. Company Logo (Transparent PNG)
                    </span>
                    {studio.customLogoUrl && (
                      <button
                        onClick={() => onUpdate({ ...studio, customLogoUrl: '' })}
                        className="text-[10px] font-mono text-rose-400 hover:underline cursor-pointer"
                      >
                        Reset Default K
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        onUpdate({ ...studio, customLogoUrl: String(reader.result || '') });
                        onPlaySound('chime');
                        onToast('Company logo updated in workspace header!', true);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full text-xs text-os-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-os-input file:text-os-primary file:font-semibold cursor-pointer"
                  />

                  <input
                    type="text"
                    value={studio.customLogoUrl?.startsWith('data:') ? '' : studio.customLogoUrl || ''}
                    onChange={(e) => onUpdate({ ...studio, customLogoUrl: e.target.value })}
                    placeholder="Or paste PNG logo URL (https://.../logo.png)"
                    className="w-full px-3 py-2 rounded-xl bg-os-input text-xs"
                  />
                </div>

                {/* 3. Browser Tab Favicon */}
                <div className="p-4 rounded-2xl bg-os-s2 border border-os space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-os-primary">
                      3. Browser Tab Favicon Icon
                    </span>
                    {studio.customFaviconUrl && (
                      <button
                        onClick={() => onUpdate({ ...studio, customFaviconUrl: '' })}
                        className="text-[10px] font-mono text-rose-400 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/png,image/x-icon,image/svg+xml"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const png64 = await compressImageFileToDataUrl(file, 64, 64, 'image/png', 1);
                      if (png64) {
                        onUpdate({ ...studio, customFaviconUrl: png64 });
                        onPlaySound('chime');
                        onToast('Browser tab favicon locked & saved!', true);
                      }
                    }}
                    className="w-full text-xs text-os-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-os-input file:text-os-primary file:font-semibold cursor-pointer"
                  />

                  <input
                    type="text"
                    value={studio.customFaviconUrl?.startsWith('data:') ? '' : studio.customFaviconUrl || ''}
                    onChange={(e) => onUpdate({ ...studio, customFaviconUrl: e.target.value })}
                    placeholder="Or paste favicon URL (https://.../favicon.ico)"
                    className="w-full px-3 py-2 rounded-xl bg-os-input text-xs"
                  />
                </div>
              </div>
            )}

            {tab === 'typography' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span className="text-os-muted">Font Size</span>
                    <span className="text-os-primary font-bold">{studio.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={18}
                    value={studio.fontSize}
                    onChange={(e) =>
                      onUpdate({ ...studio, fontSize: parseInt(e.target.value, 10) })
                    }
                    className="w-full token-slider"
                  />
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {[300, 400, 500, 600, 700].map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        onUpdate({ ...studio, fontWeight: w });
                        onPlaySound('click');
                      }}
                      className={`py-1.5 rounded-lg text-[11px] cursor-pointer ${
                        studio.fontWeight === w
                          ? 'pill-os-accent font-bold'
                          : 'border border-os bg-os-s2 text-os-muted'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      onUpdate({
                        ...studio,
                        fontStyle: studio.fontStyle === 'italic' ? 'normal' : 'italic',
                      });
                      onPlaySound('click');
                    }}
                    className={`py-1.5 rounded-lg text-[11px] italic cursor-pointer ${
                      studio.fontStyle === 'italic'
                        ? 'pill-os-accent font-bold'
                        : 'border border-os bg-os-s2 text-os-muted'
                    }`}
                  >
                    Italic
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-os-s2 border border-os flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      value={studio.manualTextHex || '#F8FAFC'}
                      onChange={(e) => onUpdate({ ...studio, manualTextHex: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border border-os-strong cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-os-primary">Custom Text Color</div>
                      <div className="font-mono text-[10px] text-os-muted">
                        {studio.manualTextHex || 'Auto Contrast'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdate({ ...studio, manualTextHex: null })}
                    className="px-2.5 py-1 rounded-lg pill-os-accent font-mono text-[10px] font-bold cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <input
                  type="text"
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  placeholder="Search 116 fonts (Times New Roman, Georgia, Script, Sans)..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-os-input text-xs"
                />

                <div className="flex flex-wrap gap-1.5">
                  {['All', 'Sans', 'Serif', 'Stylish/Script', 'Tech/Display', 'Mono'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setFontCat(c)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer ${
                        fontCat === c
                          ? 'pill-os-accent'
                          : 'bg-os-s2 border border-os text-os-muted'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {filteredFonts.map((f) => {
                    const active = f.name === studio.fontFamily;
                    return (
                      <button
                        key={f.name}
                        onClick={() => {
                          ensureGoogleFontLoaded(f.name);
                          onUpdate({ ...studio, fontFamily: f.name });
                          onPlaySound('click');
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left cursor-pointer flex items-center justify-between ${
                          active ? 'pill-os-accent' : 'bg-os-s2 border-os hover:border-os-strong'
                        }`}
                      >
                        <div>
                          <div
                            className="text-xs font-bold text-os-primary"
                            style={{ fontFamily: `'${f.name}', serif` }}
                          >
                            {f.name}
                          </div>
                          <div className="text-[10px] text-os-muted">
                            {f.cat} {f.system ? '• Classic System' : ''} • AaBbCc 0123
                          </div>
                        </div>
                        <span className="font-mono text-[9px] uppercase">
                          {active ? 'Active' : 'Apply'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 5: LAYOUT & VELOCITY
                =============================================================== */}
            {tab === 'layout' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className="block font-mono text-[10px] font-bold uppercase text-os-muted">
                    Navigation Position (Left / Right / Top Nav)
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { k: 'left', label: 'Left Nav' },
                        { k: 'right', label: 'Right Nav' },
                        { k: 'top', label: 'Top Nav' },
                      ] as const
                    ).map((np) => (
                      <button
                        key={np.k}
                        onClick={() => {
                          onUpdate({ ...studio, navPosition: np.k });
                          onPlaySound('click');
                        }}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold cursor-pointer ${
                          (studio.navPosition || 'left') === np.k
                            ? 'pill-os-accent'
                            : 'bg-os-s2 border border-os text-os-muted'
                        }`}
                      >
                        {np.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block font-mono text-[10px] font-bold uppercase text-os-muted">
                    Sidebar Style
                  </span>
                  {(
                    [
                      { k: 'expanded', label: 'Expanded Sidebar (248px)' },
                      { k: 'compact', label: 'Compact Icon Rail (68px)' },
                      { k: 'floating', label: 'Floating Glass Dock' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.k}
                      onClick={() => {
                        onUpdate({ ...studio, sidebarMode: item.k });
                        onPlaySound('click');
                      }}
                      className={`w-full p-3 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-between ${
                        studio.sidebarMode === item.k
                          ? 'pill-os-accent'
                          : 'bg-os-s2 border border-os text-os-muted'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span className="text-os-muted">Card Corner Radius</span>
                    <span className="text-os-primary font-bold">{studio.cardRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={24}
                    value={studio.cardRadius}
                    onChange={(e) =>
                      onUpdate({ ...studio, cardRadius: parseInt(e.target.value, 10) })
                    }
                    className="w-full token-slider"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                    <span className="text-os-muted">Glass Blur Intensity</span>
                    <span className="text-os-primary font-bold">{studio.glassBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    value={studio.glassBlur}
                    onChange={(e) =>
                      onUpdate({ ...studio, glassBlur: parseInt(e.target.value, 10) })
                    }
                    className="w-full token-slider"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { k: 'instant', label: 'Instant (0ms)' },
                      { k: 'crisp', label: 'Crisp Exec' },
                      { k: 'fluid', label: 'Fluid Spatial' },
                    ] as const
                  ).map((v) => (
                    <button
                      key={v.k}
                      onClick={() => {
                        onUpdate({ ...studio, velocity: v.k });
                        onPlaySound('click');
                      }}
                      className={`py-2.5 px-2 rounded-xl text-[11px] font-bold cursor-pointer ${
                        studio.velocity === v.k
                          ? 'pill-os-accent'
                          : 'bg-os-s2 border border-os text-os-muted'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>


                <div className="space-y-3 pt-2 border-t border-os">
                  <span className="block font-mono text-[10px] font-bold uppercase text-os-accent">
                    Granular Pixel Controls
                  </span>

                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="text-os-muted">Sidebar Width</span>
                      <span className="text-os-primary font-bold">{studio.sidebarWidth || 252}px</span>
                    </div>
                    <input
                      type="range"
                      min={200}
                      max={320}
                      value={studio.sidebarWidth || 252}
                      onChange={(e) => onUpdate({ ...studio, sidebarWidth: parseInt(e.target.value, 10) })}
                      className="w-full token-slider"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="text-os-muted">Grid Gap Between Cards</span>
                      <span className="text-os-primary font-bold">{studio.gridGap || 16}px</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={32}
                      value={studio.gridGap || 16}
                      onChange={(e) => onUpdate({ ...studio, gridGap: parseInt(e.target.value, 10) })}
                      className="w-full token-slider"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="text-os-muted">Inside Card Padding</span>
                      <span className="text-os-primary font-bold">{studio.cardPadding || 20}px</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={32}
                      value={studio.cardPadding || 20}
                      onChange={(e) => onUpdate({ ...studio, cardPadding: parseInt(e.target.value, 10) })}
                      className="w-full token-slider"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <span className="text-os-muted">Page Header Title Size</span>
                      <span className="text-os-primary font-bold">{studio.headerTitleSize || 26}px</span>
                    </div>
                    <input
                      type="range"
                      min={18}
                      max={36}
                      value={studio.headerTitleSize || 26}
                      onChange={(e) => onUpdate({ ...studio, headerTitleSize: parseInt(e.target.value, 10) })}
                      className="w-full token-slider"
                    />
                  </div>

                  <button
                    onClick={() => {
                      onUpdate({ ...studio, removeCardBorders: !studio.removeCardBorders });
                      onPlaySound('click');
                    }}
                    className="w-full p-2.5 rounded-xl bg-os-s2 border border-os flex items-center justify-between text-xs font-bold text-os-primary cursor-pointer"
                  >
                    <span>Remove Card Borders</span>
                    <span
                      className={`w-9 h-5 rounded-full p-0.5 flex items-center ${
                        studio.removeCardBorders ? 'justify-end bg-os-accent' : 'justify-start bg-slate-700/60'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow" />
                    </span>
                  </button>
                </div>

                <div className="space-y-2 pt-2 border-t border-os">
                  <span className="block font-mono text-[10px] font-bold uppercase text-os-muted">
                    Workspace Screen Width
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { k: 'full', label: 'Full-Width Screen (100%)' },
                        { k: 'centered', label: 'Centered Focus (1080px)' },
                      ] as const
                    ).map((w) => (
                      <button
                        key={w.k}
                        onClick={() => {
                          onUpdate({ ...studio, workspaceWidth: w.k });
                          onPlaySound('click');
                        }}
                        className={`p-2.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                          (studio.workspaceWidth || 'full') === w.k
                            ? 'pill-os-accent'
                            : 'bg-os-s2 border border-os text-os-muted'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===============================================================
                TAB 6: BORDER BEAMS & 12 SWITCHES
                =============================================================== */}
            {tab === 'features' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-os-s2 border border-os space-y-3">
                  <span className="block font-mono text-[10px] font-bold uppercase text-os-primary">
                    Animated Conic Border Beams
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { k: 'off', label: 'Off (Disabled)' },
                        { k: 'hero', label: 'Hero Cards Only' },
                        { k: 'all', label: 'All Boxes Active' },
                        { k: 'custom', label: 'Custom Per-Box Pin' },
                      ] as const
                    ).map((bm) => (
                      <button
                        key={bm.k}
                        onClick={() => {
                          onUpdate({ ...studio, beamMode: bm.k });
                          onPlaySound('click');
                        }}
                        className={`p-2.5 rounded-xl text-xs font-bold cursor-pointer text-left ${
                          studio.beamMode === bm.k
                            ? 'pill-os-accent'
                            : 'bg-os-input border border-os text-os-muted'
                        }`}
                      >
                        {bm.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {FEATURE_SWITCHES.map((sw) => {
                    const isOn = !!studio.features[sw.key];
                    return (
                      <button
                        key={sw.key}
                        onClick={() => {
                          const nextVal = !isOn;
                          const nextZones = { ...studio.zones };
                          if (sw.key === 'circadian') {
                            const hr = new Date().getHours();
                            nextZones.canvas = nextVal && hr >= 6 && hr < 18 ? '#F7F5F0' : '#07090E';
                          }
                          onUpdate({
                            ...studio,
                            zones: nextZones,
                            features: { ...studio.features, [sw.key]: nextVal },
                          });
                          if (sw.key === 'sound' ? nextVal : studio.features.sound) {
                            onPlaySound('click');
                          }
                        }}
                        className="w-full p-3 rounded-xl bg-os-s2 hover:border-os-strong border border-os flex items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-card-primary">{sw.title}</div>
                          <div className="text-[11px] text-card-muted mt-0.5">{sw.desc}</div>
                        </div>
                        <span
                          className={`w-10 h-5 rounded-full p-0.5 shrink-0 flex items-center ${
                            isOn ? 'justify-end bg-os-accent' : 'justify-start bg-slate-700/60'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-white shadow" />
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-os">
                  <button
                    onClick={handleCopyDna}
                    className="py-2.5 px-3 rounded-xl bg-os-accent text-xs font-bold cursor-pointer"
                  >
                    Copy Theme DNA
                  </button>
                  <button
                    onClick={() => setDnaModalOpen(true)}
                    className="py-2.5 px-3 rounded-xl bg-os-s2 border border-os text-xs font-semibold text-os-primary cursor-pointer"
                  >
                    Import DNA
                  </button>
                </div>

                <button
                  onClick={() => {
                    onUpdate(DEFAULT_STUDIO_STATE);
                    onPlaySound('chime');
                    onToast('All 6 UI zones & defaults restored.', true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-os-s2 border border-os text-xs font-semibold text-os-muted hover:text-os-primary cursor-pointer"
                >
                  Reset All Zones & Defaults
                </button>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-os flex items-center justify-between text-[11px] font-mono text-os-muted shrink-0">
            <span>Kosisko OS Modular Engine</span>
            <button onClick={onClose} className="px-3.5 py-1.5 rounded-lg bg-os-accent font-bold cursor-pointer">
              Done
            </button>
          </div>
        </aside>
      </div>

      {dnaModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md os-popover p-6 space-y-4">
            <h3 className="text-lg font-bold text-os-primary">Import Theme DNA JSON</h3>
            <textarea
              rows={5}
              value={dnaInput}
              onChange={(e) => setDnaInput(e.target.value)}
              placeholder='{"zones":{"accent":"#10B981"}}'
              className="w-full px-3.5 py-2.5 rounded-xl bg-os-input font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDnaModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-os-s2 border border-os text-xs font-semibold text-os-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyImportedDna}
                className="px-4 py-2 rounded-xl bg-os-accent text-xs font-bold cursor-pointer"
              >
                Apply DNA
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
