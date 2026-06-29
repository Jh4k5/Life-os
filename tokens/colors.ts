// tokens/colors.ts
type BlurTint = 'dark' | 'light';
// ════════════════════════════════════════════════════
// DARK — "Midnight Cosmos"
// كحلي عميق لا أسود — يشعر بالعمق والذكاء
// ════════════════════════════════════════════════════
export const dark = {
  // ── الخلفيات (5 مستويات — عمق بصري حقيقي) ──
  bg0: '#06080F', // خلفية التطبيق — الأعمق
  bg1: '#0D1121', // خلفية البطاقات
  bg2: '#141829', // بطاقة مرفوعة
  bg3: '#1B2035', // modals / sheets
  bg4: '#222741', // overlays / hover
  // ── الحدود ──
  b0: 'rgba(255,255,255,0.04)',
  b1: 'rgba(255,255,255,0.08)',
  b2: 'rgba(255,255,255,0.14)',
  b3: 'rgba(255,255,255,0.24)',
  // ── الزجاج السائل ──
  glass: 'rgba(13,17,33,0.72)',
  glassBorder: 'rgba(255,255,255,0.09)',
  glassTint: 'dark' as BlurTint,
  // ── النصوص ──
  t1: '#EDF0FF', // أساسي
  t2: '#8A90B8', // ثانوي
  t3: '#4A5080', // ثالثي
  t4: '#2C3260', // placeholder
  // ── لون النبرة الرئيسي (يختاره المستخدم) ──
  accent: '#5B6EF5',
  accentL: '#7B8EFF',
  accentDim: 'rgba(91,110,245,0.16)',
  accentGlow: 'rgba(91,110,245,0.32)',
  // ── الألوان الدلالية ──
  green: '#2ECC71',
  greenDim: 'rgba(46,204,113,0.15)',
  red: '#E74C3C',
  redDim: 'rgba(231,76,60,0.15)',
  yellow: '#F1C40F',
  yellowDim: 'rgba(241,196,15,0.15)',
  blue: '#3498DB',
  blueDim: 'rgba(52,152,219,0.15)',
  orange: '#E67E22',
  orangeDim: 'rgba(230,126,34,0.15)',
  // ── هوية الأقسام العشرة (كل قسم له بصمة لونية فريدة) ──
  areas: '#00D084', // زمردي ← حياة، نمو، انتماء
  habits: '#A855F7', // بنفسجي ← تطور، انضباط، استمرار
  tasks: '#3B82F6', // أزرق ← وضوح، تنفيذ، إجراء
  journal: '#06B6D4', // سماوي ← وعي، تأمل، تعبير
  study: '#F59E0B', // ذهبي ← معرفة، استثمار، مستقبل
  learning: '#EC4899', // وردي ← اكتشاف، فضول، نمو
  focus: '#EF4444', // أحمر ← طاقة، كثافة، عزم
  schedule: '#14B8A6', // فيروزي ← ترتيب، وقت، التزام
  dopamine: '#D97706', // برتقالي ← وعي، صحة، إرادة
  ai_hub: '#8B5CF6', // بنفسجي ← أتمتة، ذكاء، مستقبل
};

// ════════════════════════════════════════════════════
// LIGHT — "Pearl"
// أبيض كريمي دافئ — نظيف وهادئ
// ════════════════════════════════════════════════════
export const light = {
  bg0: '#F1F2F8',
  bg1: '#FFFFFF',
  bg2: '#FFFFFF',
  bg3: '#F1F2F8',
  bg4: '#E4E6F0',
  b0: 'rgba(0,0,0,0.04)',
  b1: 'rgba(0,0,0,0.08)',
  b2: 'rgba(0,0,0,0.14)',
  b3: 'rgba(0,0,0,0.24)',
  glass: 'rgba(255,255,255,0.85)',
  glassBorder: 'rgba(0,0,0,0.07)',
  glassTint: 'light' as BlurTint,
  t1: '#0F1020',
  t2: '#5C6080',
  t3: '#A8ACCC',
  t4: '#D0D3E8',
  accent: '#4A5CE8',
  accentL: '#6A7AFF',
  accentDim: 'rgba(74,92,232,0.10)',
  accentGlow: 'rgba(74,92,232,0.20)',
  green: '#16A34A',
  greenDim: 'rgba(22,163,74,0.10)',
  red: '#DC2626',
  redDim: 'rgba(220,38,38,0.10)',
  yellow: '#CA8A04',
  yellowDim: 'rgba(202,138,4,0.10)',
  blue: '#2563EB',
  blueDim: 'rgba(37,99,235,0.10)',
  orange: '#EA580C',
  orangeDim: 'rgba(234,88,12,0.10)',
  // ألوان الأقسام (أغمق قليلاً للفاتح)
  areas: '#059669',
  habits: '#9333EA',
  tasks: '#2563EB',
  journal: '#0891B2',
  study: '#D97706',
  learning: '#DB2777',
  focus: '#DC2626',
  schedule: '#0D9488',
  dopamine: '#B45309',
  ai_hub: '#7C3AED',
};

export type Palette = typeof dark;

// ── 12 خيار accent ──
export const accentPresets = [
  { id: 'indigo', dark: '#5B6EF5', light: '#4A5CE8', name: 'إنديجو' },
  { id: 'blue', dark: '#3B82F6', light: '#2563EB', name: 'أزرق' },
  { id: 'cyan', dark: '#06B6D4', light: '#0891B2', name: 'سماوي' },
  { id: 'teal', dark: '#14B8A6', light: '#0D9488', name: 'فيروزي' },
  { id: 'green', dark: '#10B981', light: '#059669', name: 'أخضر' },
  { id: 'purple', dark: '#A855F7', light: '#9333EA', name: 'بنفسجي' },
  { id: 'pink', dark: '#EC4899', light: '#DB2777', name: 'وردي' },
  { id: 'red', dark: '#EF4444', light: '#DC2626', name: 'أحمر' },
  { id: 'orange', dark: '#F97316', light: '#EA580C', name: 'برتقالي' },
  { id: 'amber', dark: '#F59E0B', light: '#D97706', name: 'ذهبي' },
  { id: 'rose', dark: '#FB7185', light: '#E11D48', name: 'وردي داكن' },
  { id: 'custom', dark: '#5B6EF5', light: '#4A5CE8', name: 'مخصص' },
];
