import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_CATEGORIES,
  INITIAL_PROJECTS,
  INITIAL_SETTINGS,
  INITIAL_SKILLS,
} from './src/data/initialPortfolio';
import type {
  AccentTheme,
  Category,
  FileVisibility,
  FolderSection,
  PortfolioSettings,
  Project,
  ProjectFile,
  Skill,
} from './src/types/portfolio';

dotenv.config();

interface DbSchema {
  settings: PortfolioSettings;
  categories: Category[];
  skills: Skill[];
  projects: Project[];
  files: ProjectFile[];
}

interface AdminAuthStore {
  passwordHash: string;
  claimedAt: string;
}

interface AuthedRequest extends Request {
  isAdmin?: boolean;
}

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const DB_FILE = path.join(DATA_DIR, 'portfolio-db.json');
const AUTH_FILE = path.join(DATA_DIR, 'admin-auth.json');

// Session signing secret in memory fallback if SESSION_SECRET is unset
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function readDb(): DbSchema {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    const initial: DbSchema = {
      settings: INITIAL_SETTINGS,
      categories: INITIAL_CATEGORIES,
      skills: INITIAL_SKILLS,
      projects: INITIAL_PROJECTS,
      files: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(raw) as DbSchema;
}

function writeDb(db: DbSchema) {
  ensureDirs();
  const tmpFile = `${DB_FILE}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmpFile, DB_FILE);
}

function readAuthStore(): AdminAuthStore | null {
  ensureDirs();
  if (!fs.existsSync(AUTH_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')) as AdminAuthStore;
  } catch {
    return null;
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function constantTimeCompareString(a: string, b: string): boolean {
  const digestA = crypto.createHash('sha256').update(a).digest();
  const digestB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

function signAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', exp: Date.now() + TOKEN_TTL_MS }),
    'utf8'
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return parsed.role === 'admin' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function optionalAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    req.isAdmin = verifyAdminToken(token);
  } else {
    req.isAdmin = false;
  }
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.isAdmin) {
    res.status(401).json({ error: 'Administrator authentication required.' });
    return;
  }
  next();
}

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
}

function sanitizeSafeUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base || `file_${Date.now()}`;
}

function folderSubdir(section: FolderSection): string {
  switch (section) {
    case 'source_zip':
      return 'Source-Code';
    case 'screenshots':
      return 'Screenshots';
    case 'documentation':
      return 'Documentation';
    default:
      return 'Other';
  }
}

function resolveSafeUploadPath(relativePath: string): string | null {
  const resolved = path.resolve(UPLOADS_DIR, relativePath);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

const VALID_ACCENTS: AccentTheme[] = ['emerald', 'purple', 'sky', 'coral', 'pink'];
const VALID_SECTIONS: FolderSection[] = ['source_zip', 'screenshots', 'documentation', 'other'];

function enrichProject(
  project: Project,
  categories: Category[],
  allFiles: ProjectFile[],
  includePrivate: boolean
): Project {
  const cat = categories.find((c) => c.id === project.categoryId);
  const projectFiles = allFiles
    .filter((f) => f.projectId === project.id && (includePrivate || f.visibility === 'public'))
    .map((f) => ({
      ...f,
      publicUrl: f.visibility === 'public' ? `/api/files/${f.id}/preview` : undefined,
    }));

  return {
    ...project,
    categoryName: cat?.name || 'Uncategorized',
    files: projectFiles,
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max per file
    files: 20,
  },
});

async function startServer() {
  ensureDirs();
  readDb();

  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '4mb' }));
  app.use(optionalAdmin);

  // Auth routes
  app.get('/api/auth/status', (req: AuthedRequest, res: Response) => {
    const authStore = readAuthStore();
    const envConfigured = Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0);
    res.json({
      mode: 'server',
      authenticated: Boolean(req.isAdmin),
      claimed: Boolean(authStore?.passwordHash),
      envConfigured,
    });
  });

  app.post('/api/auth/claim', (req: Request, res: Response) => {
    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    if (envPassword) {
      res.status(403).json({ error: 'Admin password is already configured via environment secrets.' });
      return;
    }
    const existing = readAuthStore();
    if (existing?.passwordHash) {
      res.status(403).json({ error: 'Admin account has already been claimed. Please sign in.' });
      return;
    }
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }
    const store: AdminAuthStore = {
      passwordHash: hashPassword(password),
      claimedAt: new Date().toISOString(),
    };
    fs.writeFileSync(AUTH_FILE, JSON.stringify(store, null, 2), { encoding: 'utf8', flag: 'wx' });
    const token = signAdminToken();
    res.status(201).json({ token, authenticated: true });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!password) {
      res.status(400).json({ error: 'Password is required.' });
      return;
    }
    const envPassword = process.env.ADMIN_PASSWORD?.trim();
    if (envPassword) {
      if (!constantTimeCompareString(password, envPassword)) {
        res.status(401).json({ error: 'Invalid administrator password.' });
        return;
      }
      res.json({ token: signAdminToken(), authenticated: true });
      return;
    }

    const store = readAuthStore();
    if (!store?.passwordHash) {
      res.status(400).json({ error: 'Admin password has not been claimed yet.' });
      return;
    }
    if (!verifyPassword(password, store.passwordHash)) {
      res.status(401).json({ error: 'Invalid administrator password.' });
      return;
    }
    res.json({ token: signAdminToken(), authenticated: true });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Portfolio snapshot
  app.get('/api/portfolio', (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const isAdmin = Boolean(req.isAdmin);
    const visibleProjects = db.projects
      .filter((p) => isAdmin || p.status === 'published')
      .map((p) => enrichProject(p, db.categories, db.files, isAdmin));

    const visibleFiles = isAdmin
      ? db.files
      : db.files.filter((f) => {
          if (f.visibility !== 'public') return false;
          const proj = db.projects.find((p) => p.id === f.projectId);
          return proj?.status === 'published';
        });

    res.json({
      settings: db.settings,
      categories: db.categories,
      skills: [...db.skills].sort((a, b) => a.sortOrder - b.sortOrder),
      projects: visibleProjects,
      stats: {
        totalProjects: isAdmin ? db.projects.length : visibleProjects.length,
        publishedProjects: db.projects.filter((p) => p.status === 'published').length,
        draftProjects: isAdmin ? db.projects.filter((p) => p.status === 'draft').length : 0,
        totalFiles: visibleFiles.length,
        publicFiles: db.files.filter((f) => f.visibility === 'public').length,
        privateFiles: isAdmin ? db.files.filter((f) => f.visibility === 'private').length : 0,
      },
    });
  });

  // Single project by slug
  app.get('/api/projects/:slug', (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const isAdmin = Boolean(req.isAdmin);
    const project = db.projects.find((p) => p.slug === req.params.slug);
    if (!project || (!isAdmin && project.status !== 'published')) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }
    res.json(enrichProject(project, db.categories, db.files, isAdmin));
  });

  // Settings update (admin)
  app.put('/api/settings', requireAdmin, (req: AuthedRequest, res: Response) => {
    const db = readDb();
    const body = req.body || {};
    const str = (key: keyof PortfolioSettings, fallback: string) =>
      typeof body[key] === 'string' ? body[key].trim() : fallback;

    db.settings = {
      brandName: str('brandName', db.settings.brandName) || 'ProjectVerse',
      ownerName: str('ownerName', db.settings.ownerName),
      roleTitle: str('roleTitle', db.settings.roleTitle),
      heroHeading: str('heroHeading', db.settings.heroHeading),
      heroIntro: str('heroIntro', db.settings.heroIntro),
      aboutIntro: str('aboutIntro', db.settings.aboutIntro),
      education: str('education', db.settings.education),
      interests: str('interests', db.settings.interests),
      learningGoals: str('learningGoals', db.settings.learningGoals),
      email: str('email', db.settings.email),
      githubUrl: body.githubUrl !== undefined ? sanitizeSafeUrl(body.githubUrl) : db.settings.githubUrl,
      linkedinUrl: body.linkedinUrl !== undefined ? sanitizeSafeUrl(body.linkedinUrl) : db.settings.linkedinUrl,
      location: str('location', db.settings.location),
    };

    writeDb(db);
    res.json(db.settings);
  });

  // Categories CRUD (admin)
  app.post('/api/categories', requireAdmin, (req: Request, res: Response) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const accentColor = VALID_ACCENTS.includes(req.body?.accentColor) ? req.body.accentColor : 'emerald';

    if (!name) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }

    const db = readDb();
    const slug = sanitizeSlug(name);
    if (db.categories.some((c) => c.slug === slug)) {
      res.status(409).json({ error: 'A category with that name already exists.' });
      return;
    }

    const created: Category = {
      id: `cat-${crypto.randomUUID().slice(0, 8)}`,
      name,
      slug,
      description,
      accentColor,
      createdAt: new Date().toISOString(),
    };
    db.categories.push(created);
    writeDb(db);
    res.status(201).json(created);
  });

  app.delete('/api/categories/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const idx = db.categories.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    db.categories.splice(idx, 1);
    db.projects = db.projects.map((p) => (p.categoryId === req.params.id ? { ...p, categoryId: '' } : p));
    writeDb(db);
    res.json({ ok: true });
  });

  // Skills CRUD (admin)
  app.post('/api/skills', requireAdmin, (req: Request, res: Response) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const group = req.body?.group || 'Languages';
    const level = req.body?.level || 'Core';
    if (!name) {
      res.status(400).json({ error: 'Skill name is required.' });
      return;
    }
    const db = readDb();
    const created: Skill = {
      id: `sk-${crypto.randomUUID().slice(0, 8)}`,
      name,
      group,
      level,
      sortOrder: db.skills.length + 1,
    };
    db.skills.push(created);
    writeDb(db);
    res.status(201).json(created);
  });

  app.delete('/api/skills/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    db.skills = db.skills.filter((s) => s.id !== req.params.id);
    writeDb(db);
    res.json({ ok: true });
  });

  // Projects CRUD (admin)
  app.post('/api/projects', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const shortDescription = typeof body.shortDescription === 'string' ? body.shortDescription.trim() : '';
    if (!name || !shortDescription) {
      res.status(400).json({ error: 'Project name and short description are required.' });
      return;
    }

    const db = readDb();
    let slug = sanitizeSlug(body.slug || name);
    if (db.projects.some((p) => p.slug === slug)) {
      slug = `${slug}-${crypto.randomUUID().slice(0, 4)}`;
    }

    const now = new Date().toISOString();
    const created: Project = {
      id: `proj-${crypto.randomUUID().slice(0, 8)}`,
      slug,
      name,
      shortDescription,
      fullDescription:
        typeof body.fullDescription === 'string' && body.fullDescription.trim()
          ? body.fullDescription.trim()
          : shortDescription,
      categoryId: typeof body.categoryId === 'string' ? body.categoryId : db.categories[0]?.id || '',
      technologies: Array.isArray(body.technologies)
        ? body.technologies.map((t: unknown) => String(t).trim()).filter(Boolean)
        : [],
      features: Array.isArray(body.features)
        ? body.features.map((f: unknown) => String(f).trim()).filter(Boolean)
        : [],
      workflowSteps: Array.isArray(body.workflowSteps)
        ? body.workflowSteps
            .filter((s: unknown) => s && typeof s === 'object')
            .map((s: { title?: unknown; detail?: unknown }) => ({
              title: String(s.title || '').trim(),
              detail: String(s.detail || '').trim(),
            }))
            .filter((s: { title: string; detail: string }) => s.title)
        : [],
      liveDemoUrl: sanitizeSafeUrl(body.liveDemoUrl),
      githubUrl: sanitizeSafeUrl(body.githubUrl),
      thumbnailUrl: sanitizeSafeUrl(body.thumbnailUrl),
      status: body.status === 'published' ? 'published' : 'draft',
      isFeatured: Boolean(body.isFeatured),
      accentTheme: VALID_ACCENTS.includes(body.accentTheme) ? body.accentTheme : 'emerald',
      timelineLabel:
        typeof body.timelineLabel === 'string' && body.timelineLabel.trim()
          ? body.timelineLabel.trim()
          : String(new Date().getFullYear()),
      createdAt: now,
      updatedAt: now,
    };

    db.projects.unshift(created);
    writeDb(db);
    res.status(201).json(enrichProject(created, db.categories, db.files, true));
  });

  app.put('/api/projects/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const idx = db.projects.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const existing = db.projects[idx];
    const body = req.body || {};

    const updated: Project = {
      ...existing,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : existing.name,
      shortDescription:
        typeof body.shortDescription === 'string' && body.shortDescription.trim()
          ? body.shortDescription.trim()
          : existing.shortDescription,
      fullDescription:
        typeof body.fullDescription === 'string' ? body.fullDescription.trim() : existing.fullDescription,
      categoryId: typeof body.categoryId === 'string' ? body.categoryId : existing.categoryId,
      technologies: Array.isArray(body.technologies)
        ? body.technologies.map((t: unknown) => String(t).trim()).filter(Boolean)
        : existing.technologies,
      features: Array.isArray(body.features)
        ? body.features.map((f: unknown) => String(f).trim()).filter(Boolean)
        : existing.features,
      workflowSteps: Array.isArray(body.workflowSteps)
        ? body.workflowSteps
            .filter((s: unknown) => s && typeof s === 'object')
            .map((s: { title?: unknown; detail?: unknown }) => ({
              title: String(s.title || '').trim(),
              detail: String(s.detail || '').trim(),
            }))
            .filter((s: { title: string; detail: string }) => s.title)
        : existing.workflowSteps,
      liveDemoUrl:
        body.liveDemoUrl !== undefined ? sanitizeSafeUrl(body.liveDemoUrl) : existing.liveDemoUrl,
      githubUrl: body.githubUrl !== undefined ? sanitizeSafeUrl(body.githubUrl) : existing.githubUrl,
      thumbnailUrl:
        body.thumbnailUrl !== undefined
          ? body.thumbnailUrl.startsWith('/api/files/')
            ? body.thumbnailUrl
            : sanitizeSafeUrl(body.thumbnailUrl)
          : existing.thumbnailUrl,
      status: body.status === 'published' || body.status === 'draft' ? body.status : existing.status,
      isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing.isFeatured,
      accentTheme: VALID_ACCENTS.includes(body.accentTheme) ? body.accentTheme : existing.accentTheme,
      timelineLabel:
        typeof body.timelineLabel === 'string' && body.timelineLabel.trim()
          ? body.timelineLabel.trim()
          : existing.timelineLabel,
      updatedAt: new Date().toISOString(),
    };

    db.projects[idx] = updated;
    writeDb(db);
    res.json(enrichProject(updated, db.categories, db.files, true));
  });

  app.delete('/api/projects/:id', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const project = db.projects.find((p) => p.id === req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const filesToDelete = db.files.filter((f) => f.projectId === project.id);
    for (const file of filesToDelete) {
      const safePath = resolveSafeUploadPath(file.storedPath);
      if (safePath && fs.existsSync(safePath)) {
        fs.unlinkSync(safePath);
      }
    }

    db.files = db.files.filter((f) => f.projectId !== project.id);
    db.projects = db.projects.filter((p) => p.id !== project.id);
    writeDb(db);
    res.json({ ok: true });
  });

  // Project folder file upload (admin)
  app.post(
    '/api/projects/:id/files',
    requireAdmin,
    upload.array('files', 20),
    (req: Request, res: Response) => {
      const db = readDb();
      const projectIdx = db.projects.findIndex((p) => p.id === req.params.id);
      if (projectIdx === -1) {
        res.status(404).json({ error: 'Project not found.' });
        return;
      }

      const project = db.projects[projectIdx];
      const uploadedFiles = req.files as Express.Multer.File[] | undefined;
      if (!uploadedFiles || uploadedFiles.length === 0) {
        res.status(400).json({ error: 'No files were uploaded.' });
        return;
      }

      const sectionInput = req.body?.folderSection as FolderSection;
      const folderSection: FolderSection = VALID_SECTIONS.includes(sectionInput) ? sectionInput : 'other';
      const isThumbnail = req.body?.isThumbnail === 'true' || req.body?.isThumbnail === true;
      const visibility: FileVisibility =
        isThumbnail || req.body?.visibility === 'public' ? 'public' : 'private';
      const caption = typeof req.body?.caption === 'string' ? req.body.caption.trim() : '';

      const createdFiles: ProjectFile[] = [];
      const subdir = folderSubdir(folderSection);
      const safeProjSlug = sanitizeSlug(project.slug);

      for (const file of uploadedFiles) {
        const safeOriginal = sanitizeFilename(file.originalname);
        const uniqueName = `${Date.now()}_${crypto.randomUUID().slice(0, 6)}_${safeOriginal}`;
        const relPath = path.join('projects', safeProjSlug, subdir, uniqueName);
        const absPath = resolveSafeUploadPath(relPath);

        if (!absPath) {
          res.status(400).json({ error: 'Invalid upload path.' });
          return;
        }

        fs.mkdirSync(path.dirname(absPath), { recursive: true });
        fs.writeFileSync(absPath, file.buffer);

        const fileRecord: ProjectFile = {
          id: `file-${crypto.randomUUID().slice(0, 10)}`,
          projectId: project.id,
          folderSection,
          originalName: file.originalname,
          storedPath: relPath,
          mimeType: file.mimetype || 'application/octet-stream',
          sizeBytes: file.size,
          visibility,
          caption,
          isThumbnail: isThumbnail && file.mimetype.startsWith('image/'),
          uploadedAt: new Date().toISOString(),
        };

        if (fileRecord.isThumbnail) {
          // Clear previous thumbnail flag
          db.files = db.files.map((f) =>
            f.projectId === project.id ? { ...f, isThumbnail: false } : f
          );
          db.projects[projectIdx].thumbnailUrl = `/api/files/${fileRecord.id}/preview`;
          db.projects[projectIdx].updatedAt = new Date().toISOString();
        }

        db.files.push(fileRecord);
        createdFiles.push({
          ...fileRecord,
          publicUrl: fileRecord.visibility === 'public' ? `/api/files/${fileRecord.id}/preview` : undefined,
        });
      }

      writeDb(db);
      res.status(201).json({
        files: createdFiles,
        project: enrichProject(db.projects[projectIdx], db.categories, db.files, true),
      });
    }
  );

  // Update file metadata / visibility / caption / set as thumbnail (admin)
  app.patch('/api/files/:fileId', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const idx = db.files.findIndex((f) => f.id === req.params.fileId);
    if (idx === -1) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    const existing = db.files[idx];
    const body = req.body || {};
    const nextVisibility: FileVisibility =
      body.visibility === 'public' || body.visibility === 'private'
        ? body.visibility
        : existing.visibility;

    const updated: ProjectFile = {
      ...existing,
      visibility: nextVisibility,
      caption: typeof body.caption === 'string' ? body.caption.trim() : existing.caption,
      folderSection: VALID_SECTIONS.includes(body.folderSection)
        ? body.folderSection
        : existing.folderSection,
    };

    if (body.isThumbnail === true && existing.mimeType.startsWith('image/')) {
      updated.isThumbnail = true;
      updated.visibility = 'public';
      db.files = db.files.map((f) =>
        f.projectId === existing.projectId && f.id !== existing.id ? { ...f, isThumbnail: false } : f
      );
      const projIdx = db.projects.findIndex((p) => p.id === existing.projectId);
      if (projIdx !== -1) {
        db.projects[projIdx].thumbnailUrl = `/api/files/${existing.id}/preview`;
        db.projects[projIdx].updatedAt = new Date().toISOString();
      }
    }

    db.files[idx] = updated;
    writeDb(db);
    res.json(updated);
  });

  // Delete file (admin)
  app.delete('/api/files/:fileId', requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const file = db.files.find((f) => f.id === req.params.fileId);
    if (!file) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    const absPath = resolveSafeUploadPath(file.storedPath);
    if (absPath && fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }

    db.files = db.files.filter((f) => f.id !== file.id);
    if (file.isThumbnail) {
      const projIdx = db.projects.findIndex((p) => p.id === file.projectId);
      if (projIdx !== -1) {
        db.projects[projIdx].thumbnailUrl = '';
      }
    }

    writeDb(db);
    res.json({ ok: true });
  });

  // Serve file preview or download with strict public/private + published/draft enforcement
  function serveProjectFile(disposition: 'inline' | 'attachment') {
    return (req: AuthedRequest, res: Response) => {
      const db = readDb();
      const file = db.files.find((f) => f.id === req.params.fileId);
      if (!file) {
        res.status(404).json({ error: 'File not found.' });
        return;
      }

      const project = db.projects.find((p) => p.id === file.projectId);
      if (!project) {
        res.status(404).json({ error: 'Associated project not found.' });
        return;
      }

      const isPubliclyAccessible = project.status === 'published' && file.visibility === 'public';
      if (!isPubliclyAccessible && !req.isAdmin) {
        res.status(403).json({ error: 'This file is private to the portfolio administrator.' });
        return;
      }

      const absPath = resolveSafeUploadPath(file.storedPath);
      if (!absPath || !fs.existsSync(absPath)) {
        res.status(404).json({ error: 'File binary missing from storage.' });
        return;
      }

      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${sanitizeFilename(file.originalName)}"`
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.sendFile(absPath);
    };
  }

  app.get('/api/files/:fileId/preview', serveProjectFile('inline'));
  app.get('/api/files/:fileId/download', serveProjectFile('attachment'));

  // Vite dev middleware or production static assets
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ProjectVerse server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ProjectVerse server:', err);
  process.exit(1);
});
