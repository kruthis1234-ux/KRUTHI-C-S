import {
  CheckCircle2,
  Database,
  Edit3,
  Eye,
  EyeOff,
  FolderOpen,
  Layers,
  Lock,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProjectEditorForm } from '../components/admin/ProjectEditorForm';
import { ProjectFolderExplorer } from '../components/ProjectFolderExplorer';
import { usePortfolio } from '../context/PortfolioContext';
import {
  claimAdminPassword,
  createCategory,
  createSkill,
  deleteCategory,
  deleteProject,
  deleteSkill,
  loginAdmin,
  logoutAdmin,
  saveSettings,
  updateProject,
} from '../lib/repository';
import { isSupabaseConfigured } from '../lib/supabase';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import type { AccentTheme, PortfolioSettings, Project, Skill } from '../types/portfolio';

type AdminTab = 'overview' | 'new_project' | 'folders' | 'taxonomy' | 'settings';

export function AdminPage() {
  const { snapshot, authStatus, refreshAuth, refreshPortfolio, notify } = usePortfolio();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [folderProjectId, setFolderProjectId] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Taxonomy form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState<AccentTheme>('emerald');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillGroup, setNewSkillGroup] = useState<Skill['group']>('Languages');
  const [newSkillLevel, setNewSkillLevel] = useState<Skill['level']>('Core');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<PortfolioSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  useDocumentTitle('Admin Dashboard — ProjectVerse');

  useEffect(() => {
    if (snapshot?.settings) {
      setSettingsForm(snapshot.settings);
    }
    if (snapshot?.projects.length && !folderProjectId) {
      setFolderProjectId(snapshot.projects[0].id);
    }
  }, [snapshot, folderProjectId]);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      notify('error', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      notify('error', 'Passwords do not match.');
      return;
    }
    setAuthBusy(true);
    try {
      await claimAdminPassword(password);
      setPassword('');
      setConfirmPassword('');
      await refreshAuth();
      await refreshPortfolio();
      notify('success', 'Administrator password set and signed in.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Unable to claim admin password.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthBusy(true);
    try {
      await loginAdmin({ email: email.trim(), password });
      setPassword('');
      await refreshAuth();
      await refreshPortfolio();
      notify('success', 'Signed in to ProjectVerse Admin.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    await logoutAdmin();
    await refreshAuth();
    await refreshPortfolio();
    notify('info', 'Signed out of Administrator Console.');
  }

  if (!authStatus) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="h-64 rounded-2xl bg-stone-200/70 dark:bg-slate-800/60 animate-pulse" />
      </div>
    );
  }

  // AUTH GATE
  if (!authStatus.authenticated) {
    const needsClaim = authStatus.mode === 'server' && !authStatus.envConfigured && !authStatus.claimed;

    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="rounded-3xl border border-stone-200 dark:border-slate-800 bg-white/90 dark:bg-[#121623]/90 p-7 sm:p-9 space-y-6 shadow-sm">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-violet-600 text-white flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl font-bold text-stone-950 dark:text-white">
              {needsClaim ? 'Set Administrator Password' : 'Admin Dashboard Sign-In'}
            </h1>
            <p className="text-xs leading-relaxed text-stone-600 dark:text-slate-400">
              {needsClaim
                ? 'First-run setup: create a secure password (8+ characters) to claim ownership of your ProjectVerse Admin Console.'
                : authStatus.mode === 'supabase'
                  ? 'Sign in with your Supabase administrator email and password.'
                  : 'Enter your ProjectVerse administrator password to manage projects, folders, and site settings.'}
            </p>
          </div>

          <form onSubmit={needsClaim ? handleClaim : handleLogin} className="space-y-4">
            {authStatus.mode === 'supabase' && (
              <div className="space-y-1.5">
                <label htmlFor="admin-email" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Admin Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourdomain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="admin-pass" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="admin-pass"
                type="password"
                required
                minLength={needsClaim ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={needsClaim ? 'Minimum 8 characters' : 'Enter password'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
              />
            </div>

            {needsClaim && (
              <div className="space-y-1.5">
                <label htmlFor="admin-pass-confirm" className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <input
                  id="admin-pass-confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm text-stone-900 dark:text-white"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={authBusy}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-sky-600 to-violet-600 text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 cursor-pointer"
            >
              {authBusy ? 'Authenticating...' : needsClaim ? 'Claim Admin Access' : 'Sign In'}
            </button>
          </form>

          <p className="text-[11px] text-stone-500 dark:text-slate-400 leading-relaxed">
            Storage backend: <span className="font-mono">{isSupabaseConfigured() ? 'Supabase Cloud' : 'Built-in Server'}</span>. Private files and draft projects remain hidden from public visitors.
          </p>
        </div>
      </div>
    );
  }

  const projects = snapshot?.projects || [];
  const categories = snapshot?.categories || [];
  const skills = snapshot?.skills || [];
  const stats = snapshot?.stats;
  const activeFolderProject = projects.find((p) => p.id === folderProjectId) || projects[0] || null;

  async function handleTogglePublish(project: Project) {
    const nextStatus = project.status === 'published' ? 'draft' : 'published';
    try {
      await updateProject(project.id, { status: nextStatus });
      await refreshPortfolio();
      notify('success', `${project.name} is now ${nextStatus}.`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Status update failed.');
    }
  }

  async function handleDeleteProject(project: Project) {
    try {
      await deleteProject(project.id);
      setConfirmDeleteId(null);
      await refreshPortfolio();
      notify('success', `Deleted "${project.name}" and its folder files.`);
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to delete project.');
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
        accentColor: newCatColor,
      });
      setNewCatName('');
      setNewCatDesc('');
      await refreshPortfolio();
      notify('success', 'Category added.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to create category.');
    }
  }

  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    try {
      await createSkill({
        name: newSkillName.trim(),
        group: newSkillGroup,
        level: newSkillLevel,
      });
      setNewSkillName('');
      await refreshPortfolio();
      notify('success', 'Skill added.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to add skill.');
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settingsForm) return;
    setSavingSettings(true);
    try {
      await saveSettings(settingsForm);
      await refreshPortfolio();
      notify('success', 'Portfolio profile, About Me, and Contact details saved.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Private Administrator Console
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-950 dark:text-white mt-0.5">
            ProjectVerse Workspace
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEditingProject(null);
              setTab('new_project');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Project</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 dark:border-slate-700 text-xs font-semibold text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623] p-5">
          <p className="text-xs text-stone-500 dark:text-slate-400">Total Projects</p>
          <p className="font-display text-3xl font-bold tabular-nums text-stone-900 dark:text-white mt-1">
            {stats?.totalProjects ?? projects.length}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623] p-5">
          <p className="text-xs text-stone-500 dark:text-slate-400">Published Projects</p>
          <p className="font-display text-3xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
            {stats?.publishedProjects ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623] p-5">
          <p className="text-xs text-stone-500 dark:text-slate-400">Draft Projects</p>
          <p className="font-display text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {stats?.draftProjects ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623] p-5">
          <p className="text-xs text-stone-500 dark:text-slate-400">Total Uploaded Files</p>
          <p className="font-display text-3xl font-bold tabular-nums text-violet-700 dark:text-violet-400 mt-1">
            {stats?.totalFiles ?? 0}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-slate-400 font-mono mt-0.5 tabular-nums">
            {stats?.publicFiles ?? 0} public · {stats?.privateFiles ?? 0} private
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-stone-200/70 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 w-fit">
        {[
          { key: 'overview', label: 'Projects Manager', icon: Layers },
          { key: 'new_project', label: editingProject ? 'Edit Project' : 'Add New Project', icon: Plus },
          { key: 'folders', label: 'Folders & Files', icon: FolderOpen },
          { key: 'taxonomy', label: 'Categories & Skills', icon: ShieldCheck },
          { key: 'settings', label: 'About, Contact & Supabase', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key as AdminTab)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-white dark:bg-slate-800 text-stone-950 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-slate-400 hover:text-stone-950 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROJECTS TABLE */}
      {tab === 'overview' && (
        <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 text-xs text-stone-500 dark:text-slate-400 bg-stone-50/70 dark:bg-slate-900/50">
                  <th className="py-3.5 px-5 font-semibold">Project</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Files</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/80 dark:divide-slate-800/80 text-sm">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-stone-50/70 dark:hover:bg-slate-900/40">
                    <td className="py-3.5 px-5">
                      <Link
                        to={`/projects/${project.slug}`}
                        className="font-semibold text-stone-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400"
                      >
                        {project.name}
                      </Link>
                      <p className="text-xs text-stone-500 dark:text-slate-400 truncate max-w-xs">
                        {project.shortDescription}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-600 dark:text-slate-300">
                      {project.categoryName}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          project.status === 'published'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {project.status === 'published' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                        <span className="capitalize">{project.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums text-stone-600 dark:text-slate-300">
                      {(project.files || []).length}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(project)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          {project.status === 'published' ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Unpublish</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Publish</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFolderProjectId(project.id);
                            setTab('folders');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>Folder</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProject(project);
                            setTab('new_project');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-medium text-stone-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        {confirmDeleteId === project.id ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(project)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(project.id)}
                            aria-label={`Delete ${project.name}`}
                            className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ADD / EDIT PROJECT FORM */}
      {tab === 'new_project' && (
        <ProjectEditorForm
          key={editingProject?.id || 'new'}
          categories={categories}
          editingProject={editingProject}
          onCancel={
            editingProject
              ? () => {
                  setEditingProject(null);
                  setTab('overview');
                }
              : undefined
          }
          onSaved={async (saved) => {
            setEditingProject(null);
            setFolderProjectId(saved.id);
            await refreshPortfolio();
            setTab('overview');
          }}
        />
      )}

      {/* TAB 3: PROJECT FOLDERS & SCREENSHOTS MANAGER */}
      {tab === 'folders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623] p-4">
            <label htmlFor="folder-select" className="text-sm font-semibold text-stone-900 dark:text-white">
              Select Project Folder:
            </label>
            <select
              id="folder-select"
              value={activeFolderProject?.id || ''}
              onChange={(e) => setFolderProjectId(e.target.value)}
              className="px-4 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm text-stone-900 dark:text-white min-w-[260px]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.status})
                </option>
              ))}
            </select>
          </div>

          {activeFolderProject && (
            <ProjectFolderExplorer
              project={activeFolderProject}
              isAdminView={true}
              onUpdated={refreshPortfolio}
            />
          )}
        </div>
      )}

      {/* TAB 4: CATEGORIES & SKILLS */}
      {tab === 'taxonomy' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623] p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-white">
              Manage Project Categories
            </h2>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category name"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
                />
                <select
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value as AccentTheme)}
                  className="px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
                >
                  <option value="emerald">Emerald</option>
                  <option value="purple">Purple</option>
                  <option value="sky">Sky</option>
                  <option value="coral">Coral</option>
                  <option value="pink">Pink</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Short description..."
                  className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  Add Category
                </button>
              </div>
            </form>

            <div className="divide-y divide-stone-200/80 dark:divide-slate-800/80">
              {categories.map((cat) => (
                <div key={cat.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900 dark:text-white">{cat.name}</p>
                    <p className="text-xs text-stone-500 dark:text-slate-400">{cat.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteCategory(cat.id);
                      await refreshPortfolio();
                      notify('success', `Removed category "${cat.name}".`);
                    }}
                    aria-label={`Delete category ${cat.name}`}
                    className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623] p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-white">
              Manage Skills &amp; Technologies
            </h2>
            <form onSubmit={handleAddSkill} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                required
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Skill (e.g., Docker)"
                className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
              />
              <select
                value={newSkillGroup}
                onChange={(e) => setNewSkillGroup(e.target.value as Skill['group'])}
                className="px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs"
              >
                <option value="Languages">Languages</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend & Data">Backend &amp; Data</option>
                <option value="Tools & DevOps">Tools &amp; DevOps</option>
              </select>
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
              >
                Add Skill
              </button>
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value as Skill['level'])}
                aria-label="Proficiency level"
                className="sm:col-span-4 px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs"
              >
                <option value="Core">Core Proficiency</option>
                <option value="Proficient">Proficient</option>
                <option value="Exploring">Currently Exploring</option>
              </select>
            </form>

            <div className="max-h-80 overflow-y-auto divide-y divide-stone-200/80 dark:divide-slate-800/80">
              {skills.map((skill) => (
                <div key={skill.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div>
                    <span className="font-medium text-stone-900 dark:text-white">{skill.name}</span>
                    <span className="text-xs text-stone-500 dark:text-slate-400 ml-2">
                      {skill.group} · {skill.level}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteSkill(skill.id);
                      await refreshPortfolio();
                      notify('success', `Removed skill "${skill.name}".`);
                    }}
                    aria-label={`Delete skill ${skill.name}`}
                    className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EDIT ABOUT ME, CONTACT & SUPABASE GUIDE */}
      {tab === 'settings' && settingsForm && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveSettings}
            className="lg:col-span-8 rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623] p-6 sm:p-8 space-y-5"
          >
            <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white">
              Edit About Me &amp; Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">Owner Name</label>
                <input
                  type="text"
                  value={settingsForm.ownerName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, ownerName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">Role Title</label>
                <input
                  type="text"
                  value={settingsForm.roleTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, roleTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">Hero Heading</label>
              <input
                type="text"
                value={settingsForm.heroHeading}
                onChange={(e) => setSettingsForm({ ...settingsForm, heroHeading: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">Hero Introduction</label>
              <textarea
                rows={2}
                value={settingsForm.heroIntro}
                onChange={(e) => setSettingsForm({ ...settingsForm, heroIntro: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">About Me Bio</label>
              <textarea
                rows={3}
                value={settingsForm.aboutIntro}
                onChange={(e) => setSettingsForm({ ...settingsForm, aboutIntro: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">Education</label>
                <textarea
                  rows={3}
                  value={settingsForm.education}
                  onChange={(e) => setSettingsForm({ ...settingsForm, education: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">Interests</label>
                <textarea
                  rows={3}
                  value={settingsForm.interests}
                  onChange={(e) => setSettingsForm({ ...settingsForm, interests: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">Learning Goals</label>
                <textarea
                  rows={3}
                  value={settingsForm.learningGoals}
                  onChange={(e) => setSettingsForm({ ...settingsForm, learningGoals: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">Contact Email</label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">Location / Availability</label>
                <input
                  type="text"
                  value={settingsForm.location}
                  onChange={(e) => setSettingsForm({ ...settingsForm, location: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">GitHub Profile URL</label>
                <input
                  type="url"
                  value={settingsForm.githubUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, githubUrl: e.target.value })}
                  placeholder="https://github.com/username"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-slate-300">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={settingsForm.linkedinUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 text-white text-sm font-semibold hover:opacity-95 cursor-pointer"
            >
              {savingSettings ? 'Saving...' : 'Save Profile & Contact Settings'}
            </button>
          </form>

          {/* Supabase Connection Guide Card */}
          <aside className="lg:col-span-4 rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-[#121623] p-6 space-y-4 h-fit">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-display text-lg font-bold text-stone-900 dark:text-white">
                Supabase Connection
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-stone-600 dark:text-slate-300">
              Active storage mode:{' '}
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                {isSupabaseConfigured() ? 'Supabase PostgreSQL + Storage' : 'Built-in Express Disk Storage'}
              </span>
            </p>
            <ol className="text-xs space-y-2.5 text-stone-600 dark:text-slate-400 list-decimal pl-4">
              <li>Create a project in Supabase and open the SQL Editor.</li>
              <li>
                Run <code className="font-mono text-stone-800 dark:text-slate-200">supabase/schema.sql</code> to create tables, Row Level Security policies, and public/private Storage buckets.
              </li>
              <li>Create your admin user inside Supabase Authentication -&gt; Users.</li>
              <li>
                Add <code className="font-mono text-stone-800 dark:text-slate-200">VITE_SUPABASE_URL</code> and{' '}
                <code className="font-mono text-stone-800 dark:text-slate-200">VITE_SUPABASE_ANON_KEY</code> to your environment variables.
              </li>
            </ol>
          </aside>
        </div>
      )}
    </div>
  );
}
