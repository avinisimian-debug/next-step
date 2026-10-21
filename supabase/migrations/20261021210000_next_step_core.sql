-- NEXT STEP core schema.
-- Lives in its own schema (`next_step`) so it can share a Supabase project with another app
-- without touching that app's tables. Every table has RLS; grants are explicit and minimal.
-- Writes that need elevated rights (counters, notifications, profiles) go through
-- SECURITY DEFINER functions with an empty search_path.

create schema if not exists next_step;
revoke all on schema next_step from public;
grant usage on schema next_step to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Profiles and roles
-- ---------------------------------------------------------------------------

create table next_step.institutions (
  id text primary key,
  slug text not null unique,
  pathway text not null check (pathway in ('idf', 'mechina', 'hesder', 'yeshiva')),
  published boolean not null default false,
  verification_status text not null check (verification_status in ('verified', 'partial', 'unverified')),
  last_verified date not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table next_step.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 40),
  role text not null default 'member' check (role in ('member', 'representative', 'moderator', 'admin')),
  -- Set only by an admin after verifying that the person speaks for the institution.
  represented_institution_id text references next_step.institutions (id) on delete set null,
  created_at timestamptz not null default now(),
  check (role <> 'representative' or represented_institution_id is not null)
);

create or replace function next_step.current_role()
returns text language sql stable security definer set search_path = '' as $$
  select role from next_step.profiles where id = auth.uid()
$$;

create or replace function next_step.is_moderator()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(next_step.current_role() in ('moderator', 'admin'), false)
$$;

create or replace function next_step.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(next_step.current_role() = 'admin', false)
$$;

-- True when the current user may post an "official" answer about the given institution.
create or replace function next_step.speaks_for(institution text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from next_step.profiles p
    where p.id = auth.uid()
      and (p.role = 'admin' or (p.role = 'representative' and p.represented_institution_id = institution))
  )
$$;

-- Creates the caller's profile on first sign-in. The client never chooses the id or role.
create or replace function next_step.ensure_profile(name text)
returns next_step.profiles language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  result next_step.profiles;
begin
  if me is null then
    raise exception 'NS_AUTH_REQUIRED' using errcode = '28000';
  end if;
  insert into next_step.profiles (id, display_name)
  values (me, left(btrim(coalesce(nullif(btrim(name), ''), 'משתמש/ת')), 40))
  on conflict (id) do nothing;
  select * into result from next_step.profiles where id = me;
  return result;
end;
$$;

alter table next_step.profiles enable row level security;
grant select on next_step.profiles to anon, authenticated;
grant update (display_name) on next_step.profiles to authenticated;
create policy "profiles are public" on next_step.profiles for select using (true);
create policy "update own profile" on next_step.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Institutions (same record shape as the seed catalog; validated in the app)
-- ---------------------------------------------------------------------------

alter table next_step.institutions enable row level security;
grant select on next_step.institutions to anon, authenticated;
grant insert, update on next_step.institutions to authenticated;
create policy "public reads published, non-unverified" on next_step.institutions for select
  using ((published and verification_status <> 'unverified') or (select next_step.is_admin()));
create policy "admins insert" on next_step.institutions for insert to authenticated
  with check ((select next_step.is_admin()));
create policy "admins update" on next_step.institutions for update to authenticated
  using ((select next_step.is_admin())) with check ((select next_step.is_admin()));

-- ---------------------------------------------------------------------------
-- Personal area: saved institutions and pathway map
-- ---------------------------------------------------------------------------

