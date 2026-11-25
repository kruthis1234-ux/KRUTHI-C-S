import type { AccentTheme, FolderSection } from '../types/portfolio';

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exp);
  return `${value >= 10 || exp === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exp]}`;
}

export function formatShortDate(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isSafeHttpUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function folderSectionLabel(section: FolderSection): string {
  switch (section) {
    case 'source_zip':
      return 'Source-Code.zip';
    case 'screenshots':
      return 'Screenshots/';
    case 'documentation':
      return 'Documentation/';
    default:
      return 'Project-Files/';
  }
}

export const ACCENT_THEMES: Record<
  AccentTheme,
  {
    label: string;
    gradientBar: string;
    softSurface: string;
    textAccent: string;
    strokeHex: string;
    secondaryHex: string;
  }
> = {
  emerald: {
    label: 'Emerald',
    gradientBar: 'from-emerald-500 via-teal-400 to-sky-500',
    softSurface: 'from-emerald-500/12 via-teal-500/6 to-sky-500/10',
    textAccent: 'text-emerald-700 dark:text-emerald-400',
    strokeHex: '#10B981',
    secondaryHex: '#0EA5E9',
  },
  purple: {
    label: 'Electric Purple',
    gradientBar: 'from-violet-600 via-purple-500 to-pink-500',
    softSurface: 'from-violet-500/12 via-purple-500/6 to-pink-500/10',
    textAccent: 'text-violet-700 dark:text-violet-400',
    strokeHex: '#7C3AED',
    secondaryHex: '#EC4899',
  },
  sky: {
    label: 'Sky Blue',
    gradientBar: 'from-sky-500 via-cyan-400 to-emerald-500',
    softSurface: 'from-sky-500/12 via-cyan-500/6 to-emerald-500/10',
    textAccent: 'text-sky-700 dark:text-sky-400',
    strokeHex: '#0EA5E9',
    secondaryHex: '#10B981',
  },
  coral: {
    label: 'Coral Orange',
    gradientBar: 'from-orange-500 via-amber-400 to-pink-500',
    softSurface: 'from-orange-500/12 via-amber-500/6 to-pink-500/10',
    textAccent: 'text-orange-700 dark:text-orange-400',
    strokeHex: '#F97316',
    secondaryHex: '#EC4899',
  },
  pink: {
    label: 'Soft Pink',
    gradientBar: 'from-pink-500 via-rose-400 to-purple-500',
    softSurface: 'from-pink-500/12 via-rose-500/6 to-purple-500/10',
    textAccent: 'text-pink-700 dark:text-pink-400',
    strokeHex: '#EC4899',
    secondaryHex: '#7C3AED',
  },
};
