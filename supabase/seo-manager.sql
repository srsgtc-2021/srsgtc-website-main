-- ============================================================
-- SRS Geotech CMS — SEO Manager
--
-- Stores only page-level overrides. A NULL column means "use the
-- default in src/seo/seoConfig.js". Deleting a row restores all
-- code-defined defaults for that path.
--
-- Run this migration in the Supabase SQL editor after the existing
-- CMS tables and public.is_admin() helper are in place.
-- ============================================================

begin;

create table if not exists public.seo_pages (
  path text primary key,
  title text,
  description text,
  og_title text,
  og_description text,
  og_image_url text,
  og_image_width integer,
  og_image_height integer,
  og_image_type text,
  og_image_alt text,
  is_indexable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seo_pages_path_check check (path in ('/', '/about', '/services', '/projects', '/contact')),
  constraint seo_pages_image_width_check check (og_image_width is null or og_image_width > 0),
  constraint seo_pages_image_height_check check (og_image_height is null or og_image_height > 0)
);

comment on table public.seo_pages is
  'Optional per-page SEO overrides for the five public routes. NULL fields fall back to src/seo/seoConfig.js.';

create index if not exists seo_pages_updated_at_idx
  on public.seo_pages (updated_at desc);

-- Singleton marker. A DELETE on seo_pages cannot expose its own
-- updated_at, so this row is touched for every INSERT/UPDATE/DELETE.
create table if not exists public.seo_state (
  id smallint primary key default 1,
  updated_at timestamptz not null default now(),
  constraint seo_state_singleton_check check (id = 1)
);

comment on table public.seo_state is
  'Singleton timestamp used by /api/rebuild to detect SEO override changes, including deletes.';

insert into public.seo_state (id, updated_at)
values (1, now())
on conflict (id) do nothing;

alter table public.seo_pages enable row level security;
alter table public.seo_state enable row level security;

-- Public pages need to read overrides during prerender and in the browser.
drop policy if exists "seo_pages public read" on public.seo_pages;
create policy "seo_pages public read" on public.seo_pages
  for select to anon, authenticated using (true);

drop policy if exists "seo_pages admin insert" on public.seo_pages;
create policy "seo_pages admin insert" on public.seo_pages
  for insert to authenticated with check (public.is_admin());

drop policy if exists "seo_pages admin update" on public.seo_pages;
create policy "seo_pages admin update" on public.seo_pages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "seo_pages admin delete" on public.seo_pages;
create policy "seo_pages admin delete" on public.seo_pages
  for delete to authenticated using (public.is_admin());

-- The state row is publicly readable for freshness checks, but writes are
-- intentionally limited to the SECURITY DEFINER trigger below.
drop policy if exists "seo_state public read" on public.seo_state;
create policy "seo_state public read" on public.seo_state
  for select to anon, authenticated using (true);

revoke all on public.seo_state from public, anon, authenticated;
grant select on public.seo_state to anon, authenticated;

grant select on public.seo_pages to anon, authenticated;
grant insert, update, delete on public.seo_pages to authenticated;

-- Keep seo_pages.updated_at current for inserts and updates.
create or replace function public.set_seo_pages_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Touch the singleton for every row change, including DELETE.
-- SECURITY DEFINER lets the trigger write seo_state without granting
-- public UPDATE access. search_path is fixed and all names are qualified.
create or replace function public.touch_seo_state()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.seo_state (id, updated_at)
  values (1, clock_timestamp())
  on conflict (id) do update set updated_at = excluded.updated_at;

  return null;
end;
$$;

revoke all on function public.set_seo_pages_updated_at() from public, anon, authenticated;
revoke all on function public.touch_seo_state() from public, anon, authenticated;

drop trigger if exists seo_pages_set_updated_at on public.seo_pages;
create trigger seo_pages_set_updated_at
  before insert or update on public.seo_pages
  for each row execute function public.set_seo_pages_updated_at();

drop trigger if exists seo_pages_touch_state on public.seo_pages;
create trigger seo_pages_touch_state
  after insert or update or delete on public.seo_pages
  for each row execute function public.touch_seo_state();

commit;

-- After running this migration, configure a Supabase database webhook on
-- public.seo_pages for INSERT, UPDATE and DELETE events, calling:
--   POST https://<production-site>/api/rebuild
--   Authorization: Bearer <CRON_SECRET>
-- Test each event, including "Reset to defaults" (DELETE), and confirm the
-- endpoint returns {"deployed":true} once the build metadata is current.
