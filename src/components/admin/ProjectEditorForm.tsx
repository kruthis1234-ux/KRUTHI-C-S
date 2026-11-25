import { FileArchive, FileText, Image as ImageIcon, Plus, Save, Star, Trash2, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { isSafeHttpUrl } from '../../lib/formatters';
import { createProject, updateProject, uploadProjectFiles } from '../../lib/repository';
import type { AccentTheme, Category, FileVisibility, Project, ProjectStatus, WorkflowStep } from '../../types/portfolio';

interface Props {
  categories: Category[];
  editingProject?: Project | null;
  onSaved: (project: Project) => Promise<void> | void;
  onCancel?: () => void;
}

export function ProjectEditorForm({ categories, editingProject, onSaved, onCancel }: Props) {
  const { notify } = usePortfolio();

  const [name, setName] = useState(editingProject?.name || '');
  const [shortDescription, setShortDescription] = useState(editingProject?.shortDescription || '');
  const [fullDescription, setFullDescription] = useState(editingProject?.fullDescription || '');
  const [categoryId, setCategoryId] = useState(
    editingProject?.categoryId || categories[0]?.id || ''
  );
  const [technologiesText, setTechnologiesText] = useState(
    (editingProject?.technologies || []).join(', ')
  );
  const [featuresText, setFeaturesText] = useState(
    (editingProject?.features || []).join('\n')
  );
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>(
    editingProject?.workflowSteps?.length
      ? editingProject.workflowSteps
      : [{ title: '', detail: '' }]
  );
  const [liveDemoUrl, setLiveDemoUrl] = useState(editingProject?.liveDemoUrl || '');
  const [githubUrl, setGithubUrl] = useState(editingProject?.githubUrl || '');
  const [isFeatured, setIsFeatured] = useState(Boolean(editingProject?.isFeatured));
  const [accentTheme, setAccentTheme] = useState<AccentTheme>(
    editingProject?.accentTheme || 'emerald'
  );
  const [timelineLabel, setTimelineLabel] = useState(
    editingProject?.timelineLabel || String(new Date().getFullYear())
  );

  // Staged file uploads for single-submit project creation/update
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [zipVisibility, setZipVisibility] = useState<FileVisibility>('public');
  const [docVisibility, setDocVisibility] = useState<FileVisibility>('public');

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(targetStatus: ProjectStatus) {
    if (!name.trim()) {
      notify('error', 'Project Name is required.');
      return;
    }
    if (!shortDescription.trim()) {
      notify('error', 'Short Description is required.');
      return;
    }
    if (liveDemoUrl.trim() && !isSafeHttpUrl(liveDemoUrl.trim())) {
      notify('error', 'Live Demo URL must start with http:// or https://');
      return;
    }
    if (githubUrl.trim() && !isSafeHttpUrl(githubUrl.trim())) {
      notify('error', 'GitHub Repository URL must start with http:// or https://');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim() || shortDescription.trim(),
        categoryId,
        technologies: technologiesText
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        features: featuresText
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean),
        workflowSteps: workflowSteps.filter((s) => s.title.trim()),
        liveDemoUrl: liveDemoUrl.trim(),
        githubUrl: githubUrl.trim(),
        thumbnailUrl: editingProject?.thumbnailUrl || '',
        status: targetStatus,
        isFeatured,
        accentTheme,
        timelineLabel: timelineLabel.trim() || String(new Date().getFullYear()),
      };

      let saved: Project = editingProject
        ? await updateProject(editingProject.id, payload)
        : await createProject(payload);

      if (thumbnailFile) {
        saved = await uploadProjectFiles({
          projectId: saved.id,
          projectSlug: saved.slug,
          folderSection: 'screenshots',
          visibility: 'public',
          isThumbnail: true,
          caption: 'Main Project Thumbnail',
          files: [thumbnailFile],
        });
      }

      if (screenshotFiles.length > 0) {
        saved = await uploadProjectFiles({
          projectId: saved.id,
          projectSlug: saved.slug,
          folderSection: 'screenshots',
          visibility: 'public',
          files: screenshotFiles,
        });
      }

      if (zipFile) {
        saved = await uploadProjectFiles({
          projectId: saved.id,
          projectSlug: saved.slug,
          folderSection: 'source_zip',
          visibility: zipVisibility,
          files: [zipFile],
        });
      }

      if (docFiles.length > 0) {
        saved = await uploadProjectFiles({
          projectId: saved.id,
          projectSlug: saved.slug,
          folderSection: 'documentation',
          visibility: docVisibility,
          files: docFiles,
        });
      }

      notify(
        'success',
        editingProject
          ? `Updated "${saved.name}" (${targetStatus}).`
          : `Created "${saved.name}" (${targetStatus}).`
      );
      await onSaved(saved);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to save project.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit('published');
      }}
      className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623] p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-800">
        <div>
          <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white">
            {editingProject ? `Edit Project: ${editingProject.name}` : 'Add New Project'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            Creates an individual digital folder under ProjectVerse/Projects/ with optional ZIP, screenshots &amp; docs.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-medium text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel Editing
          </button>
        )}
      </div>

      {/* Core Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="proj-name" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
            1. Project Name *
          </label>
          <input
            id="proj-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., CalcNova Pro"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="proj-cat" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
            4. Project Category *
          </label>
          <select
            id="proj-cat"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="proj-short" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
          2. Short Description *
        </label>
        <input
          id="proj-short"
          type="text"
          required
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Concise one-sentence summary shown on gallery cards"
          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="proj-full" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
          3. Full Description
        </label>
        <textarea
          id="proj-full"
          rows={4}
          value={fullDescription}
          onChange={(e) => setFullDescription(e.target.value)}
          placeholder="Detailed engineering overview, problem statement, and architecture notes..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-1.5">
          <label htmlFor="proj-tech" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
            5. Technologies Used (comma-separated)
          </label>
          <input
            id="proj-tech"
            type="text"
            value={technologiesText}
            onChange={(e) => setTechnologiesText(e.target.value)}
            placeholder="React, TypeScript, Tailwind CSS, Supabase"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="proj-accent" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
            Card Gradient Theme
          </label>
          <select
            id="proj-accent"
            value={accentTheme}
            onChange={(e) => setAccentTheme(e.target.value as AccentTheme)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
          >
            <option value="emerald">Emerald Green</option>
            <option value="purple">Electric Purple</option>
            <option value="sky">Sky Blue</option>
            <option value="coral">Coral Orange</option>
            <option value="pink">Soft Pink</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="proj-demo" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
            6. Live Demo URL
          </label>
          <input
            id="proj-demo"
            type="url"
            value={liveDemoUrl}
            onChange={(e) => setLiveDemoUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="proj-github" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
            7. GitHub Repository URL
          </label>
          <input
            id="proj-github"
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="proj-year" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
            Timeline Year / Label
          </label>
          <input
            id="proj-year"
            type="text"
            value={timelineLabel}
            onChange={(e) => setTimelineLabel(e.target.value)}
            placeholder="2026"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
          />
        </div>
      </div>

      {/* Features & Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="proj-features" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
            Key Features (one per line)
          </label>
          <textarea
            id="proj-features"
            rows={4}
            value={featuresText}
            onChange={(e) => setFeaturesText(e.target.value)}
            placeholder="Real-time dependency graph&#10;Exportable JSON reports"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">
              Project Workflow Steps
            </span>
            <button
              type="button"
              onClick={() => setWorkflowSteps((prev) => [...prev, { title: '', detail: '' }])}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Step</span>
            </button>
          </div>
          <div className="space-y-2">
            {workflowSteps.map((step, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) =>
                    setWorkflowSteps((prev) =>
                      prev.map((s, idx) => (idx === i ? { ...s, title: e.target.value } : s))
                    )
                  }
                  placeholder={`Step ${i + 1} title`}
                  className="w-1/3 px-3 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-xs text-stone-900 dark:text-white"
                />
                <input
                  type="text"
                  value={step.detail}
                  onChange={(e) =>
                    setWorkflowSteps((prev) =>
                      prev.map((s, idx) => (idx === i ? { ...s, detail: e.target.value } : s))
                    )
                  }
                  placeholder="Step description"
                  className="flex-1 px-3 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900 text-xs text-stone-900 dark:text-white"
                />
                {workflowSteps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setWorkflowSteps((prev) => prev.filter((_, idx) => idx !== i))}
                    aria-label="Remove step"
                    className="p-2 text-stone-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* File Uploads: 8. Thumbnail, 9. Screenshots, 10. ZIP Folder, 11. Documentation */}
      <div className="pt-2 border-t border-stone-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-900/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-slate-200">
            <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>8. Project Thumbnail Image</span>
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-stone-700 dark:text-slate-200 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{thumbnailFile ? thumbnailFile.name : 'Choose Thumbnail'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-900/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-slate-200">
            <ImageIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>9. Multiple Screenshots (Public)</span>
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-stone-700 dark:text-slate-200 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>
              {screenshotFiles.length > 0
                ? `${screenshotFiles.length} screenshot(s) selected`
                : 'Select Screenshots'}
            </span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setScreenshotFiles(Array.from(e.target.files || []))}
              className="hidden"
            />
          </label>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-900/40 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-slate-200">
              <FileArchive className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>10. Project ZIP Folder</span>
            </div>
            <select
              value={zipVisibility}
              onChange={(e) => setZipVisibility(e.target.value as FileVisibility)}
              aria-label="ZIP visibility"
              className="px-2 py-1 rounded-md border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-stone-700 dark:text-slate-200 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>{zipFile ? zipFile.name : 'Upload Source-Code.zip'}</span>
            <input
              type="file"
              accept=".zip,.tar,.gz,.7z"
              onChange={(e) => setZipFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-900/40 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-slate-200">
              <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>11. Documentation Files</span>
            </div>
            <select
              value={docVisibility}
              onChange={(e) => setDocVisibility(e.target.value as FileVisibility)}
              aria-label="Documentation visibility"
              className="px-2 py-1 rounded-md border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-stone-700 dark:text-slate-200 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>
              {docFiles.length > 0 ? `${docFiles.length} doc(s) selected` : 'Upload PDF / Markdown'}
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.md,.txt,.doc,.docx"
              onChange={(e) => setDocFiles(Array.from(e.target.files || []))}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 12. Featured Toggle & 13. Publish / Save Draft */}
      <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <label className="inline-flex items-center gap-2.5 text-sm font-medium text-stone-800 dark:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 rounded accent-amber-500"
          />
          <Star className={`w-4 h-4 ${isFeatured ? 'text-amber-500 fill-current' : 'text-stone-400'}`} />
          <span>12. Featured Project</span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit('draft')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-slate-700 text-sm font-semibold text-stone-800 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save as Draft</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-sky-600 to-violet-600 text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{submitting ? 'Saving...' : '13. Publish Project'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
