import React from 'react';
import { CompanyThemeColor } from '../types';

export interface CompanyThemeConfig {
  id: CompanyThemeColor;
  name: string;
  tagline: string;
  isDefault?: boolean;
  // Raw Hex colors
  primaryHex: string;
  primaryLightHex: string;
  accentHex: string;
  borderHex: string;
  glowRgba: string;

  // Tailored Tailwind CSS class tokens:
  primaryBg: string;
  primaryHoverBg: string;
  primaryActiveBg: string;
  primaryText: string;
  primaryDarkText: string;
  lightBg: string;
  lightBgHover: string;
  subtleBg: string;
  border: string;
  borderSubtle: string;
  borderFocus: string;
  ring: string;
  activeIndicator: string;
  badge: string;
  badgeSolid: string;
  gradientFrom: string;
  gradientTo: string;
  gradientBg: string;
  dotGlow: string;
  shadowGlow: string;
  swatchGradient: string;
}

export const COMPANY_THEMES: CompanyThemeConfig[] = [
  {
    id: 'orange',
    name: 'Warm Amber Studio',
    tagline: 'Warm architectural amber & energetic neon glow (Default)',
    isDefault: true,
    primaryHex: '#f97316',
    primaryLightHex: '#fff7ed',
    accentHex: '#f59e0b',
    borderHex: '#fed7aa',
    glowRgba: 'rgba(249, 115, 22, 0.45)',
    primaryBg: 'bg-orange-500',
    primaryHoverBg: 'hover:bg-orange-600',
    primaryActiveBg: 'bg-orange-600',
    primaryText: 'text-orange-600',
    primaryDarkText: 'text-orange-950',
    lightBg: 'bg-orange-50',
    lightBgHover: 'hover:bg-orange-100',
    subtleBg: 'bg-orange-50/50',
    border: 'border-orange-200',
    borderSubtle: 'border-orange-200/60',
    borderFocus: 'focus:border-orange-500',
    ring: 'focus:ring-orange-500',
    activeIndicator: 'bg-orange-500',
    badge: 'bg-orange-50 text-orange-800 border-orange-200',
    badgeSolid: 'bg-orange-500 text-white',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-amber-500',
    gradientBg: 'from-orange-500 to-amber-500',
    dotGlow: 'shadow-[0_0_8px_rgba(249,115,22,0.7)]',
    shadowGlow: 'shadow-[0_4px_20px_rgba(249,115,22,0.22)]',
    swatchGradient: 'from-orange-500 via-amber-500 to-yellow-400',
  },
  {
    id: 'blue',
    name: 'Cyber Cobalt',
    tagline: 'Crisp high-tech azure & enterprise cobalt blue',
    primaryHex: '#2563eb',
    primaryLightHex: '#eff6ff',
    accentHex: '#38bdf8',
    borderHex: '#bfdbfe',
    glowRgba: 'rgba(37, 99, 235, 0.45)',
    primaryBg: 'bg-blue-600',
    primaryHoverBg: 'hover:bg-blue-700',
    primaryActiveBg: 'bg-blue-700',
    primaryText: 'text-blue-600',
    primaryDarkText: 'text-blue-950',
    lightBg: 'bg-blue-50',
    lightBgHover: 'hover:bg-blue-100',
    subtleBg: 'bg-blue-50/50',
    border: 'border-blue-200',
    borderSubtle: 'border-blue-200/60',
    borderFocus: 'focus:border-blue-500',
    ring: 'focus:ring-blue-500',
    activeIndicator: 'bg-blue-600',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    badgeSolid: 'bg-blue-600 text-white',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-cyan-500',
    gradientBg: 'from-blue-600 to-cyan-500',
    dotGlow: 'shadow-[0_0_8px_rgba(37,99,235,0.7)]',
    shadowGlow: 'shadow-[0_4px_20px_rgba(37,99,235,0.22)]',
    swatchGradient: 'from-blue-600 via-indigo-500 to-cyan-400',
  },
  {
    id: 'emerald',
    name: 'Nordic Emerald',
    tagline: 'Biophilic studio sage & botanical fresh emerald',
    primaryHex: '#059669',
    primaryLightHex: '#ecfdf5',
    accentHex: '#34d399',
    borderHex: '#a7f3d0',
    glowRgba: 'rgba(5, 150, 105, 0.45)',
    primaryBg: 'bg-emerald-600',
    primaryHoverBg: 'hover:bg-emerald-700',
    primaryActiveBg: 'bg-emerald-700',
    primaryText: 'text-emerald-600',
    primaryDarkText: 'text-emerald-950',
    lightBg: 'bg-emerald-50',
    lightBgHover: 'hover:bg-emerald-100',
    subtleBg: 'bg-emerald-50/50',
    border: 'border-emerald-200',
    borderSubtle: 'border-emerald-200/60',
    borderFocus: 'focus:border-emerald-500',
    ring: 'focus:ring-emerald-500',
    activeIndicator: 'bg-emerald-600',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeSolid: 'bg-emerald-600 text-white',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-teal-500',
    gradientBg: 'from-emerald-600 to-teal-500',
    dotGlow: 'shadow-[0_0_8px_rgba(5,150,105,0.7)]',
    shadowGlow: 'shadow-[0_4px_20px_rgba(5,150,105,0.22)]',
    swatchGradient: 'from-emerald-600 via-teal-500 to-green-400',
  },
  {
    id: 'purple',
    name: 'Deep Violet',
    tagline: 'Creative luxury amethyst & executive royal violet',
    primaryHex: '#7c3aed',
    primaryLightHex: '#f5f3ff',
    accentHex: '#c084fc',
    borderHex: '#ddd6fe',
    glowRgba: 'rgba(124, 58, 237, 0.45)',
    primaryBg: 'bg-violet-600',
    primaryHoverBg: 'hover:bg-violet-700',
    primaryActiveBg: 'bg-violet-700',
    primaryText: 'text-violet-600',
    primaryDarkText: 'text-violet-950',
    lightBg: 'bg-violet-50',
    lightBgHover: 'hover:bg-violet-100',
    subtleBg: 'bg-violet-50/50',
    border: 'border-violet-200',
    borderSubtle: 'border-violet-200/60',
    borderFocus: 'focus:border-violet-500',
    ring: 'focus:ring-violet-500',
    activeIndicator: 'bg-violet-600',
    badge: 'bg-violet-50 text-violet-800 border-violet-200',
    badgeSolid: 'bg-violet-600 text-white',
    gradientFrom: 'from-violet-600',
    gradientTo: 'to-fuchsia-500',
    gradientBg: 'from-violet-600 to-fuchsia-500',
    dotGlow: 'shadow-[0_0_8px_rgba(124,58,237,0.7)]',
    shadowGlow: 'shadow-[0_4px_20px_rgba(124,58,237,0.22)]',
    swatchGradient: 'from-violet-600 via-purple-500 to-fuchsia-400',
  },
  {
    id: 'rose',
    name: 'Crimson Coral',
    tagline: 'Vibrant modern creative rose & bold ruby coral',
    primaryHex: '#e11d48',
    primaryLightHex: '#fff1f2',
    accentHex: '#fb7185',
    borderHex: '#fecdd3',
    glowRgba: 'rgba(225, 29, 72, 0.45)',
    primaryBg: 'bg-rose-600',
    primaryHoverBg: 'hover:bg-rose-700',
    primaryActiveBg: 'bg-rose-700',
    primaryText: 'text-rose-600',
    primaryDarkText: 'text-rose-950',
    lightBg: 'bg-rose-50',
    lightBgHover: 'hover:bg-rose-100',
    subtleBg: 'bg-rose-50/50',
    border: 'border-rose-200',
    borderSubtle: 'border-rose-200/60',
    borderFocus: 'focus:border-rose-500',
    ring: 'focus:ring-rose-500',
    activeIndicator: 'bg-rose-600',
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    badgeSolid: 'bg-rose-600 text-white',
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-pink-500',
    gradientBg: 'from-rose-600 to-pink-500',
    dotGlow: 'shadow-[0_0_8px_rgba(225,29,72,0.7)]',
    shadowGlow: 'shadow-[0_4px_20px_rgba(225,29,72,0.22)]',
    swatchGradient: 'from-rose-600 via-pink-500 to-orange-400',
  },
  {
    id: 'amber',
    name: 'Golden Sand',
    tagline: 'Architectural warm bronze & sunlight golden amber',
    primaryHex: '#d97706',
    primaryLightHex: '#fffbeb',
    accentHex: '#f59e0b',
    borderHex: '#fde68a',
    glowRgba: 'rgba(217, 119, 6, 0.45)',
    primaryBg: 'bg-amber-600',
    primaryHoverBg: 'hover:bg-amber-700',
    primaryActiveBg: 'bg-amber-700',
    primaryText: 'text-amber-600',
    primaryDarkText: 'text-amber-950',
    lightBg: 'bg-amber-50',
    lightBgHover: 'hover:bg-amber-100',
    subtleBg: 'bg-amber-50/50',
    border: 'border-amber-200',
    borderSubtle: 'border-amber-200/60',
    borderFocus: 'focus:border-amber-500',
    ring: 'focus:ring-amber-500',
    activeIndicator: 'bg-amber-600',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    badgeSolid: 'bg-amber-600 text-white',
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-yellow-500',
    gradientBg: 'from-amber-600 to-yellow-500',
    dotGlow: 'shadow-[0_0_8px_rgba(217,119,6,0.7)]',
    shadowGlow: 'shadow-[0_4px_20px_rgba(217,119,6,0.22)]',
    swatchGradient: 'from-amber-600 via-yellow-500 to-amber-300',
  },
  {
    id: 'cyan',
    name: 'Electric Teal',
    tagline: 'Pacific maritime cyan & illuminated aqua lagoon',
    primaryHex: '#0891b2',
    primaryLightHex: '#ecfeff',
    accentHex: '#22d3ee',
    borderHex: '#a5f3fc',
    glowRgba: 'rgba(8, 145, 178, 0.45)',
    primaryBg: 'bg-cyan-600',
    primaryHoverBg: 'hover:bg-cyan-700',
    primaryActiveBg: 'bg-cyan-700',
    primaryText: 'text-cyan-600',
    primaryDarkText: 'text-cyan-950',
    lightBg: 'bg-cyan-50',
    lightBgHover: 'hover:bg-cyan-100',
    subtleBg: 'bg-cyan-50/50',
    border: 'border-cyan-200',
    borderSubtle: 'border-cyan-200/60',
    borderFocus: 'focus:border-cyan-500',
    ring: 'focus:ring-cyan-500',
    activeIndicator: 'bg-cyan-600',
    badge: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    badgeSolid: 'bg-cyan-600 text-white',
    gradientFrom: 'from-cyan-600',
    gradientTo: 'to-teal-500',
    gradientBg: 'from-cyan-600 to-teal-500',
    dotGlow: 'shadow-[0_0_8px_rgba(8,145,178,0.7)]',
    shadowGlow: 'shadow-[0_4px_20px_rgba(8,145,178,0.22)]',
    swatchGradient: 'from-cyan-600 via-teal-500 to-emerald-400',
  },
  {
    id: 'slate',
    name: 'Carbon Monolith',
    tagline: 'Monochrome precision graphite & industrial obsidian',
    primaryHex: '#334155',
    primaryLightHex: '#f8fafc',
    accentHex: '#64748b',
    borderHex: '#cbd5e1',
    glowRgba: 'rgba(51, 65, 85, 0.45)',
    primaryBg: 'bg-slate-700',
    primaryHoverBg: 'hover:bg-slate-800',
    primaryActiveBg: 'bg-slate-800',
    primaryText: 'text-slate-800',
    primaryDarkText: 'text-slate-950',
    lightBg: 'bg-slate-100',
    lightBgHover: 'hover:bg-slate-200',
    subtleBg: 'bg-slate-50',
    border: 'border-slate-300',
    borderSubtle: 'border-slate-200',
    borderFocus: 'focus:border-slate-600',
    ring: 'focus:ring-slate-500',
    activeIndicator: 'bg-slate-800',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    badgeSolid: 'bg-slate-800 text-white',
    gradientFrom: 'from-slate-700',
    gradientTo: 'to-slate-900',
    gradientBg: 'from-slate-700 to-slate-900',
    dotGlow: 'shadow-[0_0_8px_rgba(51,65,85,0.7)]',
    shadowGlow: 'shadow-[0_4px_20px_rgba(51,65,85,0.22)]',
    swatchGradient: 'from-slate-700 via-slate-800 to-zinc-900',
  },
];

export const DEFAULT_THEME_ID: CompanyThemeColor = 'orange';

export function getCompanyTheme(themeId?: string | null): CompanyThemeConfig {
  if (!themeId) {
    return COMPANY_THEMES[0]; // 'orange' is default
  }
  const found = COMPANY_THEMES.find((t) => t.id === themeId);
  return found || COMPANY_THEMES[0];
}

/**
 * Returns dynamic CSS variables matching the active theme for global or container-level styling
 */
export function getCompanyThemeStyle(themeId?: string | null): React.CSSProperties {
  const theme = getCompanyTheme(themeId);
  return {
    ['--theme-primary' as string]: theme.primaryHex,
    ['--theme-primary-light' as string]: theme.primaryLightHex,
    ['--theme-accent' as string]: theme.accentHex,
    ['--theme-border' as string]: theme.borderHex,
    ['--theme-glow' as string]: theme.glowRgba,
  };
}