create table next_step.saved_institutions (
  user_id uuid not null default auth.uid() references next_step.profiles (id) on delete cascade,
  institution_id text not null references next_step.institutions (id) on delete cascade,
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  primary key (user_id, institution_id)
);
alter table next_step.saved_institutions enable row level security;
grant select, delete on next_step.saved_institutions to authenticated;
grant insert (institution_id, note), update (note) on next_step.saved_institutions to authenticated;
create policy "own saved" on next_step.saved_institutions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table next_step.pathway_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references next_step.profiles (id) on delete cascade,
  institution_id text references next_step.institutions (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  detail text check (char_length(detail) <= 1000),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pathway_steps_user_idx on next_step.pathway_steps (user_id, position);
alter table next_step.pathway_steps enable row level security;
grant select, delete on next_step.pathway_steps to authenticated;
grant insert (institution_id, title, detail, status, due_date, position),
      update (institution_id, title, detail, status, due_date, position) on next_step.pathway_steps to authenticated;
create policy "own steps" on next_step.pathway_steps for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Community: questions, answers, helpful marks, reports, notifications
-- ---------------------------------------------------------------------------

create table next_step.questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references next_step.profiles (id) on delete cascade,
  institution_id text references next_step.institutions (id) on delete set null,
  pathway text check (pathway in ('idf', 'mechina', 'hesder', 'yeshiva')),
  title text not null check (char_length(btrim(title)) between 8 and 160),
  body text not null check (char_length(btrim(body)) between 10 and 4000),
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  -- Development-only content; the UI labels it and production queries can exclude it.
  is_test boolean not null default false,
  answer_count integer not null default 0,
  search tsvector generated always as (to_tsvector('simple', title || ' ' || body)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index questions_search_idx on next_step.questions using gin (search);
create index questions_institution_idx on next_step.questions (institution_id, created_at desc);
create index questions_recent_idx on next_step.questions (created_at desc);
create index questions_author_idx on next_step.questions (author_id, created_at desc);

create table next_step.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references next_step.questions (id) on delete cascade,
  author_id uuid not null default auth.uid() references next_step.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 2 and 4000),
  -- 'experience' = personal experience; 'official' = from a verified representative of the institution.
  kind text not null default 'experience' check (kind in ('experience', 'official')),
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  helpful_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index answers_question_idx on next_step.answers (question_id, created_at);
create index answers_author_idx on next_step.answers (author_id, created_at desc);

create table next_step.answer_votes (
  answer_id uuid not null references next_step.answers (id) on delete cascade,
  user_id uuid not null default auth.uid() references next_step.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id)
);

create table next_step.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references next_step.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('question', 'answer')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'abuse', 'misinformation', 'privacy', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references next_step.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index reports_open_idx on next_step.reports (status, created_at);

