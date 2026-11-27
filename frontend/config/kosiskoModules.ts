export interface OperationalModuleItem {
  id: string;
  name: string;
  href: string;
  icon: string;
  cat: string;
  isCore?: boolean;
  appCode?: string;
}

export interface TextureDefinition {
  id: string;
  name: string;
  tag: string;
  buildCss: (strokeColor: string) => string;
}

export interface EnglishFontItem {
  name: string;
  cat: 'Sans' | 'Serif' | 'Stylish/Script' | 'Tech/Display' | 'Mono';
  system?: boolean;
}

export interface PresetThemeItem {
  id: string;
  name: string;
  category: 'Dark Luxury' | 'Midnight & Cyber' | 'Royal Jewel' | 'Warm & Earth' | 'Daylight Pro';
  accent: string;
  canvas: string;
  sidebar: string;
  topbar: string;
  cards: string;
  borders: string;
  texture: string;
}

export interface FeatureSwitchItem {
  key:
    | 'celebrationAnim'
    | 'magneticHover'
    | 'shimmerSweep'
    | 'rollingNumbers'
    | 'kinetic'
    | 'aurora'
    | 'spotlight'
    | 'glass'
    | 'sound'
    | 'aiCopilot'
    | 'multiTab'
    | 'pulseTicker'
    | 'zenFocus'
    | 'circadian'
    | 'compactDensity'
    | 'whiteLabelBrand';
  title: string;
  desc: string;
}

export const KOSISKO_ICON_PACK: Record<string, string> = {
  dashboard:
    '<rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" />',
  pos:
    '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M8 7h8M8 11h8M8 15h5" />',
  crm:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />',
  inventory:
    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />',
  ledger:
    '<line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />',
  whatsapp:
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />',
  analytics:
    '<line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />',
};

export const KOSISKO_OPERATIONAL_MODULES: OperationalModuleItem[] = [
  {
    id: 'dashboard',
    name: 'Command Dashboard',
    href: '/customer/dashboard',
    icon: 'dashboard',
    cat: 'CORE TELEMETRY',
    isCore: true,
  },
  {
    id: 'pos',
    name: 'POS & GST Billing',
    href: '/customer/pos',
    icon: 'pos',
    cat: 'BILLING ENGINE',
    isCore: false,
    appCode: 'pos',
  },
  {
    id: 'crm',
    name: 'CRM & Sales Pipeline',
    href: '/customer/crm',
    icon: 'crm',
    cat: 'CLIENT ENGINE',
    isCore: false,
    appCode: 'crm',
  },
];

