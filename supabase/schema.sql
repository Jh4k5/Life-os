-- Life OS — Postgres schema (Supabase)
-- Reflects the app architecture: Areas → Projects, habits, tasks, journal,
-- workspaces, plus the capture + memory foundation. Row Level Security so a
-- user only sees their own rows. Sharing columns exist now so the model is
-- not single-user-only (collaboration grows later).

create extension if not exists "pgcrypto";

-- ── core ─────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  locale text default 'ar',
  theme text default 'system',
  accent text,
  created_at timestamptz default now()
);

create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  icon text,
  accent text,                       -- per-Area personalization (allowed)
  archived boolean default false,
  position int default 0,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  status text default 'active',      -- active | completed | paused | archived
  progress int default 0,
  due date,
  created_at timestamptz default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  progress int default 0,
  due date
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid references areas(id) on delete set null,
  name text not null,
  icon text,
  type text not null,                -- checkbox|counter|timer|stopwatch|quantity
  target numeric default 1,
  unit text,
  freq text default 'daily',
  time_pref text default 'anytime',
  created_at timestamptz default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  day date not null,
  value numeric default 0,
  done boolean default false,
  unique (habit_id, day)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid references areas(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  priority text default 'medium',
  energy text default 'medium',
  due timestamptz,
  done boolean default false,
  parent_id uuid references tasks(id) on delete cascade,  -- subtasks
  created_at timestamptz default now()
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid references areas(id) on delete set null,
  title text,
  content text,
  mood text,
  tags text[],
  pinned boolean default false,
  created_at timestamptz default now()
);

-- ── AI Studio ────────────────────────────────────────
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,                -- academic|travel|startup|...
  title text not null,
  subtitle text,
  progress int default 0,
  blocks jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── capture + files ──────────────────────────────────
create table if not exists captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                -- voice|text|image|pdf|screenshot
  source_text text,
  storage_path text,                 -- bucket path for media
  parsed jsonb,                      -- DetectedItem[] awaiting review
  created_at timestamptz default now()
);

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  name text,
  mime text,
  storage_path text not null,
  created_at timestamptz default now()
);

-- ── memory foundation (graph) ────────────────────────
create table if not exists memory_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  label text not null,
  data jsonb,
  created_at timestamptz default now()
);

create table if not exists memory_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_node uuid not null references memory_nodes(id) on delete cascade,
  to_node uuid not null references memory_nodes(id) on delete cascade,
  relation text not null
);

-- ── collaboration (model ready; feature later) ───────
create table if not exists shares (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shared_with uuid references auth.users(id) on delete cascade,
  entity_type text not null,         -- project|task|workspace|appointment
  entity_id uuid not null,
  permission text default 'view',    -- view | edit
  created_at timestamptz default now()
);

-- ── RLS: each user sees only their own rows ──────────
-- Tables that carry user_id directly (drop-then-create = idempotent re-runs).
do $$
declare t text;
begin
  foreach t in array array[
    'areas','projects','habits','tasks','journal_entries',
    'workspaces','captures','files','memory_nodes','memory_edges'
  ]
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists %I_own on %I;', t, t);
    execute format(
      'create policy %I_own on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t, t
    );
  end loop;
end $$;

-- profiles are keyed on id (= auth.users.id), not user_id.
alter table profiles enable row level security;
drop policy if exists profiles_own on profiles;
create policy profiles_own on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

-- goals inherit ownership from their parent project.
alter table goals enable row level security;
drop policy if exists goals_own on goals;
create policy goals_own on goals for all
  using (exists (select 1 from projects p where p.id = goals.project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = goals.project_id and p.user_id = auth.uid()));

-- habit_logs inherit ownership from their parent habit.
alter table habit_logs enable row level security;
drop policy if exists habit_logs_own on habit_logs;
create policy habit_logs_own on habit_logs for all
  using (exists (select 1 from habits h where h.id = habit_logs.habit_id and h.user_id = auth.uid()))
  with check (exists (select 1 from habits h where h.id = habit_logs.habit_id and h.user_id = auth.uid()));

-- shares: visible to owner or the person it's shared with; only owner writes.
alter table shares enable row level security;
drop policy if exists shares_own on shares;
create policy shares_own on shares for all
  using (owner_id = auth.uid() or shared_with = auth.uid())
  with check (owner_id = auth.uid());

-- storage buckets
insert into storage.buckets (id, name, public)
values ('attachments','attachments', false), ('voice','voice', false)
on conflict (id) do nothing;
