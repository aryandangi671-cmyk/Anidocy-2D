-- ANIDOC 2D — Supabase PostgreSQL Schema & Row-Level Security (RLS) Policies
-- Run inside the Supabase SQL Editor when deploying against Supabase PostgreSQL + Supabase Auth.

create extension if not exists "pgcrypto";

-- 1. User Profiles & Roles (single initial Owner + optional Editor invitations)
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  role text not null check (role in ('owner', 'editor')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create or replace function public.is_owner()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('owner', 'editor')
  );
$$;

create policy "Staff can view their own role; Owner sees all"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_owner());

-- One-time Owner bootstrap lock: allowed ONLY when zero owners exist
create policy "One-time initial owner creation"
  on public.user_roles for insert
  with check (
    role = 'owner'
    and auth.uid() = user_id
    and not exists (select 1 from public.user_roles where role = 'owner')
  );

create policy "Owner can invite limited editors"
  on public.user_roles for insert
  with check (
    public.is_owner() and role = 'editor'
  );

-- 2. Categories
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name_en text not null,
  name_hi text not null,
  description_en text not null default '',
  description_hi text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Public read categories"
  on public.categories for select using (true);

create policy "Staff write categories"
  on public.categories for all using (public.is_staff()) with check (public.is_staff());

-- 3. Videos (Published public; Drafts private to staff)
create table if not exists public.videos (
  id bigint generated always as identity primary key,
  slug text not null unique,
  youtube_url text not null default '',
  youtube_id text not null default '',
  format text not null default 'long' check (format in ('long', 'short')),
  title_en text not null default '',
  title_hi text not null default '',
  description_en text not null default '',
  description_hi text not null default '',
  category_id bigint references public.categories(id) on delete set null,
  custom_thumbnail_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  is_demo boolean not null default false,
  display_order integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.videos enable row level security;

create policy "Public read only published videos"
  on public.videos for select
  using (status = 'published' or public.is_staff());

create policy "Staff insert/update/delete videos"
  on public.videos for all
  using (public.is_staff())
  with check (public.is_staff());

-- 4. Homepage Sections
create table if not exists public.homepage_sections (
  section_key text primary key,
  title_en text not null,
  title_hi text not null,
  subtitle_en text not null default '',
  subtitle_hi text not null default '',
  cta_label_en text not null default '',
  cta_label_hi text not null default '',
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.homepage_sections enable row level security;

create policy "Public read homepage sections"
  on public.homepage_sections for select using (true);

create policy "Staff update homepage sections"
  on public.homepage_sections for all using (public.is_staff()) with check (public.is_staff());

-- 5. Site Settings
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Public read site settings"
  on public.site_settings for select using (true);

create policy "Owner write site settings"
  on public.site_settings for all using (public.is_owner()) with check (public.is_owner());

-- 6. Contact Messages (Public insert; Staff read; Owner delete)
create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  language text not null default 'en',
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Anyone can submit contact messages"
  on public.contact_messages for insert with check (true);

create policy "Staff read/update contact messages"
  on public.contact_messages for select using (public.is_staff());

create policy "Staff update contact messages"
  on public.contact_messages for update using (public.is_staff()) with check (public.is_staff());

create policy "Owner delete contact messages"
  on public.contact_messages for delete using (public.is_owner());

-- 7. Audit Logs (Owner-only read, server/staff insert)
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null default '',
  result text not null default 'success',
  details text not null default '',
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "Owner reads audit logs"
  on public.audit_logs for select using (public.is_owner());

create policy "Staff inserts audit logs"
  on public.audit_logs for insert with check (public.is_staff());

-- 8. Backup Metadata (Owner-only)
create table if not exists public.backup_metadata (
  id bigint generated always as identity primary key,
  created_by text not null,
  record_counts jsonb not null,
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.backup_metadata enable row level security;

create policy "Owner manages backup metadata"
  on public.backup_metadata for all using (public.is_owner()) with check (public.is_owner());
