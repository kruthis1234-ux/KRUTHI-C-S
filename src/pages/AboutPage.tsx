import { ArrowRight, BookOpen, Compass, GraduationCap, Layers } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const DEVELOPER_PORTRAIT = '/src/assets/images/developer_portrait_1795568629111.jpg';

export function AboutPage() {
  const { snapshot } = usePortfolio();
  const [imgErr, setImgErr] = useState(false);

  const settings = snapshot?.settings;
  const skills = snapshot?.skills || [];
  const groups: Array<'Languages' | 'Frontend' | 'Backend & Data' | 'Tools & DevOps'> = [
    'Languages',
    'Frontend',
    'Backend & Data',
    'Tools & DevOps',
  ];

  useDocumentTitle(
    `About ${settings?.ownerName || 'Developer'} — ProjectVerse`,
    settings?.aboutIntro
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 rounded-3xl overflow-hidden border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623]">
          {!imgErr ? (
            <img
              src={DEVELOPER_PORTRAIT}
              alt={`${settings?.ownerName || 'Developer'} portrait`}
              referrerPolicy="no-referrer"
              onError={() => setImgErr(true)}
              className="w-full h-full object-cover min-h-[300px]"
            />
          ) : (
            <div className="w-full h-full min-h-[300px] bg-gradient-to-br from-emerald-500/20 via-sky-500/20 to-violet-500/20 flex items-center justify-center">
              <span className="font-display text-3xl font-bold text-stone-700 dark:text-slate-200">
                {settings?.ownerName || 'Developer'}
              </span>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 rounded-3xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-7 sm:p-10 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">About Me</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-950 dark:text-white">
              {settings?.ownerName || 'Kruthi'} — {settings?.roleTitle}
            </h1>
            <p className="text-base leading-relaxed text-stone-600 dark:text-slate-300">
              {settings?.aboutIntro}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-stone-200/70 dark:border-slate-800/70">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold"
            >
              <span>Explore My Projects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-stone-800 dark:text-slate-200 text-sm font-semibold hover:bg-stone-100 dark:hover:bg-slate-800"
            >
              <span>Get in Touch</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Education, Interests & Current Learning Goals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-6 space-y-3">
          <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="font-display text-lg font-bold text-stone-900 dark:text-white">Education</h2>
          <p className="text-sm leading-relaxed text-stone-600 dark:text-slate-300">
            {settings?.education}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-6 space-y-3">
          <Compass className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <h2 className="font-display text-lg font-bold text-stone-900 dark:text-white">Interests</h2>
          <p className="text-sm leading-relaxed text-stone-600 dark:text-slate-300">
            {settings?.interests}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-6 space-y-3">
          <BookOpen className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <h2 className="font-display text-lg font-bold text-stone-900 dark:text-white">
            Current Learning Goals
          </h2>
          <p className="text-sm leading-relaxed text-stone-600 dark:text-slate-300">
            {settings?.learningGoals}
          </p>
        </div>
      </div>

      {/* Full Skills Matrix */}
      <section className="rounded-3xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-6 sm:p-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-violet-700 dark:text-violet-400">Technical Inventory</p>
            <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-white mt-0.5">
              Skills &amp; Technologies
            </h2>
          </div>
          <Layers className="w-5 h-5 text-stone-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {groups.map((group) => (
            <div key={group} className="space-y-3">
              <h3 className="text-xs font-semibold text-stone-900 dark:text-white pb-2 border-b border-stone-200 dark:border-slate-800">
                {group}
              </h3>
              <ul className="space-y-2">
                {skills
                  .filter((s) => s.group === group)
                  .map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-stone-700 dark:text-slate-200">{s.name}</span>
                      <span className="font-mono text-xs text-stone-400 dark:text-slate-500">{s.level}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
