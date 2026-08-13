-- Additive cloud sync, media, import, and moderated-message contract.
alter table public.private_notes
  add column if not exists captured_at timestamptz not null default now(),
  add column if not exists raw_idea text,
  add column if not exists import_source text,
  add column if not exists import_source_id text;

create index if not exists private_notes_owner_capture_idx on public.private_notes(owner_id, captured_at desc);
create unique index if not exists private_notes_import_identity_idx
  on public.private_notes(owner_id, import_source, import_source_id)
  where import_source is not null and import_source_id is not null;

create table if not exists public.private_note_attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.private_notes(id) on delete cascade,
  media_kind text not null check (media_kind in ('image', 'audio')),
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  duration_ms integer,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create table if not exists public.public_post_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.public_posts(id) on delete cascade,
  source_attachment_id uuid references public.private_note_attachments(id) on delete set null,
  storage_path text not null unique,
  media_kind text not null check (media_kind in ('image', 'audio')),
  mime_type text not null,
  created_at timestamptz not null default now()
);

create type public.moderation_state as enum ('approved', 'rejected', 'review', 'removed');
create table if not exists public.public_messages (
  id uuid primary key default gen_random_uuid(),
  post_slug text not null,
  alias text not null default '匿名访客',
  body text not null check (char_length(body) between 1 and 2000),
  moderation_state public.moderation_state not null default 'review',
  moderation_categories text[] not null default '{}',
  moderation_confidence real,
  moderation_reason text,
  client_hash text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  owner_reply text,
  owner_replied_at timestamptz,
  owner_reply_updated_at timestamptz
);

create index if not exists public_messages_slug_time_idx on public.public_messages(post_slug, created_at);
create index if not exists public_messages_review_idx on public.public_messages(moderation_state, created_at);

alter table public.private_note_attachments enable row level security;
alter table public.public_post_assets enable row level security;
alter table public.public_messages enable row level security;

create policy "owners manage their private attachments" on public.private_note_attachments
for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "anyone reads public post assets" on public.public_post_assets
for select to anon, authenticated using (true);
create policy "owners manage public post assets" on public.public_post_assets
for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "anonymous reads approved messages" on public.public_messages
for select to anon, authenticated using (moderation_state = 'approved');
create policy "owner manages all messages" on public.public_messages
for all to authenticated using ((select auth.uid()) = reviewed_by)
with check ((select auth.uid()) = reviewed_by);

revoke all on public.private_note_attachments from anon;
grant select, insert, update, delete on public.private_note_attachments, public.public_post_assets, public.public_messages to authenticated;
grant select (id, post_slug, alias, body, created_at, owner_reply, owner_replied_at, owner_reply_updated_at)
  on public.public_messages to anon;
grant select (id, post_id, storage_path, media_kind, mime_type, created_at)
  on public.public_post_assets to anon;
