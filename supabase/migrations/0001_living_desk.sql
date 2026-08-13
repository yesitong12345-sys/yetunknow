-- Living Desk production data contract for Supabase Postgres.
-- Apply only to a reviewed Supabase project. Local preview does not execute this file.

create extension if not exists pgcrypto;

create type public.content_kind as enum ('ideas', 'daily', 'projects');

create table public.private_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind public.content_kind not null,
  title text not null default '',
  body_markdown text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.public_posts (
  id uuid primary key default gen_random_uuid(),
  source_note_id uuid not null references public.private_notes(id) on delete restrict,
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind public.content_kind not null,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null,
  desk_object_key text not null check (desk_object_key in ('note', 'journal', 'toolbox')),
  published_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_note_id uuid references public.private_notes(id) on delete set null,
  slug text not null unique,
  title text not null,
  role text not null default '',
  process jsonb not null default '[]'::jsonb,
  result text not null default '',
  screenshot_paths jsonb not null default '[]'::jsonb,
  project_url text,
  published_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger private_notes_updated_at before update on public.private_notes
for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects
for each row execute function public.set_updated_at();

alter table public.private_notes enable row level security;
alter table public.public_posts enable row level security;
alter table public.projects enable row level security;

create policy "owners select their private notes" on public.private_notes
for select to authenticated using ((select auth.uid()) = owner_id);
create policy "owners insert their private notes" on public.private_notes
for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "owners update their private notes" on public.private_notes
for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "owners delete their private notes" on public.private_notes
for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "anonymous reads active public snapshots" on public.public_posts
for select to anon, authenticated using (withdrawn_at is null);
create policy "owners read all their public snapshots" on public.public_posts
for select to authenticated using ((select auth.uid()) = owner_id);
create policy "owners insert public snapshots" on public.public_posts
for insert to authenticated with check ((select auth.uid()) = owner_id and exists (
  select 1 from public.private_notes n where n.id = source_note_id and n.owner_id = (select auth.uid())
));
create policy "owners update public snapshots" on public.public_posts
for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "owners delete public snapshots" on public.public_posts
for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "anonymous reads active projects" on public.projects
for select to anon, authenticated using (published_at is not null and withdrawn_at is null);
create policy "owners manage projects" on public.projects
for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create view public.active_public_posts
with (security_invoker = true)
as select id, kind, slug, title, excerpt, body, desk_object_key, published_at
from public.public_posts
where withdrawn_at is null;

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true), ('private-assets', 'private-assets', false)
on conflict (id) do update set public = excluded.public;

create policy "anyone reads public assets" on storage.objects
for select to anon, authenticated using (bucket_id = 'public-assets');
create policy "owner uploads public assets" on storage.objects
for insert to authenticated with check (bucket_id = 'public-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owner updates public assets" on storage.objects
for update to authenticated using (bucket_id = 'public-assets' and owner_id = (select auth.uid()::text));
create policy "owner deletes public assets" on storage.objects
for delete to authenticated using (bucket_id = 'public-assets' and owner_id = (select auth.uid()::text));

create policy "owner reads private assets" on storage.objects
for select to authenticated using (bucket_id = 'private-assets' and owner_id = (select auth.uid()::text));
create policy "owner uploads private assets" on storage.objects
for insert to authenticated with check (bucket_id = 'private-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "owner updates private assets" on storage.objects
for update to authenticated using (bucket_id = 'private-assets' and owner_id = (select auth.uid()::text));
create policy "owner deletes private assets" on storage.objects
for delete to authenticated using (bucket_id = 'private-assets' and owner_id = (select auth.uid()::text));

revoke all on public.private_notes from anon;
revoke all on public.public_posts from anon;
grant select (id, kind, slug, title, excerpt, body, desk_object_key, published_at, withdrawn_at) on public.public_posts to anon;
grant select on public.active_public_posts, public.projects to anon;
grant select, insert, update, delete on public.private_notes, public.public_posts, public.projects to authenticated;
