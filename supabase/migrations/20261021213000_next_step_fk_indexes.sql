-- Covering indexes for foreign keys flagged by the Supabase performance advisor.
create index if not exists answer_votes_user_idx on next_step.answer_votes (user_id);
create index if not exists moderation_log_actor_idx on next_step.moderation_log (actor_id);
create index if not exists notifications_answer_idx on next_step.notifications (answer_id);
create index if not exists notifications_question_idx on next_step.notifications (question_id);
create index if not exists pathway_steps_institution_idx on next_step.pathway_steps (institution_id);
create index if not exists profiles_represented_institution_idx on next_step.profiles (represented_institution_id);
create index if not exists registry_entries_matched_idx on next_step.registry_entries (matched_institution_id);
create index if not exists reports_resolved_by_idx on next_step.reports (resolved_by);
create index if not exists saved_institutions_institution_idx on next_step.saved_institutions (institution_id);
