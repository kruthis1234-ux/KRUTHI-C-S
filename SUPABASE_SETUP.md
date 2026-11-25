# ProjectVerse — Supabase & Deployment Setup Guide

ProjectVerse works immediately out of the box using its built-in Express persistence layer (`data/portfolio-db.json` and `uploads/`) and also supports **Supabase** for permanent cloud PostgreSQL storage, Authentication, and public/private file Storage.

## 1. Connect Supabase (Recommended for Cloud Hosting)

1. **Create a Supabase Project**
   - Sign in at [supabase.com](https://supabase.com) and create a new project.
2. **Create Database Tables, RLS Policies & Storage Buckets**
   - Open **SQL Editor** in your Supabase Dashboard.
   - Paste the entire contents of `supabase/schema.sql` and run it.
   - This creates:
     - Tables: `projects`, `project_files`, `categories`, `skills`, `portfolio_settings`
     - Row Level Security (RLS) so visitors can read only `published` projects and `public` files
     - Storage buckets: `projectverse-public` (public) and `projectverse-private` (private, signed URLs only)
3. **Create Your Admin User**
   - Go to **Authentication -> Users -> Add user** in Supabase.
   - Create your admin email & password.
   - Disable public signups under **Authentication -> Providers -> Email** so only your admin account can log in.
4. **Configure Environment Variables**
   - Copy your Project URL and Anon Key from **Project Settings -> API**.
   - Set:
     ```env
     VITE_SUPABASE_URL=https://your-project-ref.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Restart the app. ProjectVerse automatically switches to Supabase Auth, PostgreSQL, and Storage!

## 2. Built-in Server Mode (Default Out-of-the-Box)

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set, ProjectVerse runs on its Express full-stack backend:
- Set `ADMIN_PASSWORD` in your environment secrets, or visit `/admin` on first launch to claim your admin password securely.
- All projects, settings, categories, skills, and uploaded project folders (`Source-Code.zip`, `Screenshots/`, `Documentation/`, `other`) are stored on disk under `data/` and `uploads/`.
