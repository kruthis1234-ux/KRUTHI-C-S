import { ArrowUpDown, RotateCcw, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProjectCard } from '../components/ProjectCard';
import { usePortfolio } from '../context/PortfolioContext';
import { useDocumentTitle } from '../lib/useDocumentTitle';

type SortOption = 'newest' | 'oldest' | 'featured' | 'alpha';

export function ProjectsPage() {
  const { snapshot, loading } = usePortfolio();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get('category') || 'all';
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedTech, setSelectedTech] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    const paramCat = searchParams.get('category') || 'all';
    setSelectedCategory(paramCat);
  }, [searchParams]);

  useDocumentTitle(
    'Project Explorer — ProjectVerse',
    'Browse software applications, developer utilities, visual workflow builders, and public project folders.'
  );

  const categories = snapshot?.categories || [];
  const publishedProjects = useMemo(
    () => (snapshot?.projects || []).filter((p) => p.status === 'published'),
    [snapshot?.projects]
  );

  const allTechnologies = useMemo(() => {
    const set = new Set<string>();
    publishedProjects.forEach((p) => p.technologies.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [publishedProjects]);

  const featuredProjects = useMemo(
    () => publishedProjects.filter((p) => p.isFeatured),
    [publishedProjects]
  );

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = publishedProjects.filter((project) => {
      if (featuredOnly && !project.isFeatured) return false;

      if (selectedCategory !== 'all') {
        const cat = categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory);
        if (!cat || project.categoryId !== cat.id) return false;
      }

      if (selectedTech !== 'all' && !project.technologies.includes(selectedTech)) {
        return false;
      }

      if (q) {
        const haystack = [
          project.name,
          project.shortDescription,
          project.fullDescription,
          project.categoryName || '',
          ...project.technologies,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'featured') {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'alpha') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [publishedProjects, categories, search, selectedCategory, selectedTech, sortBy, featuredOnly]);

  function handleCategoryChange(slug: string) {
    setSelectedCategory(slug);
    if (slug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams, { replace: true });
  }

  function resetFilters() {
    setSearch('');
    setSelectedTech('all');
    setFeaturedOnly(false);
    setSortBy('newest');
    handleCategoryChange('all');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Page Header */}
      <div className="space-y-2 max-w-2xl">
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Project Explorer</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-stone-950 dark:text-white">
          All Software Projects &amp; Folders
        </h1>
        <p className="text-sm sm:text-base text-stone-600 dark:text-slate-300">
          Search, filter by category or technology stack, and open any project&apos;s digital folder to explore documentation, screenshots, and downloadable releases.
        </p>
      </div>

      {/* Featured Projects Strip (when unfiltered) */}
      {featuredProjects.length > 0 && selectedCategory === 'all' && !search && selectedTech === 'all' && !featuredOnly && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-white">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span>Featured Highlights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredProjects.slice(0, 3).map((project) => (
              <ProjectCard key={`feat-${project.id}`} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#121623]/85 backdrop-blur-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by name, keyword, or technology..."
              aria-label="Search projects"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              aria-label="Filter by technology"
              className="px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-xs sm:text-sm text-stone-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="all">All Technologies</option>
              {allTechnologies.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>

            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort projects"
                className="bg-transparent text-xs sm:text-sm text-stone-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="featured">Featured First</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setFeaturedOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                featuredOnly
                  ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                  : 'border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${featuredOnly ? 'fill-current' : ''}`} />
              <span>Featured Only</span>
            </button>
          </div>
        </div>

        {/* Interactive Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleCategoryChange('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === cat.slug
                  ? 'bg-stone-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
        <span className="font-mono tabular-nums">
          Showing {filteredProjects.length} of {publishedProjects.length} published projects
        </span>
        {(search || selectedCategory !== 'all' || selectedTech !== 'all' || featuredOnly) && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Project Grid */}
      {loading && !snapshot ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-stone-200/60 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/80 dark:bg-[#121623]/80 p-12 text-center space-y-3">
          <p className="font-display text-lg font-semibold text-stone-900 dark:text-white">
            No matching projects found
          </p>
          <p className="text-sm text-stone-500 dark:text-slate-400 max-w-md mx-auto">
            Try clearing your search query or switching category and technology filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