export const PRESET_THEMES: PresetThemeItem[] = [
  { id: 'obsidian-gold', name: '24K Obsidian Gold', category: 'Dark Luxury', accent: '#F59E0B', canvas: '#07090E', sidebar: 'auto', topbar: 'auto', cards: 'auto', borders: 'auto', texture: 'solid' },
  { id: 'champagne-noir', name: 'Champagne Noir', category: 'Dark Luxury', accent: '#EAB308', canvas: '#09090B', sidebar: '#111114', topbar: '#0E0E11', cards: '#141418', borders: 'auto', texture: 'stripes' },
  { id: 'rose-gold-onyx', name: 'Rose Gold Onyx', category: 'Dark Luxury', accent: '#F43F5E', canvas: '#0A070A', sidebar: '#140E14', topbar: '#110C11', cards: '#191119', borders: 'auto', texture: 'dots' },
  { id: 'platinum-carbon', name: 'Platinum Carbon', category: 'Dark Luxury', accent: '#E2E8F0', canvas: '#080A0D', sidebar: '#101318', topbar: '#0D1015', cards: '#151921', borders: 'auto', texture: 'carbon' },
  { id: 'bronze-sovereign', name: 'Bronze Sovereign', category: 'Dark Luxury', accent: '#D97706', canvas: '#0C0906', sidebar: '#16110B', topbar: '#130E09', cards: '#1C150E', borders: 'auto', texture: 'hex' },
  { id: 'velvet-crimson', name: 'Velvet Crimson', category: 'Dark Luxury', accent: '#EF4444', canvas: '#0D0608', sidebar: '#180B0F', topbar: '#14090C', cards: '#1F0E13', borders: 'auto', texture: 'solid' },
  { id: 'gold-slate-exec', name: 'Executive Slate Gold', category: 'Dark Luxury', accent: '#FBBF24', canvas: '#0B0F17', sidebar: '#06090F', topbar: '#0E1420', cards: '#131B2B', borders: 'auto', texture: 'grid' },
  { id: 'copper-eclipse', name: 'Copper Eclipse', category: 'Dark Luxury', accent: '#EA580C', canvas: '#0B0807', sidebar: '#150F0D', topbar: '#120C0A', cards: '#1B1310', borders: 'auto', texture: 'topo' },
  { id: 'white-gold-contrast', name: 'Ivory Sidebar & Obsidian', category: 'Dark Luxury', accent: '#F59E0B', canvas: '#07090E', sidebar: '#F8FAFC', topbar: '#0D111B', cards: '#111624', borders: 'auto', texture: 'solid' },
  { id: 'titanium-amber', name: 'Titanium Amber', category: 'Dark Luxury', accent: '#F59E0B', canvas: '#111317', sidebar: '#0A0B0E', topbar: '#0E1014', cards: '#181B22', borders: 'auto', texture: 'crosshair' },

  { id: 'midnight-sapphire', name: 'Midnight Sapphire', category: 'Midnight & Cyber', accent: '#38BDF8', canvas: '#050B18', sidebar: '#09142B', topbar: '#071022', cards: '#0C1A36', borders: 'auto', texture: 'grid' },
  { id: 'electric-cyan-grid', name: 'Electric Cyan Matrix', category: 'Midnight & Cyber', accent: '#06B6D4', canvas: '#040D12', sidebar: '#071720', topbar: '#06131B', cards: '#0A1F2B', borders: 'auto', texture: 'circuit' },
  { id: 'quantum-emerald', name: 'Quantum Emerald', category: 'Midnight & Cyber', accent: '#10B981', canvas: '#04100C', sidebar: '#071B15', topbar: '#061611', cards: '#0A241C', borders: 'auto', texture: 'hex' },
  { id: 'cobalt-horizon', name: 'Cobalt Horizon', category: 'Midnight & Cyber', accent: '#3B82F6', canvas: '#060A16', sidebar: '#0B1226', topbar: '#090F20', cards: '#0F1833', borders: 'auto', texture: 'dots' },
  { id: 'neon-mint-terminal', name: 'Neon Mint Terminal', category: 'Midnight & Cyber', accent: '#34D399', canvas: '#050C0A', sidebar: '#091613', topbar: '#07120F', cards: '#0D1F1B', borders: 'auto', texture: 'mesh' },
  { id: 'deep-indigo-pulse', name: 'Deep Indigo Pulse', category: 'Midnight & Cyber', accent: '#818CF8', canvas: '#070714', sidebar: '#0E0E24', topbar: '#0B0B1D', cards: '#131330', borders: 'auto', texture: 'circuit' },
  { id: 'arctic-blue-steel', name: 'Arctic Blue Steel', category: 'Midnight & Cyber', accent: '#0EA5E9', canvas: '#09111E', sidebar: '#0F1B2E', topbar: '#0C1626', cards: '#14233B', borders: 'auto', texture: 'crosshair' },
  { id: 'hyper-violet', name: 'Hyper Violet Nova', category: 'Midnight & Cyber', accent: '#A855F7', canvas: '#0A0614', sidebar: '#130B24', topbar: '#0F091D', cards: '#1A0F30', borders: 'auto', texture: 'hex' },
  { id: 'cyber-lime-stealth', name: 'Cyber Lime Stealth', category: 'Midnight & Cyber', accent: '#84CC16', canvas: '#070B06', sidebar: '#0E160C', topbar: '#0B120A', cards: '#131E10', borders: 'auto', texture: 'carbon' },
  { id: 'abyssal-teal', name: 'Abyssal Teal', category: 'Midnight & Cyber', accent: '#14B8A6', canvas: '#040F10', sidebar: '#071A1C', topbar: '#061517', cards: '#0A2426', borders: 'auto', texture: 'topo' },

  { id: 'imperial-amethyst', name: 'Imperial Amethyst', category: 'Royal Jewel', accent: '#C084FC', canvas: '#0E0716', sidebar: '#170C24', topbar: '#130A1E', cards: '#1E1030', borders: 'auto', texture: 'solid' },
  { id: 'emerald-palace', name: 'Emerald Palace', category: 'Royal Jewel', accent: '#10B981', canvas: '#05140E', sidebar: '#092118', topbar: '#071B13', cards: '#0C2B20', borders: 'auto', texture: 'stripes' },
  { id: 'royal-ruby-gold', name: 'Royal Ruby & Gold', category: 'Royal Jewel', accent: '#F59E0B', canvas: '#14060A', sidebar: '#210A11', topbar: '#1B080E', cards: '#2B0E17', borders: 'auto', texture: 'hex' },
  { id: 'peacock-sapphire', name: 'Peacock Sapphire', category: 'Royal Jewel', accent: '#2DD4BF', canvas: '#05121A', sidebar: '#091E2B', topbar: '#071824', cards: '#0C2738', borders: 'auto', texture: 'topo' },
  { id: 'magenta-crown', name: 'Magenta Crown', category: 'Royal Jewel', accent: '#EC4899', canvas: '#120610', sidebar: '#1E0A1B', topbar: '#190816', cards: '#270E23', borders: 'auto', texture: 'dots' },
  { id: 'garnet-prestige', name: 'Garnet Prestige', category: 'Royal Jewel', accent: '#FB7185', canvas: '#130709', sidebar: '#1F0C10', topbar: '#1A0A0D', cards: '#291015', borders: 'auto', texture: 'solid' },
  { id: 'topaz-twilight', name: 'Topaz Twilight', category: 'Royal Jewel', accent: '#F97316', canvas: '#110905', sidebar: '#1D1009', topbar: '#180D07', cards: '#26150C', borders: 'auto', texture: 'mesh' },
  { id: 'jade-dynasty', name: 'Jade Dynasty', category: 'Royal Jewel', accent: '#34D399', canvas: '#061310', sidebar: '#0B201B', topbar: '#091B17', cards: '#0F2B24', borders: 'auto', texture: 'grid' },
  { id: 'celestial-indigo', name: 'Celestial Indigo', category: 'Royal Jewel', accent: '#6366F1', canvas: '#08091A', sidebar: '#0F112B', topbar: '#0C0E24', cards: '#141738', borders: 'auto', texture: 'crosshair' },
  { id: 'royal-plum-gold', name: 'Royal Plum & Gold', category: 'Royal Jewel', accent: '#FBBF24', canvas: '#120818', sidebar: '#1C0D26', topbar: '#170B20', cards: '#251233', borders: 'auto', texture: 'solid' },

  { id: 'espresso-gold', name: 'Espresso & Gold', category: 'Warm & Earth', accent: '#F59E0B', canvas: '#120D0A', sidebar: '#1C1410', topbar: '#17110D', cards: '#241A15', borders: 'auto', texture: 'solid' },
  { id: 'terracotta-dusk', name: 'Terracotta Dusk', category: 'Warm & Earth', accent: '#F97316', canvas: '#140B08', sidebar: '#21120D', topbar: '#1B0F0B', cards: '#2B1811', borders: 'auto', texture: 'topo' },
  { id: 'olive-grove', name: 'Olive Grove Executive', category: 'Warm & Earth', accent: '#A3E635', canvas: '#0D1008', sidebar: '#161B0E', topbar: '#12160B', cards: '#1D2412', borders: 'auto', texture: 'dots' },
  { id: 'sandstone-warm', name: 'Warm Sandstone Light', category: 'Warm & Earth', accent: '#B45309', canvas: '#F5EFE6', sidebar: '#EAE0D2', topbar: '#EFE7DC', cards: '#FAF6F0', borders: 'auto', texture: 'solid' },
  { id: 'desert-ochre', name: 'Desert Ochre', category: 'Warm & Earth', accent: '#D97706', canvas: '#14100A', sidebar: '#211A10', topbar: '#1B160D', cards: '#2B2215', borders: 'auto', texture: 'stripes' },
  { id: 'mocha-cream', name: 'Mocha Cream Daylight', category: 'Warm & Earth', accent: '#92400E', canvas: '#F7F3EE', sidebar: '#291D16', topbar: '#EFE8E0', cards: '#FFFFFF', borders: 'auto', texture: 'solid' },
  { id: 'forest-cedar', name: 'Forest Cedar', category: 'Warm & Earth', accent: '#22C55E', canvas: '#08110B', sidebar: '#0E1D13', topbar: '#0B1810', cards: '#132619', borders: 'auto', texture: 'hex' },
  { id: 'amber-parchment', name: 'Amber Parchment', category: 'Warm & Earth', accent: '#D97706', canvas: '#FAF5EB', sidebar: '#F0E6D5', topbar: '#F5EDE0', cards: '#FFFFFF', borders: 'auto', texture: 'grid' },

  { id: 'porcelain-gold', name: 'Porcelain Daylight Gold', category: 'Daylight Pro', accent: '#D97706', canvas: '#F8FAFC', sidebar: '#FFFFFF', topbar: '#FFFFFF', cards: '#FFFFFF', borders: 'auto', texture: 'solid' },
  { id: 'swiss-clean-blue', name: 'Swiss Executive Blue', category: 'Daylight Pro', accent: '#2563EB', canvas: '#F1F5F9', sidebar: '#FFFFFF', topbar: '#FFFFFF', cards: '#FFFFFF', borders: 'auto', texture: 'grid' },
  { id: 'emerald-white-pro', name: 'Emerald Crisp White', category: 'Daylight Pro', accent: '#059669', canvas: '#F4FBF8', sidebar: '#FFFFFF', topbar: '#FFFFFF', cards: '#FFFFFF', borders: 'auto', texture: 'dots' },
  { id: 'obsidian-nav-daylight', name: 'Obsidian Sidebar + White Canvas', category: 'Daylight Pro', accent: '#F59E0B', canvas: '#F8FAFC', sidebar: '#0B0F19', topbar: '#FFFFFF', cards: '#FFFFFF', borders: 'auto', texture: 'solid' },
  { id: 'royal-navy-daylight', name: 'Navy Sidebar + Crisp White', category: 'Daylight Pro', accent: '#2563EB', canvas: '#F1F5F9', sidebar: '#0A1935', topbar: '#FFFFFF', cards: '#FFFFFF', borders: 'auto', texture: 'crosshair' },
  { id: 'arctic-mint-light', name: 'Arctic Mint Light', category: 'Daylight Pro', accent: '#0D9488', canvas: '#F0FDFA', sidebar: '#CCFBF1', topbar: '#FFFFFF', cards: '#FFFFFF', borders: 'auto', texture: 'topo' },
  { id: 'lavender-studio-light', name: 'Lavender Studio Light', category: 'Daylight Pro', accent: '#7C3AED', canvas: '#F5F3FF', sidebar: '#EDE9FE', topbar: '#FFFFFF', cards: '#FFFFFF', borders: 'auto', texture: 'solid' },
  { id: 'rose-atelier-light', name: 'Rose Atelier Light', category: 'Daylight Pro', accent: '#E11D48', canvas: '#FFF1F2', sidebar: '#FFE4E6', topbar: '#FFFFFF', cards: '#FFFFFF', borders: 'auto', texture: 'dots' },
  { id: 'sky-cloud-enterprise', name: 'Sky Cloud Enterprise', category: 'Daylight Pro', accent: '#0284C7', canvas: '#F0F9FF', sidebar: '#E0F2FE', topbar: '#FFFFFF', cards: '#FFFFFF', borders: 'auto', texture: 'grid' },
  { id: 'graphite-silver-light', name: 'Graphite & Silver Light', category: 'Daylight Pro', accent: '#334155', canvas: '#F4F4F5', sidebar: '#18181B', topbar: '#FFFFFF', cards: '#FFFFFF', borders: 'auto', texture: 'stripes' },
];

