import { ArrowRight, Code2, FolderGit2, Github, Layers, Linkedin, Mail, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProjectCard } from '../components/ProjectCard';
import { usePortfolio } from '../context/PortfolioContext';
import { ACCENT_THEMES, formatShortDate, isSafeHttpUrl } from '../lib/formatters';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const HERO_ILLUSTRATION = '/src/assets/images/hero_abstract_tech_1795568628558.jpg';
const DEVELOPER_PORTRAIT = '/src/assets/images/developer_portrait_1795568629111.jpg';

function AnimatedNumber({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const duration = 550;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <span className="tabular-nums">{value}</span>;
}

export function HomePage() {
  const { snapshot, loading } = usePortfolio();
  const [heroImgErr, setHeroImgErr] = useState(false);
  const [avatarErr, setAvatarErr] = useState(false);

  const settings = snapshot?.settings;
  useDocumentTitle(
    `${settings?.brandName || 'ProjectVerse'} — ${settings?.heroHeading || 'Ideas Into Interactive Experiences'}`,
    settings?.heroIntro
  );

  if (loading && !snapshot) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 h-80 rounded-3xl bg-stone-200/70 dark:bg-slate-800/60 animate-pulse" />
          <div className="lg:col-span-5 h-80 rounded-3xl bg-stone-200/70 dark:bg-slate-800/60 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-stone-200/60 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const publishedProjects = (snapshot?.projects || []).filter((p) => p.status === 'published');
  const featuredProjects = publishedProjects.filter((p) => p.isFeatured).slice(0, 3);
  const latestProjects = [...publishedProjects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const uniqueTechs = new Set(publishedProjects.flatMap((p) => p.technologies));
  const categories = snapshot?.categories || [];
  const skills = snapshot?.skills || [];
  const skillGroups: Array<'Languages' | 'Frontend' | 'Backend & Data' | 'Tools & DevOps'> = [
    'Languages',
    'Frontend',
    'Backend & Data',
    'Tools & DevOps',
  ];

  const hasGithub = settings?.githubUrl && isSafeHttpUrl(settings.githubUrl);
  const hasLinkedin = settings?.linkedinUrl && isSafeHttpUrl(settings.linkedinUrl);

  return (
    <div className="relative overflow-x-clip">
      {/* Subtle Ambient Animated Gradient Orbs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-float-slow absolute -top-28 -left-24 w-[420px] h-[420px] rounded-full bg-emerald-400/16 dark:bg-emerald-500/12 blur-3xl" />
        <div className="animate-float-reverse absolute top-16 -right-24 w-[440px] h-[440px] rounded-full bg-violet-400/16 dark:bg-violet-600/14 blur-3xl" />
        <div className="animate-float-slow absolute top-[45%] left-1/3 w-[360px] h-[360px] rounded-full bg-sky-400/14 dark:bg-sky-500/10 blur-3xl" />
        <div className="animate-float-reverse absolute bottom-0 right-1/4 w-[380px] h-[380px] rounded-full bg-orange-300/16 dark:bg-pink-500/10 blur-3xl" />
      </div>

      {/* HERO SPLIT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-between rounded-3xl border border-stone-200/80 dark:border-slate-800/90 bg-white/75 dark:bg-[#121623]/80 backdrop-blur-md p-7 sm:p-10"
          >
            <div className="space-y-6">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {settings?.ownerName || 'Kruthi'} · {settings?.roleTitle || 'Computer Science Student & Developer'}
              </p>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] text-stone-950 dark:text-white [text-wrap:balance]">
                {settings?.heroHeading || 'Ideas Into Interactive Experiences.'}
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-stone-600 dark:text-slate-300 max-w-2xl">
                {settings?.heroIntro}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-200/70 dark:border-slate-800/80 flex flex-wrap items-center gap-3.5">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-sky-600 to-violet-600 hover:from-emerald-500 hover:via-sky-500 hover:to-violet-500 text-white text-sm font-semibold shadow-sm transition-all duration-150 whitespace-nowrap shrink-0"
              >
                <span>Explore My Projects</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-stone-900 dark:text-white hover:bg-stone-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <span>Contact Me</span>
              </Link>

              <div className="flex items-center gap-2 sm:ml-auto">
                {hasGithub && (
                  <a
                    href={settings!.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-800 text-xs font-medium text-stone-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
                {hasLinkedin && (
                  <a
                    href={settings!.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-800 text-xs font-medium text-stone-700 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-900 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Hero Visual Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 rounded-3xl border border-stone-200/80 dark:border-slate-800/90 bg-white/75 dark:bg-[#121623]/80 overflow-hidden relative min-h-[280px]"
          >
            {!heroImgErr ? (
              <img
                src={HERO_ILLUSTRATION}
                alt="Architectural translucent prism technology composition"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgErr(true)}
                className="w-full h-full lg:h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-sky-500/20 to-violet-500/25 flex items-center justify-center p-8">
                <Sparkles className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/75 via-black/35 to-transparent text-white">
              <p className="font-mono text-xs text-emerald-300">ProjectVerse / Projects /</p>
              <p className="text-sm font-medium mt-0.5">
                Structured software folders, source archives &amp; living docs
              </p>
            </div>
          </motion.div>
        </div>

        {/* Full-Width 4-Column Animated KPI Strip Below Hero Split */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-stone-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#121623]/80 p-5">
            <p className="text-xs text-stone-500 dark:text-slate-400">Published Projects</p>
            <p className="font-display text-3xl font-bold text-stone-900 dark:text-white mt-1">
              <AnimatedNumber target={publishedProjects.length} />
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#121623]/80 p-5">
            <p className="text-xs text-stone-500 dark:text-slate-400">Project Categories</p>
            <p className="font-display text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              <AnimatedNumber target={categories.length} />
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#121623]/80 p-5">
            <p className="text-xs text-stone-500 dark:text-slate-400">Technologies Used</p>
            <p className="font-display text-3xl font-bold text-violet-700 dark:text-violet-400 mt-1">
              <AnimatedNumber target={uniqueTechs.size} />
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#121623]/80 p-5">
            <p className="text-xs text-stone-500 dark:text-slate-400">Public Folder Files</p>
            <p className="font-display text-3xl font-bold text-sky-700 dark:text-sky-400 mt-1">
              <AnimatedNumber target={snapshot?.stats.publicFiles || 0} />
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-stone-200/70 dark:border-slate-800/70">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium text-violet-700 dark:text-violet-400">Selected Work</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white mt-1">
              Featured Projects
            </h2>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
          >
            <span>Open Project Explorer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(featuredProjects.length > 0 ? featuredProjects : publishedProjects.slice(0, 3)).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* PROJECT CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-stone-200/70 dark:border-slate-800/70">
        <div className="mb-8">
          <p className="text-xs font-medium text-sky-700 dark:text-sky-400">Organized Architecture</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white mt-1">
            Project Categories
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const count = publishedProjects.filter((p) => p.categoryId === cat.id).length;
            const accent = ACCENT_THEMES[cat.accentColor] || ACCENT_THEMES.emerald;
            return (
              <Link
                key={cat.id}
                to={`/projects?category=${encodeURIComponent(cat.slug)}`}
                className="group rounded-2xl border border-stone-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#121623]/80 p-5 flex flex-col justify-between gap-4 hover:-translate-y-0.5 hover:border-stone-300 dark:hover:border-slate-700 transition-all duration-150"
              >
                <div className="space-y-2">
                  <div className={`h-1 w-10 rounded-full bg-gradient-to-r ${accent.gradientBar}`} />
                  <h3 className="font-display text-base font-bold text-stone-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs leading-relaxed text-stone-600 dark:text-slate-400 line-clamp-2">
                    {cat.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-stone-500 dark:text-slate-400 pt-2 border-t border-stone-200/60 dark:border-slate-800/70">
                  <span className="tabular-nums">{count} {count === 1 ? 'project' : 'projects'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* LATEST PROJECTS & TIMELINE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-stone-200/70 dark:border-slate-800/70">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium text-orange-700 dark:text-orange-400">Chronological Log</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-white mt-1">
              Latest Projects &amp; Timeline
            </h2>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white"
          >
            <span>Browse full archive</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-stone-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#121623]/80 divide-y divide-stone-200/70 dark:divide-slate-800/70">
          {latestProjects.map((project) => {
            const accent = ACCENT_THEMES[project.accentTheme] || ACCENT_THEMES.emerald;
            return (
              <Link
                key={project.id}
                to={`/projects/${project.slug}`}
                className="group p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/90 dark:hover:bg-slate-900/50 transition-colors"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-slate-400">
                    <span className="font-mono tabular-nums">{formatShortDate(project.createdAt)}</span>
                    <span aria-hidden="true">·</span>
                    <span className={`font-medium ${accent.textAccent}`}>{project.categoryName}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-stone-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-slate-300">{project.shortDescription}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="hidden sm:inline font-mono text-xs text-stone-500 dark:text-slate-400">
                    {project.technologies.slice(0, 3).join(' · ')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-800 dark:text-slate-200">
                    <span>Open Folder</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ABOUT ME & SKILLS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-stone-200/70 dark:border-slate-800/70">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 rounded-3xl border border-stone-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#121623]/85 p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-stone-200 dark:border-slate-700 bg-stone-100 dark:bg-slate-800 shrink-0">
                {!avatarErr ? (
                  <img
                    src={DEVELOPER_PORTRAIT}
                    alt={`${settings?.ownerName || 'Developer'} portrait`}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarErr(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400">
                    <Code2 className="w-7 h-7" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-pink-700 dark:text-pink-400">About the Builder</p>
                <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-white">
                  {settings?.ownerName || 'Kruthi'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">{settings?.location}</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-stone-600 dark:text-slate-300">
              {settings?.aboutIntro}
            </p>

            <div className="pt-4 border-t border-stone-200/70 dark:border-slate-800/70 space-y-2">
              <p className="text-xs font-semibold text-stone-800 dark:text-slate-200">Education</p>
              <p className="text-xs leading-relaxed text-stone-600 dark:text-slate-400">{settings?.education}</p>
            </div>

            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <span>Read full background &amp; goals</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-stone-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#121623]/85 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Technical Stack</p>
                <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-white mt-0.5">
                  Skills &amp; Technologies
                </h3>
              </div>
              <Layers className="w-5 h-5 text-stone-400 dark:text-slate-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {skillGroups.map((group) => {
                const items = skills.filter((s) => s.group === group);
                return (
                  <div key={group} className="space-y-2.5">
                    <h4 className="text-xs font-semibold text-stone-900 dark:text-white pb-1.5 border-b border-stone-200/80 dark:border-slate-800">
                      {group}
                    </h4>
                    <ul className="space-y-1.5">
                      {items.map((skill) => (
                        <li
                          key={skill.id}
                          className="flex items-center justify-between gap-2 text-sm text-stone-700 dark:text-slate-300"
                        >
                          <span>{skill.name}</span>
                          <span className="text-xs font-mono text-stone-400 dark:text-slate-500">
                            {skill.level}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-4">
        <div className="rounded-3xl border border-stone-200/80 dark:border-slate-800/80 bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-violet-500/12 dark:from-emerald-500/10 dark:via-sky-500/10 dark:to-violet-600/15 p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Let&apos;s Connect</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
              Have a project, role, or collaboration in mind?
            </h2>
            <p className="text-sm text-stone-600 dark:text-slate-300">
              Reach out directly via email or connect on GitHub and LinkedIn. Every contact detail can be updated anytime from the Admin dashboard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {settings?.email && (
              <a
                href={`mailto:${settings.email}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Mail className="w-4 h-4" />
                <span>Email Me</span>
              </a>
            )}
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-stone-900 dark:text-white text-sm font-semibold hover:bg-white dark:hover:bg-slate-800 transition-colors"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Contact Details</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
