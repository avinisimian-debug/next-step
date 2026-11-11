-- Admins by email: a profile created for one of these addresses starts as admin.
-- No grants, so only SECURITY DEFINER functions (and the dashboard) can read or change the list.
create table next_step.admin_emails (
  email text primary key check (email = lower(email)),
  added_at timestamptz not null default now()
);
alter table next_step.admin_emails enable row level security;

create or replace function next_step.ensure_profile(name text)
returns next_step.profiles language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  result next_step.profiles;
begin
  if me is null then
    raise exception 'NS_AUTH_REQUIRED' using errcode = '28000';
  end if;
  insert into next_step.profiles (id, display_name, role)
  values (
    me,
    left(btrim(coalesce(nullif(btrim(name), ''), 'משתמש/ת')), 40),
    case when exists (
      select 1 from next_step.admin_emails a join auth.users u on lower(u.email) = a.email where u.id = me
    ) then 'admin' else 'member' end
  )
  on conflict (id) do nothing;
  select * into result from next_step.profiles where id = me;
  return result;
end;
$$;
revoke all on function next_step.ensure_profile(text) from public;
grant execute on function next_step.ensure_profile(text) to authenticated;

-- Sign-ups for the admin page: who signed up and when. Admins only.
create or replace function next_step.admin_signups()
returns table (email text, display_name text, role text, signed_up_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not next_step.is_admin() then
    raise exception 'NS_FORBIDDEN' using errcode = '42501';
  end if;
  return query
    select u.email::text, p.display_name, coalesce(p.role, 'member'), u.created_at, u.last_sign_in_at
    from auth.users u
    left join next_step.profiles p on p.id = u.id
    order by u.created_at desc;
end;
$$;
revoke all on function next_step.admin_signups() from public;
grant execute on function next_step.admin_signups() to authenticated;