export const KOSISKO_TEXTURES_REGISTRY: TextureDefinition[] = [
  { id: 'solid', name: 'Clean Solid', tag: 'Pure', buildCss: () => 'none' },
  {
    id: 'grid',
    name: 'Architectural Grid',
    tag: 'CAD',
    buildCss: (c) =>
      `linear-gradient(to right, ${c} 1px, transparent 1px), linear-gradient(to bottom, ${c} 1px, transparent 1px)`,
  },
  {
    id: 'dots',
    name: 'Micro Dot Matrix',
    tag: 'Precision',
    buildCss: (c) => `radial-gradient(${c} 1.45px, transparent 1.45px)`,
  },
  {
    id: 'mesh',
    name: 'Cyber Diagonal Mesh',
    tag: 'Tech',
    buildCss: (c) =>
      `linear-gradient(45deg, ${c} 1px, transparent 1px), linear-gradient(-45deg, ${c} 1px, transparent 1px)`,
  },
  {
    id: 'hex',
    name: 'Isometric Hex Hive',
    tag: '3D Mesh',
    buildCss: (c) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="49" viewBox="0 0 28 49"><path d="M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z" fill="${c}"/></svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    },
  },
  {
    id: 'circuit',
    name: 'Circuit Board Traces',
    tag: 'Neural',
    buildCss: (c) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M0 20h12l4-4h8l4 4h12M20 0v12l4 4v8l-4 4v12" fill="none" stroke="${c}" stroke-width="1"/><circle cx="12" cy="20" r="1.6" fill="${c}"/><circle cx="28" cy="20" r="1.6" fill="${c}"/></svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    },
  },
  {
    id: 'topo',
    name: 'Topographic Waves',
    tag: 'Organic',
    buildCss: (c) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="24" viewBox="0 0 48 24"><path d="M0 12 Q 12 2, 24 12 T 48 12" fill="none" stroke="${c}" stroke-width="1"/></svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    },
  },
  {
    id: 'carbon',
    name: 'Carbon Fiber Weave',
    tag: 'Luxury',
    buildCss: (c) => `radial-gradient(${c} 15%, transparent 16%), radial-gradient(${c} 15%, transparent 16%)`,
  },
  {
    id: 'crosshair',
    name: 'Blueprint Crosshairs',
    tag: 'Spatial',
    buildCss: (c) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 12v8M12 16h8" stroke="${c}" stroke-width="1"/></svg>`;
      return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    },
  },
  {
    id: 'stripes',
    name: 'Architectural Pinstripe',
    tag: 'Executive',
    buildCss: (c) =>
      `repeating-linear-gradient(135deg, ${c} 0px, ${c} 1px, transparent 1px, transparent 10px)`,
  },
];

