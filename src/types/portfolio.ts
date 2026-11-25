export type AccentTheme = 'emerald' | 'purple' | 'sky' | 'coral' | 'pink';

export type ProjectStatus = 'published' | 'draft';

export type FolderSection = 'source_zip' | 'screenshots' | 'documentation' | 'other';

export type FileVisibility = 'public' | 'private';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  accentColor: AccentTheme;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  group: 'Languages' | 'Frontend' | 'Backend & Data' | 'Tools & DevOps';
  level: 'Core' | 'Proficient' | 'Exploring';
  sortOrder: number;
}

export interface PortfolioSettings {
  brandName: string;
  ownerName: string;
  roleTitle: string;
  heroHeading: string;
  heroIntro: string;
  aboutIntro: string;
  education: string;
  interests: string;
  learningGoals: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  location: string;
}

export interface WorkflowStep {
  title: string;
  detail: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  folderSection: FolderSection;
  originalName: string;
  storedPath: string;
  mimeType: string;
  sizeBytes: number;
  visibility: FileVisibility;
  caption: string;
  isThumbnail?: boolean;
  uploadedAt: string;
  publicUrl?: string;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  categoryName?: string;
  technologies: string[];
  features: string[];
  workflowSteps: WorkflowStep[];
  liveDemoUrl: string;
  githubUrl: string;
  thumbnailUrl: string;
  status: ProjectStatus;
  isFeatured: boolean;
  accentTheme: AccentTheme;
  timelineLabel: string;
  createdAt: string;
  updatedAt: string;
  files?: ProjectFile[];
}

export interface PortfolioSnapshot {
  settings: PortfolioSettings;
  categories: Category[];
  skills: Skill[];
  projects: Project[];
  stats: {
    totalProjects: number;
    publishedProjects: number;
    draftProjects: number;
    totalFiles: number;
    publicFiles: number;
    privateFiles: number;
  };
}

export interface AuthStatus {
  mode: 'supabase' | 'server';
  authenticated: boolean;
  claimed: boolean;
  envConfigured: boolean;
  email?: string;
}
