-- Run this in the Supabase SQL editor once, after creating the project.
-- Safe to re-run: uses `if not exists` / `add column if not exists` throughout.

create table if not exists rounds (
  id uuid primary key,
  status text not null check (status in ('in_progress', 'completed')),
  course_name text not null,
  format smallint not null check (format in (9, 18)),
  started_at timestamptz not null,
  ended_at timestamptz,
  rating smallint check (rating between 1 and 5),
  player1_name text not null,
  player1_score int,
  player1_diff text,
  player1_points int,
  weather jsonb,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table rounds add column if not exists player1_diff text;
alter table rounds add column if not exists player1_points int;
alter table rounds add column if not exists weather jsonb;

create table if not exists courses (
  id uuid primary key,
  name text not null,
  format smallint not null check (format in (9, 18)),
  holes jsonb not null,
  map_image text,
  updated_at timestamptz not null default now()
);

alter table courses add column if not exists map_image text;

-- Single-row table holding the app owner's default name/handicap, used to
-- prefill Player 1 when starting a round.
create table if not exists app_settings (
  id text primary key,
  default_name text,
  default_handicap numeric,
  updated_at timestamptz not null default now()
);

-- Nothing in this app ever queries Supabase's own REST API directly (the
-- Vercel functions under /api use the service-role key, which bypasses RLS
-- entirely). This policy is a backstop: even if the anon/public key ever
-- leaked or got used by mistake, no row is readable or writable through it.
alter table rounds enable row level security;
alter table courses enable row level security;
alter table app_settings enable row level security;
