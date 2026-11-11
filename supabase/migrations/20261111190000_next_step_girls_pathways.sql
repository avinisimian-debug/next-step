-- The girls' track added the national_service and midrasha pathways (2026-10-23).
alter table next_step.institutions drop constraint institutions_pathway_check;
alter table next_step.institutions add constraint institutions_pathway_check
  check (pathway in ('idf', 'mechina', 'hesder', 'yeshiva', 'national_service', 'midrasha'));
alter table next_step.questions drop constraint questions_pathway_check;
alter table next_step.questions add constraint questions_pathway_check
  check (pathway in ('idf', 'mechina', 'hesder', 'yeshiva', 'national_service', 'midrasha'));
alter table next_step.registry_entries drop constraint registry_entries_category_check;
alter table next_step.registry_entries add constraint registry_entries_category_check
  check (category in ('idf', 'mechina', 'hesder', 'yeshiva', 'national_service', 'midrasha'));
