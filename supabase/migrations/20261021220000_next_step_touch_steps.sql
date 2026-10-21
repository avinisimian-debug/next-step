-- Keep pathway_steps.updated_at current without granting users write access to it.
create or replace function next_step.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function next_step.touch_updated_at() from public;

drop trigger if exists pathway_steps_touch on next_step.pathway_steps;
create trigger pathway_steps_touch before update on next_step.pathway_steps
  for each row execute function next_step.touch_updated_at();
