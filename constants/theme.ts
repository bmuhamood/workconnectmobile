// constants/theme.ts
export const colors = {
  primary: '#2563eb', // blue-600
  primaryDark: '#1d4ed8', // blue-700
  primaryLight: '#dbeafe', // blue-100
  gradientStart: '#2563eb', // blue-600
  gradientEnd: '#9333ea', // purple-600
  // Deeper trio used for hero/splash/onboarding surfaces — same hue family
  // as the primary gradient, pushed darker for a premium, immersive feel
  // on full-bleed screens rather than the flat light background used
  // elsewhere.
  heroStart: '#1e1b4b', // indigo-950
  heroMid: '#312e81', // indigo-900
  heroEnd: '#4c1d95', // purple-900
  accent: '#059669', // emerald-600 — money/success context
  accentLight: '#d1fae5',
  secondary: '#9333ea', // purple-600
  secondaryLight: '#f3e8ff',
  background: '#f9fafb',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  textMuted: '#6b7280',
  textLight: '#9ca3af',
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#d97706',
  warningLight: '#fef3c7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  white: '#ffffff',
  // Translucent whites for glass-panel effects over dark/gradient surfaces
  glassLight: 'rgba(255,255,255,0.14)',
  glassBorder: 'rgba(255,255,255,0.24)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const type = {
  display: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  micro: { fontSize: 12, fontWeight: '600' as const },
};

export const shadow = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const formatUGX = (amount: number): string => {
  return `UGX ${Math.round(amount || 0).toLocaleString('en-UG')}`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' });
};
