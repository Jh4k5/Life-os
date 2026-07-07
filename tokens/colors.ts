// tokens/colors.ts
// ════════════════════════════════════════════════════
// Life OS — Visual System v3 (redesign)
// Dark-first · single restrained accent · near-black canvas
// North star: Apple · Linear · Raycast · Arc · Nothing
// No pastel rainbow. No per-section chrome colors.
// ════════════════════════════════════════════════════
type BlurTint = 'dark' | 'light';

// ── DARK (designed first) — "Obsidian" ──
export const dark = {
  // Backgrounds — deep neutral, not pure black
  bg0: '#0A0B0D', // app canvas — deepest
  bg1: '#101216', // cards / surfaces
  bg2: '#161922', // elevated surface
  bg3: '#1C2029', // sheets / modals
  bg4: '#252A35', // overlay / hover
  // Hairline borders (depth via lines, not shadows)
  b0: 'rgba(255,255,255,0.04)',
  b1: 'rgba(255,255,255,0.08)',
  b2: 'rgba(255,255,255,0.14)',
  b3: 'rgba(255,255,255,0.22)',
  // Frosted glass
  glass: 'rgba(16,18,22,0.62)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassTint: 'dark' as BlurTint,
  // Text — off-white, muted grays
  t1: '#F5F5F7', // primary
  t2: '#9C9FAA', // secondary (muted gray)
  t3: '#5C606C', // tertiary
  t4: '#3A3E48', // placeholder
  // THE single accent — electric violet/indigo (whole-app chrome)
  accent: '#7C6FFF',
  accentL: '#9C92FF',
  accentDim: 'rgba(124,111,255,0.14)',
  accentGlow: 'rgba(124,111,255,0.42)',
  // Quiet semantic colors — used only where required, never decoration
  green: '#32D74B',
  greenDim: 'rgba(50,215,75,0.14)',
  red: '#FF453A',
  redDim: 'rgba(255,69,58,0.14)',
  yellow: '#FFD60A',
  yellowDim: 'rgba(255,214,10,0.14)',
  blue: '#0A84FF',
  blueDim: 'rgba(10,132,255,0.14)',
  orange: '#FF9F0A',
  orangeDim: 'rgba(255,159,10,0.14)',
  // Section identity — kept for per-Area personalization & data only.
  // NOT used in default chrome (single accent rules the UI).
  areas: '#7C6FFF',
  habits: '#7C6FFF',
  tasks: '#7C6FFF',
  journal: '#7C6FFF',
  study: '#7C6FFF',
  learning: '#7C6FFF',
  focus: '#7C6FFF',
  schedule: '#7C6FFF',
  dopamine: '#7C6FFF',
  ai_hub: '#7C6FFF',
};

// ── LIGHT (clean mirror) — "Paper" ──
export const light = {
  bg0: '#F4F4F6',
  bg1: '#FFFFFF',
  bg2: '#FFFFFF',
  bg3: '#F4F4F6',
  bg4: '#E9E9EF',
  b0: 'rgba(0,0,0,0.04)',
  b1: 'rgba(0,0,0,0.08)',
  b2: 'rgba(0,0,0,0.14)',
  b3: 'rgba(0,0,0,0.22)',
  glass: 'rgba(255,255,255,0.7)',
  glassBorder: 'rgba(0,0,0,0.06)',
  glassTint: 'light' as BlurTint,
  t1: '#0A0B0D',
  t2: '#62656F',
  t3: '#9A9DA8',
  t4: '#C4C7D0',
  accent: '#5B4BE6',
  accentL: '#7C6FFF',
  accentDim: 'rgba(91,75,230,0.10)',
  accentGlow: 'rgba(91,75,230,0.22)',
  green: '#28A745',
  greenDim: 'rgba(40,167,69,0.10)',
  red: '#E5484D',
  redDim: 'rgba(229,72,77,0.10)',
  yellow: '#C8A200',
  yellowDim: 'rgba(200,162,0,0.10)',
  blue: '#0A6CFF',
  blueDim: 'rgba(10,108,255,0.10)',
  orange: '#E07A00',
  orangeDim: 'rgba(224,122,0,0.10)',
  areas: '#5B4BE6',
  habits: '#5B4BE6',
  tasks: '#5B4BE6',
  journal: '#5B4BE6',
  study: '#5B4BE6',
  learning: '#5B4BE6',
  focus: '#5B4BE6',
  schedule: '#5B4BE6',
  dopamine: '#5B4BE6',
  ai_hub: '#5B4BE6',
};

export type Palette = typeof dark;

// ── Per-Area personalization palette (jewel tones, not pastel) ──
// Allowed ONLY inside an Area's own surfaces — never in app chrome.
export const areaAccents = [
  { id: 'violet', dark: '#7C6FFF', light: '#5B4BE6', name: 'بنفسجي' },
  { id: 'blue', dark: '#0A84FF', light: '#0A6CFF', name: 'أزرق' },
  { id: 'teal', dark: '#2BD4C4', light: '#0E9E92', name: 'فيروزي' },
  { id: 'green', dark: '#32D74B', light: '#28A745', name: 'أخضر' },
  { id: 'amber', dark: '#FF9F0A', light: '#E07A00', name: 'كهرماني' },
  { id: 'rose', dark: '#FF6482', light: '#E5485F', name: 'وردي' },
  { id: 'slate', dark: '#8E94A3', light: '#62656F', name: 'رمادي' },
];

// Curated jewel-tone accents. Iris (amethyst) is the default identity.
// Every `dark` value passes WCAG AA both as a foreground on the Obsidian
// canvas (#0A0B0D, ≥4.5:1) AND as a filled surface under white text (≥3:1),
// so buttons, chips and active states stay legible whichever the user picks.
export const DEFAULT_ACCENT = '#7C6FFF'; // Iris — fresh-install & reset default

export const accentPresets = [
  { id: 'iris', dark: '#7C6FFF', light: '#5B4BE6', name: 'Iris' },
  { id: 'sapphire', dark: '#4C8DFF', light: '#2563EB', name: 'Sapphire' },
  { id: 'jade', dark: '#0FA968', light: '#059669', name: 'Jade' },
  { id: 'topaz', dark: '#CC7A2E', light: '#B45309', name: 'Topaz' },
  { id: 'ruby', dark: '#F04E6E', light: '#E11D48', name: 'Ruby' },
  { id: 'orchid', dark: '#C264F5', light: '#9333EA', name: 'Orchid' },
];
