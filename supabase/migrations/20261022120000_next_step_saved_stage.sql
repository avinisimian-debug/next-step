-- Journey tracker: where the user is with each saved place (interested → chosen).
-- Additive only: existing rows get 'interested'. The value is private to the row owner
-- through the existing "own saved" policy.
alter table next_step.saved_institutions
  add column if not exists stage text not null default 'interested'
    check (stage in ('interested', 'contacted', 'visited', 'applied', 'screening', 'accepted', 'chosen', 'dropped')),
  add column if not exists stage_updated_at timestamptz;

grant insert (stage), update (stage) on next_step.saved_institutions to authenticated;

create or replace function next_step.touch_saved_stage() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.stage is distinct from old.stage then
    new.stage_updated_at := now();
  end if;
  return new;
end $$;
revoke all on function next_step.touch_saved_stage() from public;

create or replace trigger saved_institutions_stage_touch
  before update on next_step.saved_institutions
  for each row execute function next_step.touch_saved_stage();
