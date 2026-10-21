-- NEXT STEP institution catalog.
-- The full record (validated by `institutionSchema` in src/lib/domain/types.ts) lives in `data`.
-- A few fields are duplicated into columns for filtering and row-level security.

create table if not exists public.institutions (
  id text primary key,
  slug text not null unique,
  published boolean not null default false,
  verification_status text not null check (verification_status in ('verified', 'partial', 'unverified')),
  last_verified date not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.institutions enable row level security;

-- Anonymous visitors can read only records that are published and at least partially verified.
drop policy if exists "public read" on public.institutions;
create policy "public read" on public.institutions
  for select
  using (published = true and verification_status <> 'unverified');

-- Writes go through the server with the service-role key, which bypasses RLS.
-- No insert/update/delete policies are granted to anon or authenticated roles.

create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists institutions_touch on public.institutions;
create trigger institutions_touch before update on public.institutions
  for each row execute function public.touch_updated_at();
