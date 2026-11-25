import { INITIAL_CATEGORIES, INITIAL_PROJECTS, INITIAL_SETTINGS, INITIAL_SKILLS } from '../data/initialPortfolio';
import type {
  AccentTheme,
  AuthStatus,
  Category,
  FileVisibility,
  FolderSection,
  PortfolioSettings,
  PortfolioSnapshot,
  Project,
  ProjectFile,
  Skill,
} from '../types/portfolio';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

// Admin token held strictly in memory for built-in Express mode
let inMemoryToken: string | null = null;

function authHeaders(): HeadersInit {
  return inMemoryToken ? { Authorization: `Bearer ${inMemoryToken}` } : {};
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders(),
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.error === 'string' ? data.error : `Request failed (${res.status})`);
  }
  return data as T;
}

export async function getAuthStatus(): Promise<AuthStatus> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    const { data } = await sb.auth.getSession();
    return {
      mode: 'supabase',
      authenticated: Boolean(data.session),
      claimed: true,
      envConfigured: true,
      email: data.session?.user?.email,
    };
  }
  return apiJson<AuthStatus>('/api/auth/status');
}

export async function claimAdminPassword(password: string): Promise<void> {
  const res = await apiJson<{ token: string }>('/api/auth/claim', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  inMemoryToken = res.token;
}

export async function loginAdmin(params: { email?: string; password: string }): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    if (!params.email) throw new Error('Admin email is required for Supabase authentication.');
    const { error } = await sb.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });
    if (error) throw new Error(error.message);
    return;
  }

  const res = await apiJson<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password: params.password }),
  });
  inMemoryToken = res.token;
}

export async function logoutAdmin(): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    await sb.auth.signOut();
    return;
  }
  await apiJson('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
  inMemoryToken = null;
}

export async function fetchPortfolioSnapshot(): Promise<PortfolioSnapshot> {
  if (!isSupabaseConfigured()) {
    return apiJson<PortfolioSnapshot>('/api/portfolio');
  }

  const sb = getSupabaseClient()!;
  const [{ data: sessionData }, settingsRes, catRes, skillRes, projRes, filesRes] = await Promise.all([
    sb.auth.getSession(),
    sb.from('portfolio_settings').select('*').eq('id', 'default').maybeSingle(),
    sb.from('categories').select('*').order('created_at', { ascending: true }),
    sb.from('skills').select('*').order('sort_order', { ascending: true }),
    sb.from('projects').select('*').order('created_at', { ascending: false }),
    sb.from('project_files').select('*').order('uploaded_at', { ascending: false }),
  ]);

  const isAdmin = Boolean(sessionData.session);
  const settings: PortfolioSettings = settingsRes.data
    ? {
        brandName: settingsRes.data.brand_name,
        ownerName: settingsRes.data.owner_name,
        roleTitle: settingsRes.data.role_title,
        heroHeading: settingsRes.data.hero_heading,
        heroIntro: settingsRes.data.hero_intro,
        aboutIntro: settingsRes.data.about_intro,
        education: settingsRes.data.education,
        interests: settingsRes.data.interests,
        learningGoals: settingsRes.data.learning_goals,
        email: settingsRes.data.email,
        githubUrl: settingsRes.data.github_url,
        linkedinUrl: settingsRes.data.linkedin_url,
        location: settingsRes.data.location,
      }
    : INITIAL_SETTINGS;

  const categories: Category[] = (catRes.data || []).length
    ? catRes.data!.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        accentColor: c.accent_color as AccentTheme,
        createdAt: c.created_at,
      }))
    : INITIAL_CATEGORIES;

  const skills: Skill[] = (skillRes.data || []).length
    ? skillRes.data!.map((s) => ({
        id: s.id,
        name: s.name,
        group: s.skill_group,
        level: s.level,
        sortOrder: s.sort_order,
      }))
    : INITIAL_SKILLS;

  const files: ProjectFile[] = (filesRes.data || []).map((f) => {
    const publicUrl =
      f.visibility === 'public'
        ? sb.storage.from('projectverse-public').getPublicUrl(f.stored_path).data.publicUrl
        : undefined;
    return {
      id: f.id,
      projectId: f.project_id,
      folderSection: f.folder_section,
      originalName: f.original_name,
      storedPath: f.stored_path,
      mimeType: f.mime_type,
      sizeBytes: f.size_bytes,
      visibility: f.visibility,
      caption: f.caption,
      isThumbnail: f.is_thumbnail,
      uploadedAt: f.uploaded_at,
      publicUrl,
    };
  });

  const rawProjects = (projRes.data || []).length ? projRes.data! : [];
  const projects: Project[] = rawProjects.map((p) => {
    const cat = categories.find((c) => c.id === p.category_id);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDescription: p.short_description,
      fullDescription: p.full_description,
      categoryId: p.category_id || '',
      categoryName: cat?.name || 'Uncategorized',
      technologies: p.technologies || [],
      features: p.features || [],
      workflowSteps: p.workflow_steps || [],
      liveDemoUrl: p.live_demo_url || '',
      githubUrl: p.github_url || '',
      thumbnailUrl: p.thumbnail_url || '',
      status: p.status,
      isFeatured: p.is_featured,
      accentTheme: p.accent_theme,
      timelineLabel: p.timeline_label,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      files: files.filter((f) => f.projectId === p.id),
    };
  });

  const effectiveProjects = projects.length ? projects : INITIAL_PROJECTS.map((p) => ({
    ...p,
    categoryName: categories.find((c) => c.id === p.categoryId)?.name || 'Uncategorized',
    files: [],
  }));

  return {
    settings,
    categories,
    skills,
    projects: effectiveProjects,
    stats: {
      totalProjects: effectiveProjects.length,
      publishedProjects: effectiveProjects.filter((p) => p.status === 'published').length,
      draftProjects: isAdmin ? effectiveProjects.filter((p) => p.status === 'draft').length : 0,
      totalFiles: files.length,
      publicFiles: files.filter((f) => f.visibility === 'public').length,
      privateFiles: isAdmin ? files.filter((f) => f.visibility === 'private').length : 0,
    },
  };
}