export const ENGLISH_FONTS: EnglishFontItem[] = [
  { name: 'Times New Roman', cat: 'Serif', system: true },
  { name: 'Georgia', cat: 'Serif', system: true },
  { name: 'Garamond', cat: 'Serif', system: true },
  { name: 'Palatino Linotype', cat: 'Serif', system: true },
  { name: 'Book Antiqua', cat: 'Serif', system: true },
  { name: 'Cambria', cat: 'Serif', system: true },
  { name: 'Arial', cat: 'Sans', system: true },
  { name: 'Helvetica Neue', cat: 'Sans', system: true },
  { name: 'Verdana', cat: 'Sans', system: true },
  { name: 'Trebuchet MS', cat: 'Sans', system: true },
  { name: 'Segoe UI', cat: 'Sans', system: true },
  { name: 'Tahoma', cat: 'Sans', system: true },
  { name: 'Impact', cat: 'Tech/Display', system: true },
  { name: 'Courier New', cat: 'Mono', system: true },

  { name: 'Plus Jakarta Sans', cat: 'Sans' }, { name: 'Inter', cat: 'Sans' }, { name: 'Outfit', cat: 'Sans' },
  { name: 'Sora', cat: 'Sans' }, { name: 'Manrope', cat: 'Sans' }, { name: 'DM Sans', cat: 'Sans' },
  { name: 'Urbanist', cat: 'Sans' }, { name: 'Poppins', cat: 'Sans' }, { name: 'Montserrat', cat: 'Sans' },
  { name: 'Figtree', cat: 'Sans' }, { name: 'Geist', cat: 'Sans' }, { name: 'Rubik', cat: 'Sans' },
  { name: 'Work Sans', cat: 'Sans' }, { name: 'Nunito Sans', cat: 'Sans' }, { name: 'Raleway', cat: 'Sans' },
  { name: 'Quicksand', cat: 'Sans' }, { name: 'Josefin Sans', cat: 'Sans' }, { name: 'Mulish', cat: 'Sans' },
  { name: 'Karla', cat: 'Sans' }, { name: 'Cabin', cat: 'Sans' }, { name: 'Barlow', cat: 'Sans' },
  { name: 'Instrument Sans', cat: 'Sans' }, { name: 'Bricolage Grotesque', cat: 'Sans' }, { name: 'Archivo', cat: 'Sans' },
  { name: 'Chivo', cat: 'Sans' }, { name: 'Titillium Web', cat: 'Sans' }, { name: 'Kanit', cat: 'Sans' },
  { name: 'Prompt', cat: 'Sans' }, { name: 'Asap', cat: 'Sans' }, { name: 'Hind', cat: 'Sans' },
  { name: 'Mukta', cat: 'Sans' }, { name: 'Questrial', cat: 'Sans' }, { name: 'Varela Round', cat: 'Sans' },
  { name: 'Comfortaa', cat: 'Sans' }, { name: 'Lexend', cat: 'Sans' }, { name: 'Atkinson Hyperlegible', cat: 'Sans' },
  { name: 'Public Sans', cat: 'Sans' }, { name: 'Red Hat Display', cat: 'Sans' },
  { name: 'Open Sans', cat: 'Sans' }, { name: 'Lato', cat: 'Sans' }, { name: 'Roboto', cat: 'Sans' },

  { name: 'Playfair Display', cat: 'Serif' }, { name: 'Cinzel', cat: 'Serif' }, { name: 'Cormorant Garamond', cat: 'Serif' },
  { name: 'Bodoni Moda', cat: 'Serif' }, { name: 'EB Garamond', cat: 'Serif' }, { name: 'Lora', cat: 'Serif' },
  { name: 'Merriweather', cat: 'Serif' }, { name: 'Libre Baskerville', cat: 'Serif' }, { name: 'DM Serif Display', cat: 'Serif' },
  { name: 'Fraunces', cat: 'Serif' }, { name: 'Bitter', cat: 'Serif' }, { name: 'Spectral', cat: 'Serif' },
  { name: 'Crimson Pro', cat: 'Serif' }, { name: 'PT Serif', cat: 'Serif' }, { name: 'Noto Serif', cat: 'Serif' },
  { name: 'Vollkorn', cat: 'Serif' }, { name: 'Cardo', cat: 'Serif' }, { name: 'Prata', cat: 'Serif' },
  { name: 'Yeseva One', cat: 'Serif' },

  { name: 'Great Vibes', cat: 'Stylish/Script' }, { name: 'Dancing Script', cat: 'Stylish/Script' },
  { name: 'Pacifico', cat: 'Stylish/Script' }, { name: 'Lobster', cat: 'Stylish/Script' },
  { name: 'Satisfy', cat: 'Stylish/Script' }, { name: 'Caveat', cat: 'Stylish/Script' },
  { name: 'Kaushan Script', cat: 'Stylish/Script' }, { name: 'Sacramento', cat: 'Stylish/Script' },
  { name: 'Alex Brush', cat: 'Stylish/Script' }, { name: 'Allura', cat: 'Stylish/Script' },
  { name: 'Courgette', cat: 'Stylish/Script' }, { name: 'Yellowtail', cat: 'Stylish/Script' },
  { name: 'Marck Script', cat: 'Stylish/Script' }, { name: 'Tangerine', cat: 'Stylish/Script' },
  { name: 'Parisienne', cat: 'Stylish/Script' }, { name: 'Cookie', cat: 'Stylish/Script' },

  { name: 'Space Grotesk', cat: 'Tech/Display' }, { name: 'Exo 2', cat: 'Tech/Display' }, { name: 'Rajdhani', cat: 'Tech/Display' },
  { name: 'Orbitron', cat: 'Tech/Display' }, { name: 'Oxanium', cat: 'Tech/Display' }, { name: 'Chakra Petch', cat: 'Tech/Display' },
  { name: 'Audiowide', cat: 'Tech/Display' }, { name: 'Syncopate', cat: 'Tech/Display' }, { name: 'Syne', cat: 'Tech/Display' },
  { name: 'Oswald', cat: 'Tech/Display' }, { name: 'Bebas Neue', cat: 'Tech/Display' }, { name: 'Anton', cat: 'Tech/Display' },
  { name: 'Teko', cat: 'Tech/Display' }, { name: 'Righteous', cat: 'Tech/Display' }, { name: 'Fredoka', cat: 'Tech/Display' },
  { name: 'Black Ops One', cat: 'Tech/Display' }, { name: 'Russo One', cat: 'Tech/Display' },

  { name: 'Space Mono', cat: 'Mono' }, { name: 'JetBrains Mono', cat: 'Mono' }, { name: 'Fira Code', cat: 'Mono' },
  { name: 'IBM Plex Mono', cat: 'Mono' }, { name: 'Source Code Pro', cat: 'Mono' }, { name: 'Roboto Mono', cat: 'Mono' },
  { name: 'Inconsolata', cat: 'Mono' }, { name: 'Ubuntu Mono', cat: 'Mono' },
];

