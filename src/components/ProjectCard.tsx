import { ArrowRight, ExternalLink, FolderOpen, Github, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '../context/PortfolioContext';
import { ACCENT_THEMES, isSafeHttpUrl } from '../lib/formatters';
import type { Project } from '../types/portfolio';
import { ProjectVisualThumbnail } from './ProjectVisualThumbnail';

interface Props {
  project: Project;
}

export function ProjectCard({ project }: Props) {
  const { notify } = usePortfolio();
  const accent = ACCENT_THEMES[project.accentTheme] || ACCENT_THEMES.emerald;
  const hasDemo = isSafeHttpUrl(project.liveDemoUrl);
  const hasGithub = isSafeHttpUrl(project.githubUrl);
  const publicFileCount = (project.files || []).filter((f) => f.visibility === 'public').length;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-stone-200/90 dark:border-slate-800/90 bg-white/85 dark:bg-[#131722]/85 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-stone-300 dark:hover:border-slate-700">
      {/* Top gradient edge */}
      <div aria-hidden="true" className={`h-1 w-full bg-gradient-to-r ${accent.gradientBar}`} />

      <Link to={`/projects/${project.slug}`} className="block focus-visible:outline-none">
        <ProjectVisualThumbnail project={project} />
      </Link>

      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-5">
        <div className="space-y-3">
          {/* Unboxed clean metadata line (zero-pill discipline) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-slate-400">
            <span className={`font-medium ${accent.textAccent}`}>{project.categoryName || 'Software'}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{project.status}</span>
            {project.isFeatured && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  Featured
                </span>
              </>
            )}
          </div>

          <div>
            <Link
              to={`/projects/${project.slug}`}
              className="font-display text-xl font-bold tracking-tight text-stone-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors"
            >
              {project.name}
            </Link>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-slate-300 line-clamp-2">
              {project.shortDescription}
            </p>
          </div>

          {project.technologies.length > 0 && (
            <p className="text-xs font-mono text-stone-500 dark:text-slate-400 leading-relaxed">
              {project.technologies.join(' / ')}
            </p>
          )}
        </div>

        {/* Action controls */}
        <div className="pt-4 border-t border-stone-200/70 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              to={`/projects/${project.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to={`/projects/${project.slug}#folder-explorer`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              title="Open project digital folder"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Files{publicFileCount > 0 ? ` (${publicFileCount})` : ''}</span>
            </Link>
          </div>

          <div className="flex items-center gap-1.5">
            {hasDemo ? (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Live Demo"
                aria-label={`${project.name} Live Demo`}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Demo</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() =>
                  notify('info', `Live Demo link for ${project.name} has not been added yet. Add it anytime in Admin.`)
                }
                title="Live Demo link pending"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Demo</span>
              </button>
            )}

            {hasGithub ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open GitHub Repository"
                aria-label={`${project.name} GitHub Repository`}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() =>
                  notify('info', `GitHub repository link for ${project.name} is not attached yet. Add it in Admin.`)
                }
                title="GitHub repository link pending"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-stone-400 dark:text-slate-500 hover:text-stone-700 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