export async function fetchProjectBySlug(slug: string): Promise<Project> {
  if (!isSupabaseConfigured()) {
    return apiJson<Project>(`/api/projects/${encodeURIComponent(slug)}`);
  }
  const snapshot = await fetchPortfolioSnapshot();
  const found = snapshot.projects.find((p) => p.slug === slug);
  if (!found) throw new Error('Project not found.');
  return found;
}

export async function saveSettings(settings: PortfolioSettings): Promise<PortfolioSettings> {
  if (!isSupabaseConfigured()) {
    return apiJson<PortfolioSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
  const sb = getSupabaseClient()!;
  const { error } = await sb.from('portfolio_settings').upsert({
    id: 'default',
    brand_name: settings.brandName,
    owner_name: settings.ownerName,
    role_title: settings.roleTitle,
    hero_heading: settings.heroHeading,
    hero_intro: settings.heroIntro,
    about_intro: settings.aboutIntro,
    education: settings.education,
    interests: settings.interests,
    learning_goals: settings.learningGoals,
    email: settings.email,
    github_url: settings.githubUrl,
    linkedin_url: settings.linkedinUrl,
    location: settings.location,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  return settings;
}

export async function createCategory(input: {
  name: string;
  description: string;
  accentColor: AccentTheme;
}): Promise<Category> {
  if (!isSupabaseConfigured()) {
    return apiJson<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
  const sb = getSupabaseClient()!;
  const slug = input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const { data, error } = await sb
    .from('categories')
    .insert({
      name: input.name,
      slug,
      description: input.description,
      accent_color: input.accentColor,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    accentColor: data.accent_color,
    createdAt: data.created_at,
  };
}

export async function deleteCategory(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    await apiJson(`/api/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return;
  }
  const sb = getSupabaseClient()!;
  const { error } = await sb.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function createSkill(input: {
  name: string;
  group: Skill['group'];
  level: Skill['level'];
}): Promise<Skill> {
  if (!isSupabaseConfigured()) {
    return apiJson<Skill>('/api/skills', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
  const sb = getSupabaseClient()!;
  const { data, error } = await sb
    .from('skills')
    .insert({
      name: input.name,
      skill_group: input.group,
      level: input.level,
      sort_order: Date.now() % 10000,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    name: data.name,
    group: data.skill_group,
    level: data.level,
    sortOrder: data.sort_order,
  };
}

export async function deleteSkill(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    await apiJson(`/api/skills/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return;
  }
  const sb = getSupabaseClient()!;
  const { error } = await sb.from('skills').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export type ProjectUpsertInput = Omit<
  Project,
  'id' | 'slug' | 'createdAt' | 'updatedAt' | 'categoryName' | 'files'
> & { slug?: string };

export async function createProject(input: ProjectUpsertInput): Promise<Project> {
  if (!isSupabaseConfigured()) {
    return apiJson<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }
  const sb = getSupabaseClient()!;
  const slug =
    (input.slug || input.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `project-${Date.now()}`;

  const { data, error } = await sb
    .from('projects')
    .insert({
      slug,
      name: input.name,
      short_description: input.shortDescription,
      full_description: input.fullDescription,
      category_id: input.categoryId || null,
      technologies: input.technologies,
      features: input.features,
      workflow_steps: input.workflowSteps,
      live_demo_url: input.liveDemoUrl,
      github_url: input.githubUrl,
      thumbnail_url: input.thumbnailUrl,
      status: input.status,
      is_featured: input.isFeatured,
      accent_theme: input.accentTheme,
      timeline_label: input.timelineLabel,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    shortDescription: data.short_description,
    fullDescription: data.full_description,
    categoryId: data.category_id || '',
    technologies: data.technologies || [],
    features: data.features || [],
    workflowSteps: data.workflow_steps || [],
    liveDemoUrl: data.live_demo_url || '',
    githubUrl: data.github_url || '',
    thumbnailUrl: data.thumbnail_url || '',
    status: data.status,
    isFeatured: data.is_featured,
    accentTheme: data.accent_theme,
    timelineLabel: data.timeline_label,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    files: [],
  };
}

export async function updateProject(id: string, input: Partial<ProjectUpsertInput>): Promise<Project> {
  if (!isSupabaseConfigured()) {
    return apiJson<Project>(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }
  const sb = getSupabaseClient()!;
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name;
  if (input.shortDescription !== undefined) payload.short_description = input.shortDescription;
  if (input.fullDescription !== undefined) payload.full_description = input.fullDescription;
  if (input.categoryId !== undefined) payload.category_id = input.categoryId || null;
  if (input.technologies !== undefined) payload.technologies = input.technologies;
  if (input.features !== undefined) payload.features = input.features;
  if (input.workflowSteps !== undefined) payload.workflow_steps = input.workflowSteps;
  if (input.liveDemoUrl !== undefined) payload.live_demo_url = input.liveDemoUrl;
  if (input.githubUrl !== undefined) payload.github_url = input.githubUrl;
  if (input.thumbnailUrl !== undefined) payload.thumbnail_url = input.thumbnailUrl;
  if (input.status !== undefined) payload.status = input.status;
  if (input.isFeatured !== undefined) payload.is_featured = input.isFeatured;
  if (input.accentTheme !== undefined) payload.accent_theme = input.accentTheme;
  if (input.timelineLabel !== undefined) payload.timeline_label = input.timelineLabel;

  const { data, error } = await sb.from('projects').update(payload).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    shortDescription: data.short_description,
    fullDescription: data.full_description,
    categoryId: data.category_id || '',
    technologies: data.technologies || [],
    features: data.features || [],
    workflowSteps: data.workflow_steps || [],
    liveDemoUrl: data.live_demo_url || '',
    githubUrl: data.github_url || '',
    thumbnailUrl: data.thumbnail_url || '',
    status: data.status,
    isFeatured: data.is_featured,
    accentTheme: data.accent_theme,
    timelineLabel: data.timeline_label,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteProject(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    await apiJson(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return;
  }
  const sb = getSupabaseClient()!;
  const { error } = await sb.from('projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadProjectFiles(params: {
  projectId: string;
  projectSlug: string;
  folderSection: FolderSection;
  visibility: FileVisibility;
  caption?: string;
  isThumbnail?: boolean;
  files: File[];
}): Promise<Project> {
  if (!isSupabaseConfigured()) {
    const form = new FormData();
    form.append('folderSection', params.folderSection);
    form.append('visibility', params.visibility);
    if (params.caption) form.append('caption', params.caption);
    if (params.isThumbnail) form.append('isThumbnail', 'true');
    for (const file of params.files) {
      form.append('files', file);
    }
    const res = await apiJson<{ project: Project }>(
      `/api/projects/${encodeURIComponent(params.projectId)}/files`,
      {
        method: 'POST',
        body: form,
      }
    );
    return res.project;
  }

  const sb = getSupabaseClient()!;
  const bucket = params.visibility === 'public' || params.isThumbnail ? 'projectverse-public' : 'projectverse-private';

  for (const file of params.files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `projects/${params.projectSlug}/${params.folderSection}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await sb.storage.from(bucket).upload(storagePath, file, { upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data: inserted, error: dbError } = await sb
      .from('project_files')
      .insert({
        project_id: params.projectId,
        folder_section: params.folderSection,
        original_name: file.name,
        stored_path: storagePath,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
        visibility: params.isThumbnail ? 'public' : params.visibility,
        caption: params.caption || '',
        is_thumbnail: Boolean(params.isThumbnail && file.type.startsWith('image/')),
      })
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);

    if (params.isThumbnail && file.type.startsWith('image/') && inserted) {
      const { data: urlData } = sb.storage.from('projectverse-public').getPublicUrl(storagePath);
      await sb.from('projects').update({ thumbnail_url: urlData.publicUrl }).eq('id', params.projectId);
    }
  }

  return fetchProjectBySlug(params.projectSlug);
}

export async function updateProjectFile(
  fileId: string,
  updates: { visibility?: FileVisibility; caption?: string; isThumbnail?: boolean }
): Promise<void> {
  if (!isSupabaseConfigured()) {
    await apiJson(`/api/files/${encodeURIComponent(fileId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return;
  }
  const sb = getSupabaseClient()!;
  const payload: Record<string, unknown> = {};
  if (updates.visibility) payload.visibility = updates.visibility;
  if (updates.caption !== undefined) payload.caption = updates.caption;
  if (updates.isThumbnail !== undefined) payload.is_thumbnail = updates.isThumbnail;
  const { error } = await sb.from('project_files').update(payload).eq('id', fileId);
  if (error) throw new Error(error.message);
}

export async function deleteProjectFile(file: ProjectFile): Promise<void> {
  if (!isSupabaseConfigured()) {
    await apiJson(`/api/files/${encodeURIComponent(file.id)}`, { method: 'DELETE' });
    return;
  }
  const sb = getSupabaseClient()!;
  const bucket = file.visibility === 'public' ? 'projectverse-public' : 'projectverse-private';
  await sb.storage.from(bucket).remove([file.storedPath]);
  const { error } = await sb.from('project_files').delete().eq('id', file.id);
  if (error) throw new Error(error.message);
}

export async function fetchFileBlobUrl(file: ProjectFile, mode: 'preview' | 'download'): Promise<string> {
  if (isSupabaseConfigured()) {
    const sb = getSupabaseClient()!;
    if (file.visibility === 'public') {
      const { data } = sb.storage.from('projectverse-public').getPublicUrl(file.storedPath);
      return data.publicUrl;
    }
    const { data, error } = await sb.storage.from('projectverse-private').createSignedUrl(file.storedPath, 120);
    if (error) throw new Error(error.message);
    return data.signedUrl;
  }

  const endpoint = `/api/files/${encodeURIComponent(file.id)}/${mode}`;
  if (file.visibility === 'public' && mode === 'preview') {
    return endpoint;
  }
  const res = await fetch(endpoint, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error('You do not have permission to access this file.');
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
