import { ArrowLeft, CheckCircle2, ExternalLink, FolderOpen, Github, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectFolderExplorer } from '../components/ProjectFolderExplorer';
import { ProjectVisualThumbnail } from '../components/ProjectVisualThumbnail';
import { usePortfolio } from '../context/PortfolioContext';
import { ACCENT_THEMES, formatShortDate, isSafeHttpUrl } from '../lib/formatters';
import { fetchProjectBySlug } from '../lib/repository';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import type { Project, ProjectFile } from '../types/portfolio';

export function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { snapshot, notify } = usePortfolio();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<ProjectFile | null>(null);

  useEffect(() => {
    let active = true;
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    fetchProjectBySlug(slug)
      .then((data) => {
        if (active) {
          setProject(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug, snapshot?.projects]);

  useEffect(() => {
    if (!loading && project && location.hash === '#folder-explorer') {
      const el = document.getElementById('folder-explorer');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading, project, location.hash]);

  useDocumentTitle(
    project ? `${project.name} — ProjectVerse` : 'Project Details — ProjectVerse',
    project?.shortDescription
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="h-8 w-48 rounded-lg bg-stone-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-96 rounded-3xl bg-stone-200/70 dark:bg-slate-800/60 animate-pulse" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-stone-900 dark:text-white">
          Project not found
        </h1>
        <p className="text-sm text-stone-600 dark:text-slate-400">
          This project may be saved as a private draft or moved. Browse all published work in the Project Explorer.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
      </div>
    );
  }

  const accent = ACCENT_THEMES[project.accentTheme] || ACCENT_THEMES.emerald;
  const hasDemo = isSafeHttpUrl(project.liveDemoUrl);
  const hasGithub = isSafeHttpUrl(project.githubUrl);

  const publicScreenshots = (project.files || []).filter(
    (f) =>
      f.visibility === 'public' &&
      f.folderSection === 'screenshots' &&
      f.mimeType.startsWith('image/')
  );

  const relatedProjects = (snapshot?.projects || [])
    .filter((p) => p.status === 'published' && p.id !== project.id)
    .sort((a, b) => {
      const aMatch = a.categoryId === project.categoryId ? 1 : 0;
      const bMatch = b.categoryId === project.categoryId ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      {/* Breadcrumb & Back */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Project Explorer</span>
        </Link>
        <p className="font-mono text-xs text-stone-500 dark:text-slate-400">
          Projects / {project.slug}
        </p>
      </div>

      {/* Header & Main Showcase */}
      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
          <span className={`font-semibold ${accent.textAccent}`}>{project.categoryName}</span>
          <span aria-hidden="true">·</span>
          <span>{formatShortDate(project.createdAt)}</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{project.status}</span>
          {project.isFeatured && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current" />
                Featured Project
              </span>
            </>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-stone-950 dark:text-white">
              {project.name}
            </h1>
            <p className="text-base sm:text-lg leading-relaxed text-stone-600 dark:text-slate-300">
              {project.shortDescription}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {hasDemo ? (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white text-sm font-semibold hover:opacity-95 transition-opacity"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Live Demo</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() =>
                  notify('info', 'Live Demo URL has not been added yet. Configure it inside Admin -> Edit Project.')
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-stone-600 dark:text-slate-300 text-sm font-medium hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Live Demo Pending</span>
              </button>
            )}

            {hasGithub ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white text-sm font-semibold hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Repo</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() =>
                  notify('info', 'GitHub repository URL has not been added yet. Configure it inside Admin -> Edit Project.')
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-stone-600 dark:text-slate-300 text-sm font-medium hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Pending</span>
              </button>
            )}

            <a
              href="#folder-explorer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold hover:opacity-90"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Project Files</span>
            </a>
          </div>
        </div>

        {/* Main Showcase Card */}
        <div className="rounded-3xl overflow-hidden border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623]">
          <ProjectVisualThumbnail project={project} className="aspect-[16/8]" />
        </div>
      </header>

      {/* Additional Screenshots Gallery */}
      {publicScreenshots.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-white">
            Screenshots
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicScreenshots.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightboxImage(img)}
                className="group rounded-2xl overflow-hidden border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left cursor-pointer"
              >
                <div className="aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-slate-950">
                  <img
                    src={img.publicUrl}
                    alt={img.caption || img.originalName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                  />
                </div>
                {img.caption && (
                  <p className="px-3.5 py-2.5 text-xs text-stone-600 dark:text-slate-300 truncate">
                    {img.caption}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Overview, Features & Technologies */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-6 sm:p-8 space-y-3">
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white">
              Project Overview
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-stone-600 dark:text-slate-300 whitespace-pre-line">
              {project.fullDescription}
            </p>
          </div>

          {project.features.length > 0 && (
            <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-6 sm:p-8 space-y-4">
              <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white">
                Key Capabilities &amp; Features
              </h2>
              <ul className="space-y-2.5">
                {project.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white">
              Technologies Used
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {project.technologies.map((tech) => (
                <div
                  key={tech}
                  className="px-3 py-2 rounded-xl border border-stone-200/80 dark:border-slate-800 bg-stone-50/70 dark:bg-slate-900/60 font-mono text-xs text-stone-800 dark:text-slate-200"
                >
                  {tech}
                </div>
              ))}
            </div>
          </div>

          {project.workflowSteps.length > 0 && (
            <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 p-6 space-y-4">
              <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white">
                Project Workflow
              </h2>
              <ol className="space-y-4">
                {project.workflowSteps.map((step, i) => (
                  <li key={i} className="space-y-1 pb-3 border-b last:border-b-0 border-stone-200/70 dark:border-slate-800/70">
                    <p className="text-sm font-semibold text-stone-900 dark:text-white">
                      {String(i + 1).padStart(2, '0')}. {step.title}
                    </p>
                    <p className="text-xs leading-relaxed text-stone-600 dark:text-slate-400">
                      {step.detail}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>

      {/* Individual Digital Project Folder */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Digital Project Folder</p>
          <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-white mt-0.5">
            Source Archives, Screenshots &amp; Documentation
          </h2>
        </div>
        <ProjectFolderExplorer project={project} isAdminView={false} />
      </div>

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="pt-8 border-t border-stone-200 dark:border-slate-800 space-y-6">
          <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-white">
            Related Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProjects.map((rel) => (
              <ProjectCard key={rel.id} project={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Screenshot Lightbox */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            aria-label="Close screenshot"
            className="absolute top-5 right-5 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage.publicUrl}
            alt={lightboxImage.caption || lightboxImage.originalName}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[88vh] object-contain rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
