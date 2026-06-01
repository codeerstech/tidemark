import type { CSSProperties } from 'react'
import type { ThemeTokens } from './types'

export const theme: ThemeTokens = {
  colors: {
    background: '#f4f1ea',
    surface: '#ffffff',
    surfaceSoft: '#e7eee8',
    text: '#202724',
    muted: '#647068',
    heading: '#0f1f1b',
    line: '#d5ddd5',
    dark: '#102c27',
    darkSoft: '#1f443c',
    accent: '#c79a3c',
    accentSoft: '#f2e2b8',
    sale: '#af4538',
  },
  radii: {
    card: '8px',
    control: '8px',
    pill: '999px',
  },
  shadows: {
    card: '0 18px 50px rgba(16, 44, 39, 0.12)',
    drawer: '0 24px 70px rgba(16, 44, 39, 0.28)',
  },
  layout: {
    container: '1240px',
  },
}

export function themeStyle() {
  return {
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-surface-soft': theme.colors.surfaceSoft,
    '--color-text': theme.colors.text,
    '--color-muted': theme.colors.muted,
    '--color-heading': theme.colors.heading,
    '--color-line': theme.colors.line,
    '--color-dark': theme.colors.dark,
    '--color-dark-soft': theme.colors.darkSoft,
    '--color-accent': theme.colors.accent,
    '--color-accent-soft': theme.colors.accentSoft,
    '--color-sale': theme.colors.sale,
    '--radius-card': theme.radii.card,
    '--radius-control': theme.radii.control,
    '--radius-pill': theme.radii.pill,
    '--shadow-card': theme.shadows.card,
    '--shadow-drawer': theme.shadows.drawer,
    '--container': theme.layout.container,
  } as CSSProperties
}