create table next_step.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references next_step.profiles (id) on delete cascade,
  kind text not null check (kind in ('new_answer')),
  question_id uuid references next_step.questions (id) on delete cascade,
  answer_id uuid references next_step.answers (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on next_step.notifications (user_id, created_at desc);

create table next_step.moderation_log (
  id bigint generated always as identity primary key,
  actor_id uuid references next_step.profiles (id) on delete set null,
  target_type text not null,
  target_id uuid not null,
  action text not null,
  created_at timestamptz not null default now()
);

-- Rate limits (per user, rolling hour). Raised as NS_RATE_LIMIT so the app can show a clear message.
create or replace function next_step.enforce_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  recent integer;
  max_per_hour integer := tg_argv[0]::integer;
  author uuid;
begin
  if tg_table_name = 'questions' then
    author := new.author_id;
    select count(*) into recent from next_step.questions where author_id = author and created_at > now() - interval '1 hour';
  elsif tg_table_name = 'answers' then
    author := new.author_id;
    select count(*) into recent from next_step.answers where author_id = author and created_at > now() - interval '1 hour';
  else
    author := new.reporter_id;
    select count(*) into recent from next_step.reports where reporter_id = author and created_at > now() - interval '1 hour';
  end if;
  if recent >= max_per_hour then
    raise exception 'NS_RATE_LIMIT' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger questions_rate_limit before insert on next_step.questions
  for each row execute function next_step.enforce_rate_limit('5');
create trigger answers_rate_limit before insert on next_step.answers
  for each row execute function next_step.enforce_rate_limit('20');
create trigger reports_rate_limit before insert on next_step.reports
  for each row execute function next_step.enforce_rate_limit('20');

-- Authors may edit their text; only moderators may change status. Logged.
create or replace function next_step.guard_post_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if not next_step.is_moderator() then
      raise exception 'NS_FORBIDDEN' using errcode = '42501';
    end if;
    insert into next_step.moderation_log (actor_id, target_type, target_id, action)
    values (auth.uid(), left(tg_table_name, -1), new.id, 'status:' || new.status);
  end if;
  if tg_table_name = 'questions' then
    if (new.title, new.body) is distinct from (old.title, old.body) and old.author_id <> auth.uid() then
      raise exception 'NS_FORBIDDEN' using errcode = '42501';
    end if;
  elsif new.body is distinct from old.body and old.author_id <> auth.uid() then
    raise exception 'NS_FORBIDDEN' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger questions_guard before update on next_step.questions
  for each row execute function next_step.guard_post_update();
create trigger answers_guard before update on next_step.answers
  for each row execute function next_step.guard_post_update();

-- Keeps answer_count in sync and notifies the question's author.
create or replace function next_step.after_answer_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  q next_step.questions;
begin
  update next_step.questions qq
  set answer_count = (select count(*) from next_step.answers a where a.question_id = qq.id and a.status = 'published')
  where qq.id = coalesce(new.question_id, old.question_id);

  if tg_op = 'INSERT' then
    select * into q from next_step.questions where id = new.question_id;
    if q.author_id <> new.author_id then
      insert into next_step.notifications (user_id, kind, question_id, answer_id)
      values (q.author_id, 'new_answer', q.id, new.id);
    end if;
  end if;
  return null;
end;
$$;

create trigger answers_after_change after insert or delete or update of status on next_step.answers
  for each row execute function next_step.after_answer_change();

create or replace function next_step.after_vote_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update next_step.answers a
  set helpful_count = (select count(*) from next_step.answer_votes v where v.answer_id = a.id)
  where a.id = coalesce(new.answer_id, old.answer_id);
  return null;
end;
$$;

create trigger answer_votes_after_change after insert or delete on next_step.answer_votes
  for each row execute function next_step.after_vote_change();

create or replace function next_step.on_report_resolve()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    new.resolved_by := auth.uid();
    new.resolved_at := case when new.status = 'open' then null else now() end;
    insert into next_step.moderation_log (actor_id, target_type, target_id, action)
    values (auth.uid(), 'report', new.id, 'report:' || new.status);
  end if;
  return new;
end;
$$;

create trigger reports_resolve before update on next_step.reports
  for each row execute function next_step.on_report_resolve();

-- Questions
alter table next_step.questions enable row level security;
grant select on next_step.questions to anon, authenticated;
grant insert (institution_id, pathway, title, body) on next_step.questions to authenticated;
grant update (title, body, status) on next_step.questions to authenticated;
create policy "read published, own or as moderator" on next_step.questions for select
  using (status = 'published' or author_id = (select auth.uid()) or (select next_step.is_moderator()));
create policy "ask as yourself" on next_step.questions for insert to authenticated
  with check (author_id = (select auth.uid()) and status = 'published' and not is_test);
create policy "edit own or moderate" on next_step.questions for update to authenticated
  using (author_id = (select auth.uid()) or (select next_step.is_moderator()));

-- Answers
alter table next_step.answers enable row level security;
grant select on next_step.answers to anon, authenticated;
grant insert (question_id, body, kind) on next_step.answers to authenticated;
grant update (body, status) on next_step.answers to authenticated;
create policy "read visible answers, own or as moderator" on next_step.answers for select
  using (
    (status = 'published' and exists (select 1 from next_step.questions q where q.id = question_id and q.status = 'published'))
    or author_id = (select auth.uid())
    or (select next_step.is_moderator())
  );
create policy "answer as yourself on a published question" on next_step.answers for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'published'
    and exists (
      select 1 from next_step.questions q
      where q.id = question_id and q.status = 'published'
        and (kind = 'experience' or next_step.speaks_for(q.institution_id))
    )
  );
