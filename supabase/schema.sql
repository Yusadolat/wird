create extension if not exists pgcrypto;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferred_reciter integer not null,
  reading_level text not null check (reading_level in ('beginner', 'intermediate', 'advanced')),
  notification_time text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  verse_key text not null,
  chapter_name text not null,
  title text not null,
  created_at timestamptz not null default now(),
  unique (user_id, verse_key)
);

create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_number integer not null,
  chapter_name text not null,
  start_verse integer not null,
  end_verse integer not null,
  verse_count integer not null,
  estimated_minutes integer not null,
  completed_at timestamptz not null default now()
);

create table if not exists public.reflection_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_number integer not null,
  chapter_name text not null,
  start_verse integer not null,
  end_verse integer not null,
  verse_range text not null,
  prompt text not null,
  note text not null,
  tafsir_source text not null,
  created_at timestamptz not null default now()
);

create index if not exists bookmarks_user_id_idx on public.bookmarks (user_id, created_at desc);
create index if not exists reading_sessions_user_id_idx on public.reading_sessions (user_id, completed_at desc);
create index if not exists reflection_notes_user_id_idx on public.reflection_notes (user_id, created_at desc);

alter table public.user_preferences enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.reflection_notes enable row level security;

drop policy if exists "preferences_select_own" on public.user_preferences;
create policy "preferences_select_own"
on public.user_preferences for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "preferences_insert_own" on public.user_preferences;
create policy "preferences_insert_own"
on public.user_preferences for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "preferences_update_own" on public.user_preferences;
create policy "preferences_update_own"
on public.user_preferences for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "bookmarks_select_own" on public.bookmarks;
create policy "bookmarks_select_own"
on public.bookmarks for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "bookmarks_insert_own" on public.bookmarks;
create policy "bookmarks_insert_own"
on public.bookmarks for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "bookmarks_update_own" on public.bookmarks;
create policy "bookmarks_update_own"
on public.bookmarks for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "bookmarks_delete_own" on public.bookmarks;
create policy "bookmarks_delete_own"
on public.bookmarks for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reading_sessions_select_own" on public.reading_sessions;
create policy "reading_sessions_select_own"
on public.reading_sessions for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reading_sessions_insert_own" on public.reading_sessions;
create policy "reading_sessions_insert_own"
on public.reading_sessions for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reflection_notes_select_own" on public.reflection_notes;
create policy "reflection_notes_select_own"
on public.reflection_notes for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "reflection_notes_insert_own" on public.reflection_notes;
create policy "reflection_notes_insert_own"
on public.reflection_notes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "reflection_notes_update_own" on public.reflection_notes;
create policy "reflection_notes_update_own"
on public.reflection_notes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
