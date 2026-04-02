/**
 * Design tokens shared between Studio and Crew UI.
 * Extracted from modular-studio's theme system.
 */
export const colors = {
  brand: {
    primary: '#1a1b2e',
    secondary: '#2d2e4a',
    accent: '#6366f1',
    surface: '#0f1021',
  },
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#94a3b8',
    muted: '#64748b',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
} as const;

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;