create policy "edit own or moderate" on next_step.answers for update to authenticated
  using (author_id = (select auth.uid()) or (select next_step.is_moderator()));

-- Helpful marks
alter table next_step.answer_votes enable row level security;
grant select, delete on next_step.answer_votes to authenticated;
grant insert (answer_id) on next_step.answer_votes to authenticated;
create policy "see own marks" on next_step.answer_votes for select to authenticated using (user_id = (select auth.uid()));
create policy "mark others' visible answers" on next_step.answer_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from next_step.answers a where a.id = answer_id and a.status = 'published' and a.author_id <> (select auth.uid()))
  );
create policy "unmark own" on next_step.answer_votes for delete to authenticated using (user_id = (select auth.uid()));

-- Reports
alter table next_step.reports enable row level security;
grant select on next_step.reports to authenticated;
grant insert (target_type, target_id, reason, details) on next_step.reports to authenticated;
grant update (status) on next_step.reports to authenticated;
create policy "own reports or as moderator" on next_step.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select next_step.is_moderator()));
create policy "report as yourself" on next_step.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open');
create policy "moderators resolve" on next_step.reports for update to authenticated
  using ((select next_step.is_moderator())) with check ((select next_step.is_moderator()));

-- Notifications
alter table next_step.notifications enable row level security;
grant select on next_step.notifications to authenticated;
grant update (read_at) on next_step.notifications to authenticated;
create policy "own notifications" on next_step.notifications for select to authenticated using (user_id = (select auth.uid()));
create policy "mark own read" on next_step.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Moderation log
alter table next_step.moderation_log enable row level security;
grant select on next_step.moderation_log to authenticated;
create policy "moderators read log" on next_step.moderation_log for select to authenticated using ((select next_step.is_moderator()));

-- Duplicate-question suggestions and search. SECURITY INVOKER, so RLS applies.
create or replace function next_step.search_questions(q text, max_results integer default 5)
returns setof next_step.questions language sql stable set search_path = '' as $$
  select * from next_step.questions
  where status = 'published'
    and (search @@ websearch_to_tsquery('simple', q) or title ilike '%' || q || '%')
  order by ts_rank(search, websearch_to_tsquery('simple', q)) desc, created_at desc
  limit least(greatest(max_results, 1), 20)
$$;

-- ---------------------------------------------------------------------------
-- Institution data workstream: entries from authoritative reference lists
-- ---------------------------------------------------------------------------

create table next_step.registry_entries (
  id uuid primary key default gen_random_uuid(),
  registry text not null,             -- e.g. 'mechinot-council', 'hesder-association'
  category text not null check (category in ('idf', 'mechina', 'hesder', 'yeshiva')),
  external_name text not null,
  normalized_name text not null,
  location text,
  source_url text not null,
  retrieved_on date not null,
  matched_institution_id text references next_step.institutions (id) on delete set null,
  status text not null default 'unresolved' check (status in ('matched', 'unresolved', 'ambiguous', 'inactive', 'not_applicable')),
  notes text,
  updated_at timestamptz not null default now(),
  unique (registry, normalized_name)
);
alter table next_step.registry_entries enable row level security;
grant select, insert, update on next_step.registry_entries to authenticated;
create policy "admins manage registry" on next_step.registry_entries for all to authenticated
  using ((select next_step.is_admin())) with check ((select next_step.is_admin()));

-- Functions: only what the app calls.
revoke all on all functions in schema next_step from public;
grant execute on function next_step.ensure_profile(text) to authenticated;
grant execute on function next_step.search_questions(text, integer) to anon, authenticated;
grant execute on function next_step.is_moderator() to anon, authenticated;
grant execute on function next_step.is_admin() to anon, authenticated;
grant execute on function next_step.current_role() to anon, authenticated;
grant execute on function next_step.speaks_for(text) to anon, authenticated;
