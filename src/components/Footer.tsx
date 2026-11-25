import { ArrowUpRight, Github, Linkedin, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { isSafeHttpUrl } from '../lib/formatters';

export function Footer() {
  const { snapshot } = usePortfolio();
  const settings = snapshot?.settings;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#0D1018]/70 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <p className="font-display font-semibold text-base text-stone-900 dark:text-white">
            {settings?.brandName || 'ProjectVerse'}
          </p>
          <p className="text-sm text-stone-600 dark:text-slate-400">
            Personal developer portfolio, project folders &amp; documentation archive.
          </p>
          <p className="text-xs text-stone-500 dark:text-slate-500">
            &copy; {year} {settings?.ownerName || 'Developer'}. All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm text-stone-600 dark:text-slate-400">
          <Link to="/projects" className="hover:text-stone-950 dark:hover:text-white transition-colors">
            Projects
          </Link>
          <Link to="/about" className="hover:text-stone-950 dark:hover:text-white transition-colors">
            About
          </Link>
          <Link to="/contact" className="hover:text-stone-950 dark:hover:text-white transition-colors">
            Contact
          </Link>
          <Link to="/admin" className="hover:text-stone-950 dark:hover:text-white transition-colors">
            Admin Console
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-slate-800">
            {settings?.email && (
              <a
                href={`mailto:${settings.email}`}
                aria-label="Send email"
                className="p-2 rounded-lg text-stone-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
            {settings?.githubUrl && isSafeHttpUrl(settings.githubUrl) && (
              <a
                href={settings.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile"
                className="p-2 rounded-lg text-stone-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
              >
                <Github className="w-4 h-4" />
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
            {settings?.linkedinUrl && isSafeHttpUrl(settings.linkedinUrl) && (
              <a
                href={settings.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                className="p-2 rounded-lg text-stone-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
              >
                <Linkedin className="w-4 h-4" />
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
