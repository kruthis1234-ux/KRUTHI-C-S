import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('404 Page Not Found — ProjectVerse');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center space-y-6">
      <p className="font-mono text-sm font-semibold text-violet-600 dark:text-violet-400">404</p>
      <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-stone-950 dark:text-white">
        Page not found
      </h1>
      <p className="text-sm sm:text-base text-stone-600 dark:text-slate-400 max-w-md mx-auto">
        The route or project folder you requested does not exist. Head back to the homepage or browse all published projects.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back Home</span>
        </Link>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-stone-800 dark:text-slate-200 text-sm font-semibold hover:bg-stone-100 dark:hover:bg-slate-800"
        >
          <Compass className="w-4 h-4" />
          <span>Project Explorer</span>
        </Link>
      </div>
    </div>
  );
}
