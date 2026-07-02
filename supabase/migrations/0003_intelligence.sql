-- Life OS — V3 Intelligence Engine (additive).
-- The brain's storage: generated insights (persisted, actionable, dismissable)
-- and structured signals extracted from journal entries. RLS per user.

create extension if not exists "pgcrypto";

-- ════════ INSIGHTS ════════
-- Every insight the engine produces. `action` holds a DetectedItem-shaped
-- suggestion that must pass the Review Layer before any write.
create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,                      -- correlation | warning | opportunity | trend
  domain text not null,                    -- tasks|study|habits|health|journal|calendar|general
  title text not null,
  body text,
  evidence jsonb default '{}',             -- the numbers behind the claim
  confidence numeric default 0.6,          -- 0..1
  status text default 'new',               -- new | seen | acted | dismissed
  action jsonb,                            -- optional DetectedItem suggestion
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- ════════ JOURNAL SIGNALS ════════
-- Structured extraction per journal entry: mood/stress/energy scores (-2..2 /
-- 0..3), topics and people mentioned. Feeds long-term trends + memory.
create table if not exists journal_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid references journal_entries(id) on delete cascade,
  mood_score int default 0,                -- -2 .. 2
  stress int default 0,                    -- 0 .. 3
  energy int default 0,                    -- -2 .. 2
  topics text[] default '{}',
  people text[] default '{}',
  signals jsonb default '{}',
  created_at timestamptz default now(),
  unique (entry_id)
);

-- ════════ indexes ════════
create index if not exists idx_insights_user_status on insights(user_id, status, created_at desc);
create index if not exists idx_journal_signals_user on journal_signals(user_id, created_at desc);

-- ════════ RLS (own rows only; idempotent) ════════
do $$
declare t text;
begin
  foreach t in array array['insights','journal_signals'] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists %I_own on %I;', t, t);
    execute format('create policy %I_own on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());', t, t);
  end loop;
end $$;
