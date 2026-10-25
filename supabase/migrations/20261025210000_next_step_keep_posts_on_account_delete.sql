-- Community posts stay when their author deletes the account, without the author (privacy policy, 2026-10-25).
-- The constraint names are kept: PostgREST embeds the author through questions_author_id_fkey / answers_author_id_fkey.

alter table next_step.questions alter column author_id drop not null;
alter table next_step.questions drop constraint questions_author_id_fkey;
alter table next_step.questions add constraint questions_author_id_fkey
  foreign key (author_id) references next_step.profiles (id) on delete set null;

alter table next_step.answers alter column author_id drop not null;
alter table next_step.answers drop constraint answers_author_id_fkey;
alter table next_step.answers add constraint answers_author_id_fkey
  foreign key (author_id) references next_step.profiles (id) on delete set null;

-- With no author, nobody but a moderator reaches the update, and a moderator still may not rewrite the text.
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
    if (new.title, new.body) is distinct from (old.title, old.body) and old.author_id is distinct from auth.uid() then
      raise exception 'NS_FORBIDDEN' using errcode = '42501';
    end if;
  elsif new.body is distinct from old.body and old.author_id is distinct from auth.uid() then
    raise exception 'NS_FORBIDDEN' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