export const FEATURE_SWITCHES: FeatureSwitchItem[] = [
  { key: 'celebrationAnim', title: '1. Celebration Confetti & Balloons', desc: 'Flower petals, floating balloons & sparks on POS Sale, App Install & Passkey' },
  { key: 'magneticHover', title: '2. 3D Magnetic Card Hover & Lift', desc: 'Smooth 3D elevation & accent glow when hovering over cards' },
  { key: 'shimmerSweep', title: '3. Live Shimmer & Pulse Sweep', desc: 'Radiant light-beam shimmer sweeping across KPI & action buttons' },
  { key: 'rollingNumbers', title: '4. Rolling Number Counter', desc: 'Smooth digit roll-up animation when revenue or invoices update' },
  { key: 'kinetic', title: '5. Kinetic Medallion & Sparklines', desc: 'Rotating K-medallion ring, sparkline draw & staggered card entrances' },
  { key: 'aurora', title: '6. Neural Aurora Mesh', desc: 'Ambient radial light orbs adapting to accent & background hues' },
  { key: 'spotlight', title: '7. Cursor Spotlight Glow', desc: 'Pointer-tracking radial glass reflection across cards & sidebar' },
  { key: 'glass', title: '8. 3D Glass Depth', desc: 'Translucent frosted elevation with top specular highlight' },
  { key: 'sound', title: '9. Web Audio Soundscapes', desc: 'Synthesized tactile clicks, chimes & harmonic sweeps' },
  { key: 'aiCopilot', title: '10. AI Co-Pilot & Voice Bar', desc: 'Top header Cmd+K command bar & interactive Voice Mic listener' },
  { key: 'multiTab', title: '11. Multi-Tab Quick Bar', desc: 'Quick-switch workspace tabs bar below the top header' },
  { key: 'pulseTicker', title: '12. Live Business Pulse Ticker', desc: 'Real-time store node texture, active zone & beam telemetry' },
  { key: 'zenFocus', title: '13. Zen Focus Mode', desc: 'Collapses sidebar & peripheral bars for distraction-free focus' },
  { key: 'circadian', title: '14. Auto Circadian Shade', desc: 'Switches canvas automatically between Warm Ivory & Pitch Obsidian' },
  { key: 'compactDensity', title: '15. Compact Density Mode', desc: 'Tightens card padding & grid spacing for high-density data' },
  { key: 'whiteLabelBrand', title: '16. White-Label Firm Header', desc: 'Hides KOSISKO • OS badge so only your Firm branding shows' },
];
