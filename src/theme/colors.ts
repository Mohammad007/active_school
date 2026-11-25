/**
 * ActiveSchool colour tokens — matched to the website (activeschool.in).
 * Every component reads colours from here; no hex values elsewhere.
 */
export const Colors = {
  // Brand
  primary: '#033288',
  primaryDark: '#02266B',
  primaryTint: '#EFF3FB',
  primarySoft: '#D9E2F3',
  accent: '#E59E35',
  accentTint: '#FDF4E7',

  // Status
  success: '#16A34A',
  successTint: '#ECFDF3',
  danger: '#DC2626',
  dangerTint: '#FEF2F2',
  warning: '#B45309',
  warningTint: '#FFF7E8',
  heart: '#E11D48',

  // Text
  ink: '#0F172A',
  body: '#334155',
  muted: '#64748B',
  subtle: '#94A3B8',

  // Surfaces & lines
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  hairline: '#E2E8F0',
  skeleton: '#E8EDF4',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15,23,42,0.55)',
  imageScrim: 'rgba(15,23,42,0.6)',
  dotInactive: 'rgba(255,255,255,0.5)',
  onPrimaryMuted: 'rgba(255,255,255,0.75)',
  whiteGlow: 'rgba(255,255,255,0.12)',
  transparent: 'transparent',

  // Podium
  gold: '#D4A017',
  goldTint: '#FBF3DC',
  silver: '#8E9AAF',
  silverTint: '#EEF1F5',
  bronze: '#B8733A',
  bronzeTint: '#F6EBE1',
} as const;

export type ColorToken = keyof typeof Colors;

/** API colours are free-form; fall back to the brand colour when missing/invalid. */
export function safeColour(value: string | null | undefined, fallback: string = Colors.primary): string {
  return value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : fallback;
}

/** A translucent tint of an API colour (hex + alpha). */
export function tint(hex: string, alpha = 0.12): string {
  const h = safeColour(hex).replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `#${full}${a}`;
}
