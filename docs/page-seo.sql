begin;

create table if not exists public.page_seo (
  key text primary key,
  path text not null,
  label text not null default '',
  meta_title text not null default '',
  meta_description text not null default '',
  schema_blocks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.page_seo add column if not exists path text;
alter table public.page_seo add column if not exists label text not null default '';
alter table public.page_seo add column if not exists meta_title text not null default '';
alter table public.page_seo add column if not exists meta_description text not null default '';
alter table public.page_seo add column if not exists schema_blocks jsonb not null default '[]'::jsonb;
alter table public.page_seo add column if not exists updated_at timestamptz not null default now();
alter table public.page_seo add column if not exists updated_by uuid references auth.users (id) on delete set null;

update public.page_seo set path = key where path is null;
alter table public.page_seo alter column path set not null;

alter table public.page_seo drop constraint if exists page_seo_meta_title_length;
alter table public.page_seo add constraint page_seo_meta_title_length check (char_length(meta_title) <= 70);

alter table public.page_seo drop constraint if exists page_seo_meta_description_length;
alter table public.page_seo add constraint page_seo_meta_description_length check (char_length(meta_description) <= 160);

alter table public.page_seo drop constraint if exists page_seo_schema_blocks_is_array;
alter table public.page_seo add constraint page_seo_schema_blocks_is_array check (jsonb_typeof(schema_blocks) = 'array');

alter table public.page_seo drop constraint if exists page_seo_path_starts_with_slash;
alter table public.page_seo add constraint page_seo_path_starts_with_slash check (left(path, 1) = '/');

create index if not exists page_seo_path_idx on public.page_seo (path);

alter table public.page_seo enable row level security;

revoke all on table public.page_seo from anon, authenticated;
grant all on table public.page_seo to service_role;

commit;
