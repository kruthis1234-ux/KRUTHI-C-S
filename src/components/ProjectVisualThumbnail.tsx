import { useState } from 'react';
import { ACCENT_THEMES } from '../lib/formatters';
import type { Project } from '../types/portfolio';

interface Props {
  project: Project;
  className?: string;
}

export function ProjectVisualThumbnail({ project, className = 'aspect-[16/10]' }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const accent = ACCENT_THEMES[project.accentTheme] || ACCENT_THEMES.emerald;

  if (project.thumbnailUrl && !imgFailed) {
    return (
      <div className={`relative overflow-hidden bg-stone-100 dark:bg-slate-900 ${className}`}>
        <img
          src={project.thumbnailUrl}
          alt={`${project.name} preview`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${accent.softSurface} bg-white dark:bg-[#121623] border-b border-stone-200/70 dark:border-slate-800/80 ${className} flex items-center justify-center p-5`}
    >
      {/* Subtle architectural grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40 dark:opacity-25"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(120, 113, 108, 0.28) 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Bespoke Domain SVG Blueprint Placeholder (until user uploads actual screenshots) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        <div className="flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-slate-400">
          <span className="truncate max-w-[70%]">{`Projects/${project.slug}/`}</span>
          <span className={accent.textAccent}>Preview Slot</span>
        </div>

        <div className="my-auto flex items-center justify-center py-2">
          <DomainSvgIllustration slug={project.slug} stroke={accent.strokeHex} secondary={accent.secondaryHex} />
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400">
          <span>Upload thumbnail or screenshots in Admin</span>
          <span className="font-mono tabular-nums">{project.timelineLabel}</span>
        </div>
      </div>
    </div>
  );
}

function DomainSvgIllustration({
  slug,
  stroke,
  secondary,
}: {
  slug: string;
  stroke: string;
  secondary: string;
}) {
  if (slug.includes('calcnova')) {
    return (
      <svg viewBox="0 0 220 96" className="w-48 h-24" fill="none" aria-hidden="true">
        <rect x="14" y="8" width="192" height="80" rx="12" stroke={stroke} strokeWidth="1.5" fill="currentColor" className="text-white/75 dark:text-slate-900/75" />
        <rect x="26" y="18" width="168" height="22" rx="6" stroke={secondary} strokeWidth="1.25" />
        <path d="M138 29H182" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="26" y="48" width="34" height="12" rx="4" fill={stroke} fillOpacity="0.22" />
        <rect x="68" y="48" width="34" height="12" rx="4" fill={secondary} fillOpacity="0.22" />
        <rect x="110" y="48" width="34" height="12" rx="4" fill={stroke} fillOpacity="0.16" />
        <rect x="152" y="48" width="42" height="28" rx="6" fill={stroke} fillOpacity="0.85" />
        <rect x="26" y="64" width="76" height="12" rx="4" fill={secondary} fillOpacity="0.18" />
        <rect x="110" y="64" width="34" height="12" rx="4" fill={stroke} fillOpacity="0.16" />
      </svg>
    );
  }

  if (slug.includes('codeimpact')) {
    return (
      <svg viewBox="0 0 220 96" className="w-48 h-24" fill="none" aria-hidden="true">
        <path d="M48 48L108 24M48 48L108 72M108 24L172 36M108 72L172 64M108 24L108 72" stroke={stroke} strokeWidth="1.6" strokeDasharray="3 3" />
        <circle cx="48" cy="48" r="14" fill={stroke} fillOpacity="0.22" stroke={stroke} strokeWidth="1.8" />
        <circle cx="108" cy="24" r="11" fill={secondary} fillOpacity="0.22" stroke={secondary} strokeWidth="1.6" />
        <circle cx="108" cy="72" r="11" fill={secondary} fillOpacity="0.22" stroke={secondary} strokeWidth="1.6" />
        <circle cx="172" cy="36" r="9" fill={stroke} fillOpacity="0.3" stroke={stroke} strokeWidth="1.5" />
        <circle cx="172" cy="64" r="9" fill={secondary} fillOpacity="0.3" stroke={secondary} strokeWidth="1.5" />
      </svg>
    );
  }

  if (slug.includes('workflow')) {
    return (
      <svg viewBox="0 0 220 96" className="w-48 h-24" fill="none" aria-hidden="true">
        <rect x="16" y="34" width="46" height="28" rx="8" stroke={stroke} strokeWidth="1.6" fill={stroke} fillOpacity="0.14" />
        <rect x="86" y="14" width="48" height="24" rx="8" stroke={secondary} strokeWidth="1.6" fill={secondary} fillOpacity="0.14" />
        <rect x="86" y="58" width="48" height="24" rx="8" stroke={stroke} strokeWidth="1.6" fill={stroke} fillOpacity="0.14" />
        <rect x="158" y="34" width="46" height="28" rx="8" stroke={secondary} strokeWidth="1.6" fill={secondary} fillOpacity="0.2" />
        <path d="M62 48H74V26H86M62 48H74V70H86M134 26H146V48H158M134 70H146V48" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (slug.includes('release')) {
    return (
      <svg viewBox="0 0 220 96" className="w-48 h-24" fill="none" aria-hidden="true">
        <rect x="24" y="12" width="172" height="72" rx="12" stroke={stroke} strokeWidth="1.5" fill="currentColor" className="text-white/70 dark:text-slate-900/70" />
        <circle cx="46" cy="30" r="6" fill={stroke} />
        <path d="M43 30L45 32L49 28" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="60" y="26" width="96" height="8" rx="4" fill={stroke} fillOpacity="0.25" />
        <circle cx="46" cy="48" r="6" fill={secondary} />
        <path d="M43 48L45 50L49 46" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="60" y="44" width="116" height="8" rx="4" fill={secondary} fillOpacity="0.25" />
        <circle cx="46" cy="66" r="6" stroke={stroke} strokeWidth="1.5" />
        <rect x="60" y="62" width="76" height="8" rx="4" fill={stroke} fillOpacity="0.15" />
      </svg>
    );
  }

  if (slug.includes('expiry')) {
    return (
      <svg viewBox="0 0 220 96" className="w-48 h-24" fill="none" aria-hidden="true">
        <rect x="22" y="16" width="52" height="64" rx="10" stroke={stroke} strokeWidth="1.6" fill={stroke} fillOpacity="0.12" />
        <rect x="84" y="16" width="52" height="64" rx="10" stroke={secondary} strokeWidth="1.6" fill={secondary} fillOpacity="0.12" />
        <rect x="146" y="16" width="52" height="64" rx="10" stroke={stroke} strokeWidth="1.6" fill={stroke} fillOpacity="0.2" />
        <path d="M34 36H62M34 52H54M96 36H124M96 52H118M158 36H186M158 52H178" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 220 96" className="w-48 h-24" fill="none" aria-hidden="true">
      <rect x="18" y="14" width="184" height="68" rx="12" stroke={stroke} strokeWidth="1.5" fill="currentColor" className="text-white/70 dark:text-slate-900/70" />
      <rect x="34" y="52" width="18" height="18" rx="4" fill={stroke} fillOpacity="0.35" />
      <rect x="60" y="40" width="18" height="30" rx="4" fill={secondary} fillOpacity="0.45" />
      <rect x="86" y="30" width="18" height="40" rx="4" fill={stroke} fillOpacity="0.65" />
      <rect x="112" y="44" width="18" height="26" rx="4" fill={secondary} fillOpacity="0.5" />
      <path d="M142 54L158 38L174 44L190 26" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
