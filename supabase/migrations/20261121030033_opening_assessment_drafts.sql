create table public.candidate_opening_drafts (
  user_id uuid not null references auth.users (id) on delete cascade,
  opening_id text not null check (char_length(opening_id) between 1 and 90),
  id uuid not null,
  revision integer not null default 1 check (revision > 0),
  answers text[] not null check (
    array_dims(answers) is not distinct from '[1:4]' and array_position(answers, null) is null
    and char_length(answers[1]) <= 2000 and char_length(answers[2]) <= 2000
    and char_length(answers[3]) <= 2000 and char_length(answers[4]) <= 2000
  ),
  company_responses jsonb not null check (
    jsonb_typeof(company_responses) = 'array' and octet_length(company_responses::text) <= 32768
  ),
  primary key (user_id, opening_id)
);

alter table public.candidate_opening_drafts enable row level security;
revoke all on public.candidate_opening_drafts from public, anon, authenticated;
grant select, insert, update, delete on public.candidate_opening_drafts to authenticated;

create policy "Candidates manage their own opening drafts"
  on public.candidate_opening_drafts for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
