import {
  Download,
  Eye,
  FileArchive,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Lock,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { formatFileSize, formatShortDate } from '../lib/formatters';
import {
  deleteProjectFile,
  fetchFileBlobUrl,
  updateProjectFile,
  uploadProjectFiles,
} from '../lib/repository';
import type { FileVisibility, FolderSection, Project, ProjectFile } from '../types/portfolio';

interface Props {
  project: Project;
  isAdminView?: boolean;
  onUpdated?: () => Promise<void> | void;
}

const FOLDERS: { key: FolderSection; label: string; description: string; accept: string }[] = [
  {
    key: 'source_zip',
    label: 'Source-Code.zip',
    description: 'Archived source code bundles (.zip, .tar.gz)',
    accept: '.zip,.tar,.gz,.7z',
  },
  {
    key: 'screenshots',
    label: 'Screenshots/',
    description: 'UI captures, architecture diagrams & preview images',
    accept: 'image/*',
  },
  {
    key: 'documentation',
    label: 'Documentation/',
    description: 'PDF specs, design docs, READMEs & manuals',
    accept: '.pdf,.md,.txt,.doc,.docx',
  },
  {
    key: 'other',
    label: 'Project-Files/',
    description: 'Datasets, demo clips & supporting assets',
    accept: '*/*',
  },
];

function isPreviewable(file: ProjectFile): boolean {
  const mime = file.mimeType.toLowerCase();
  const name = file.originalName.toLowerCase();
  return (
    mime.startsWith('image/') ||
    mime === 'application/pdf' ||
    mime.startsWith('text/') ||
    name.endsWith('.md') ||
    name.endsWith('.json') ||
    name.endsWith('.txt')
  );
}

export function ProjectFolderExplorer({ project, isAdminView = false, onUpdated }: Props) {
  const { notify } = usePortfolio();
  const [activeFolder, setActiveFolder] = useState<FolderSection>('source_zip');
  const [uploading, setUploading] = useState(false);
  const [uploadVisibility, setUploadVisibility] = useState<FileVisibility>('public');
  const [uploadCaption, setUploadCaption] = useState('');
  const [previewFile, setPreviewFile] = useState<{ file: ProjectFile; url: string; textContent?: string } | null>(null);

  const files = project.files || [];
  const visibleFiles = isAdminView ? files : files.filter((f) => f.visibility === 'public');
  const folderFiles = visibleFiles.filter((f) => f.folderSection === activeFolder);
  const activeMeta = FOLDERS.find((f) => f.key === activeFolder)!;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewFile(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setUploading(true);
    try {
      await uploadProjectFiles({
        projectId: project.id,
        projectSlug: project.slug,
        folderSection: activeFolder,
        visibility: uploadVisibility,
        caption: uploadCaption,
        files: selected,
      });
      setUploadCaption('');
      notify('success', `Uploaded ${selected.length} file(s) into ${activeMeta.label}`);
      if (onUpdated) await onUpdated();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDownload(file: ProjectFile) {
    try {
      const url = await fetchFileBlobUrl(file, 'download');
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (url.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Download failed.');
    }
  }

  async function handlePreview(file: ProjectFile) {
    try {
      const url = await fetchFileBlobUrl(file, 'preview');
      const isText =
        file.mimeType.startsWith('text/') ||
        file.originalName.endsWith('.md') ||
        file.originalName.endsWith('.json') ||
        file.originalName.endsWith('.txt');
      let textContent: string | undefined;
      if (isText) {
        const res = await fetch(url);
        textContent = await res.text();
      }
      setPreviewFile({ file, url, textContent });
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Unable to preview this file.');
    }
  }

  async function handleToggleVisibility(file: ProjectFile) {
    const next: FileVisibility = file.visibility === 'public' ? 'private' : 'public';
    try {
      await updateProjectFile(file.id, { visibility: next });
      notify('success', `${file.originalName} is now ${next}.`);
      if (onUpdated) await onUpdated();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to update file visibility.');
    }
  }

  async function handleSetThumbnail(file: ProjectFile) {
    try {
      await updateProjectFile(file.id, { isThumbnail: true, visibility: 'public' });
      notify('success', `${file.originalName} set as project thumbnail.`);
      if (onUpdated) await onUpdated();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to set thumbnail.');
    }
  }

  async function handleDelete(file: ProjectFile) {
    try {
      await deleteProjectFile(file);
      notify('success', `Deleted ${file.originalName}.`);
      if (onUpdated) await onUpdated();
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to delete file.');
    }
  }

  return (
    <section
      id="folder-explorer"
      className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white/85 dark:bg-[#131722]/90 backdrop-blur-sm overflow-hidden"
    >
      {/* Folder Path Header */}
      <div className="px-5 py-4 border-b border-stone-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-stone-50/70 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="font-mono text-xs sm:text-sm text-stone-700 dark:text-slate-200 truncate">
            <span className="text-stone-400 dark:text-slate-500">ProjectVerse / Projects / </span>
            <span className="font-semibold text-stone-900 dark:text-white">{project.name}</span>
            <span className="text-stone-400 dark:text-slate-500"> / {activeMeta.label}</span>
          </div>
        </div>

        <div className="text-xs text-stone-500 dark:text-slate-400 font-mono tabular-nums">
          {visibleFiles.length} {visibleFiles.length === 1 ? 'file' : 'files'}{' '}
          {!isAdminView && '· Public access only'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Directory Tree */}
        <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-stone-200 dark:border-slate-800 p-3 space-y-1 bg-stone-50/40 dark:bg-slate-950/30">
          {FOLDERS.map((folder) => {
            const count = visibleFiles.filter((f) => f.folderSection === folder.key).length;
            const active = folder.key === activeFolder;
            return (
              <button
                key={folder.key}
                type="button"
                onClick={() => setActiveFolder(folder.key)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-stone-700 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Folder className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs font-medium truncate">{folder.label}</span>
                </div>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    active ? 'text-stone-300 dark:text-slate-600' : 'text-stone-400 dark:text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <div className="px-3.5 pt-3 pb-1 text-xs text-stone-500 dark:text-slate-400">
            <p className="font-mono text-[11px] text-stone-600 dark:text-slate-300">Project-Details</p>
            <p className="mt-0.5 leading-relaxed">{activeMeta.description}</p>
          </div>
        </aside>

        {/* Right File Listing & Upload */}
        <div className="lg:col-span-8 p-5 space-y-5">
          {isAdminView && (
            <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-slate-700 bg-stone-50/70 dark:bg-slate-900/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-white">
                    Upload to {activeMeta.label}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Choose whether visitors can download these files or keep them private to Admin.
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-lg bg-stone-200/70 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setUploadVisibility('public')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      uploadVisibility === 'public'
                        ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-stone-600 dark:text-slate-400'
                    }`}
                  >
                    Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadVisibility('private')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      uploadVisibility === 'private'
                        ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-sm'
                        : 'text-stone-600 dark:text-slate-400'
                    }`}
                  >
                    Private
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Optional file note or caption..."
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-stone-900 dark:text-white placeholder:text-stone-400"
                />
                <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Select Files'}</span>
                  <input
                    type="file"
                    multiple
                    accept={activeMeta.accept}
                    disabled={uploading}
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {folderFiles.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <FileCode2 className="w-8 h-8 mx-auto text-stone-400 dark:text-slate-600" />
              <p className="text-sm font-medium text-stone-700 dark:text-slate-300">
                No {isAdminView ? '' : 'public '}files inside {activeMeta.label} yet
              </p>
              <p className="text-xs text-stone-500 dark:text-slate-400 max-w-md mx-auto">
                {isAdminView
                  ? 'Upload ZIP archives, screenshots, or documentation files above to populate this project folder.'
                  : 'Project source archives and documentation appear here once published publicly by the portfolio owner.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-200/80 dark:divide-slate-800/80">
              {folderFiles.map((file) => {
                const isImage = file.mimeType.startsWith('image/');
                const isZip =
                  file.originalName.toLowerCase().endsWith('.zip') || file.mimeType.includes('zip');
                return (
                  <div
                    key={file.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-stone-100 dark:bg-slate-800/80 text-stone-600 dark:text-slate-300 shrink-0">
                        {isImage ? (
                          <ImageIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        ) : isZip ? (
                          <FileArchive className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        ) : (
                          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                          {file.originalName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                          <span className="font-mono tabular-nums">{formatFileSize(file.sizeBytes)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatShortDate(file.uploadedAt)}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            {file.visibility === 'public' ? (
                              <>
                                <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-emerald-700 dark:text-emerald-400">Public</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span className="text-amber-700 dark:text-amber-400">Private</span>
                              </>
                            )}
                          </span>
                          {file.isThumbnail && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-violet-600 dark:text-violet-400">
                                Card Thumbnail
                              </span>
                            </>
                          )}
                        </div>
                        {file.caption && (
                          <p className="text-xs text-stone-600 dark:text-slate-300 mt-1">{file.caption}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {isPreviewable(file) && (
                        <button
                          type="button"
                          onClick={() => handlePreview(file)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-medium hover:opacity-90 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      {isAdminView && (
                        <>
                          {isImage && !file.isThumbnail && (
                            <button
                              type="button"
                              onClick={() => handleSetThumbnail(file)}
                              className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              Set Thumbnail
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(file)}
                            className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Make {file.visibility === 'public' ? 'Private' : 'Public'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(file)}
                            aria-label={`Delete ${file.originalName}`}
                            className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Inline File Preview Modal */}
      {previewFile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${previewFile.file.originalName}`}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 dark:text-white truncate">
                  {previewFile.file.originalName}
                </p>
                <p className="text-xs text-stone-500 dark:text-slate-400 font-mono">
                  {formatFileSize(previewFile.file.sizeBytes)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(previewFile.file)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-medium cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  aria-label="Close preview"
                  className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-stone-50 dark:bg-slate-950 flex items-center justify-center">
              {previewFile.file.mimeType.startsWith('image/') ? (
                <img
                  src={previewFile.url}
                  alt={previewFile.file.originalName}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[72vh] object-contain rounded-lg"
                />
              ) : previewFile.file.mimeType === 'application/pdf' ? (
                <iframe
                  title={previewFile.file.originalName}
                  src={previewFile.url}
                  className="w-full h-[72vh] rounded-lg border border-stone-200 dark:border-slate-800 bg-white"
                />
              ) : (
                <pre className="w-full max-h-[72vh] overflow-auto p-4 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 font-mono text-xs text-stone-800 dark:text-slate-200 whitespace-pre-wrap">
                  {previewFile.textContent || 'Preview unavailable.'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
