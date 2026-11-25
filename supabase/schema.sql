-- ProjectVerse Supabase PostgreSQL Schema, RLS Policies & Storage Setup
-- Run this script inside your Supabase Dashboard -> SQL Editor.

create extension if not exists "pgcrypto";

-- 1. Categories Table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  accent_color text not null default 'emerald',
  created_at timestamptz not null default now()
);

-- 2. Skills Table
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  skill_group text not null default 'Languages',
  level text not null default 'Core',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 3. Portfolio Settings Table (single-row configuration)
create table if not exists public.portfolio_settings (
  id text primary key default 'default',
  brand_name text not null default 'ProjectVerse',
  owner_name text not null default 'Kruthi',
  role_title text not null default 'Computer Science Student & Full-Stack Developer',
  hero_heading text not null default 'Ideas Into Interactive Experiences.',
  hero_intro text not null default '',
  about_intro text not null default '',
  education text not null default '',
  interests text not null default '',
  learning_goals text not null default '',
  email text not null default '',
  github_url text not null default '',
  linkedin_url text not null default '',
  location text not null default '',
  updated_at timestamptz not null default now()
);

-- 4. Projects Table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null,
  full_description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  technologies text[] not null default '{}',
  features text[] not null default '{}',
  workflow_steps jsonb not null default '[]'::jsonb,
  live_demo_url text not null default '',
  github_url text not null default '',
  thumbnail_url text not null default '',
  status text not null default 'draft' check (status in ('published', 'draft')),
  is_featured boolean not null default false,
  accent_theme text not null default 'emerald',
  timeline_label text not null default '2026',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Project Files Table (Individual Digital Project Folders)
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  folder_section text not null check (folder_section in ('source_zip', 'screenshots', 'documentation', 'other')),
  original_name text not null,
  stored_path text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  caption text not null default '',
  is_thumbnail boolean not null default false,
  uploaded_at timestamptz not null default now()
);

-- Enable Row Level Security on all tables
alter table public.categories enable row level security;
alter table public.skills enable row level security;
alter table public.portfolio_settings enable row level security;
alter table public.projects enable row level security;
alter table public.project_files enable row level security;

-- Public Read Policies
create policy "Public read categories"
  on public.categories for select
  using (true);

create policy "Public read skills"
  on public.skills for select
  using (true);

create policy "Public read portfolio settings"
  on public.portfolio_settings for select
  using (true);

create policy "Public read published projects only"
  on public.projects for select
  using (status = 'published' or auth.role() = 'authenticated');

create policy "Public read public files of published projects only"
  on public.project_files for select
  using (
    auth.role() = 'authenticated'
    or (
      visibility = 'public'
      and exists (
        select 1 from public.projects p
        where p.id = project_files.project_id
          and p.status = 'published'
      )
    )
  );

-- Authenticated Admin Write Policies (lock to your single admin user account in Supabase Auth)
create policy "Authenticated admin manages categories"
  on public.categories for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated admin manages skills"
  on public.skills for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated admin manages portfolio settings"
  on public.portfolio_settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated admin manages projects"
  on public.projects for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated admin manages project files"
  on public.project_files for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage Buckets
insert into storage.buckets (id, name, public)
values ('projectverse-public', 'projectverse-public', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('projectverse-private', 'projectverse-private', false)
on conflict (id) do nothing;

-- Storage RLS Policies
create policy "Public read public bucket"
  on storage.objects for select
  using (bucket_id = 'projectverse-public');

create policy "Authenticated admin manages public bucket"
  on storage.objects for all
  using (bucket_id = 'projectverse-public' and auth.role() = 'authenticated')
  with check (bucket_id = 'projectverse-public' and auth.role() = 'authenticated');

create policy "Authenticated admin manages private bucket"
  on storage.objects for all
  using (bucket_id = 'projectverse-private' and auth.role() = 'authenticated')
  with check (bucket_id = 'projectverse-private' and auth.role() = 'authenticated');

-- Initial Seed Categories
insert into public.categories (name, slug, description, accent_color) values
  ('Developer Tools', 'developer-tools', 'Compilers, analyzers, release engineering, and code intelligence utilities.', 'purple'),
  ('Productivity & Utilities', 'productivity-utilities', 'Precision calculators, solvers, and everyday computational tools.', 'emerald'),
  ('Workflow & Automation', 'workflow-automation', 'Visual node builders, diagramming engines, and process pipelines.', 'sky'),
  ('Web Applications', 'web-applications', 'Full-stack consumer and operational web software.', 'coral'),
  ('Data & Analytics', 'data-analytics', 'Interactive reporting suites and impact measurement dashboards.', 'pink')
on conflict (slug) do nothing;
