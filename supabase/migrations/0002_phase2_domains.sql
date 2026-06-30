-- Life OS — Phase 2 domains (forward-compatible, additive).
-- Study, Learning, Health/Nutrition/Exercise, Calendar (events), Analytics,
-- Digital Wellbeing. RLS per user; updated_at triggers; indexes on FKs.

create extension if not exists "pgcrypto";

-- shared updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

-- ════════ STUDY ════════
create table if not exists study_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid references areas(id) on delete set null,
  name text not null,
  teacher text,
  icon text,
  color text,
  status text default 'active',          -- active | completed | paused
  progress int default 0,
  gpa numeric,
  total_study_minutes int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references study_courses(id) on delete cascade,
  name text not null,
  exam_date date,
  chapters_count int default 0,
  syllabus text,
  ai_plan jsonb default '[]',
  readiness int,                          -- 0..100 estimate
  created_at timestamptz default now()
);

create table if not exists flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references study_courses(id) on delete cascade,
  front text not null,
  back text not null,
  ease numeric default 2.5,               -- SM-2 spaced repetition
  interval_days int default 0,
  due_date date default current_date,
  reps int default 0,
  created_at timestamptz default now()
);

create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references study_courses(id) on delete set null,
  topic text,
  minutes int default 0,
  rating int,                             -- 1..5
  notes text,
  started_at timestamptz default now()
);

-- ════════ LEARNING ════════
create table if not exists learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  goal text,
  progress int default 0,
  created_at timestamptz default now()
);

create table if not exists learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  path_id uuid references learning_paths(id) on delete set null,
  area_id uuid references areas(id) on delete set null,
  title text not null,
  author text,
  type text not null,                     -- book|podcast|article|video|course|link
  status text default 'want_to_read',
  progress int default 0,
  rating int default 0,
  notes text,
  url text,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid references learning_items(id) on delete cascade,
  quote text not null,
  note text,
  created_at timestamptz default now()
);

-- ════════ HEALTH / NUTRITION / EXERCISE ════════
create table if not exists health_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  weight_kg numeric, height_cm numeric, body_fat numeric, muscle_kg numeric,
  water_ml int, sleep_min int, steps int, resting_hr int,
  unique (user_id, day)
);

create table if not exists body_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  photo_path text,
  notes text
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  photo_path text,
  calories int, protein_g numeric, carbs_g numeric, fat_g numeric,
  ai_estimated boolean default false,     -- estimate from photo (non-prescriptive)
  eaten_at timestamptz default now()
);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  mode text default 'gym',                -- gym | home
  duration_min int,
  exercises jsonb default '[]',           -- [{name, sets, reps, weight}]
  prs jsonb default '[]',
  done_at timestamptz default now()
);

-- ════════ CALENDAR (events with recurrence) ════════
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid references areas(id) on delete set null,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean default false,
  rrule text,                             -- RFC 5545 recurrence
  source text default 'event',            -- event|task|study|exam|habit
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ════════ ANALYTICS + WELLBEING ════════
create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null,                   -- habits|tasks|study|focus|...
  name text not null,
  value numeric,
  meta jsonb,
  at timestamptz default now()
);

create table if not exists wellbeing_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  activity text,
  kind text,                              -- healthy | draining
  impact int,
  unique (user_id, day, activity)
);

create table if not exists app_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  app text,
  minutes int default 0
);

-- ════════ indexes ════════
create index if not exists idx_exams_course on exams(course_id);
create index if not exists idx_flashcards_due on flashcards(user_id, due_date);
create index if not exists idx_study_sessions_user on study_sessions(user_id, started_at);
create index if not exists idx_learning_items_user on learning_items(user_id, status);
create index if not exists idx_events_user_time on events(user_id, starts_at);
create index if not exists idx_health_user_day on health_metrics(user_id, day);
create index if not exists idx_meals_user on meals(user_id, eaten_at);
create index if not exists idx_analytics_user on analytics_events(user_id, domain, at);

-- ════════ updated_at triggers ════════
do $$
declare t text;
begin
  foreach t in array array['study_courses','learning_items','events'] loop
    execute format('drop trigger if exists trg_%I_updated on %I;', t, t);
    execute format('create trigger trg_%I_updated before update on %I for each row execute function set_updated_at();', t, t);
  end loop;
end $$;

-- ════════ RLS (own rows only) ════════
do $$
declare t text;
begin
  foreach t in array array[
    'study_courses','exams','flashcards','study_sessions',
    'learning_paths','learning_items','highlights',
    'health_metrics','body_logs','meals','workouts',
    'events','analytics_events','wellbeing_logs','app_usage'
  ] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists %I_own on %I;', t, t);
    execute format('create policy %I_own on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());', t, t);
  end loop;
end $$;
