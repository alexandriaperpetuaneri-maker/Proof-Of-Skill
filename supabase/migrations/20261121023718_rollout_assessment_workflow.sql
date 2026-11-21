create table public.candidate_rollout_drafts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  id uuid not null,
  revision integer not null default 1 check (revision > 0),
  answers text[] not null check (
    array_dims(answers) is not distinct from '[1:4]' and array_position(answers, null) is null
    and char_length(answers[1]) <= 2000 and char_length(answers[2]) <= 2000
    and char_length(answers[3]) <= 2000 and char_length(answers[4]) <= 2000
  )
);

create table public.rollout_reviewers (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create table public.rollout_reviews (
  user_id uuid not null,
  sample_id uuid not null,
  scores smallint[] not null check (
    array_dims(scores) is not distinct from '[1:4]' and array_position(scores, null) is null
    and scores <@ array[1, 2, 3, 4, 5]::smallint[]
  ),
  strengths text not null check (char_length(strengths) <= 1600 and btrim(strengths) <> ''),
  improvements text not null check (char_length(improvements) <= 1600 and btrim(improvements) <> ''),
  primary key (user_id, sample_id),
  foreign key (user_id, sample_id) references public.candidate_work_samples (user_id, id) on delete cascade
);

alter table public.candidate_rollout_drafts enable row level security;
alter table public.rollout_reviewers enable row level security;
alter table public.rollout_reviews enable row level security;

revoke all on public.candidate_rollout_drafts, public.rollout_reviewers, public.rollout_reviews from public, anon, authenticated;
grant select, insert, update, delete on public.candidate_rollout_drafts to authenticated;
grant select on public.rollout_reviewers to authenticated;
grant select, insert, update on public.rollout_reviews to authenticated;

create policy "Candidates manage their rollout draft"
  on public.candidate_rollout_drafts for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Reviewers can see their own membership"
  on public.rollout_reviewers for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Reviewers read standalone rollout samples"
  on public.candidate_work_samples for select to authenticated
  using (
    sample->>'assessmentId' = 'rollout' and not (sample ? 'jobId')
    and exists (select 1 from public.rollout_reviewers where user_id = (select auth.uid()))
  );

create policy "Candidates read their own rollout feedback"
  on public.rollout_reviews for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Assigned reviewers can score standalone rollout samples"
  on public.rollout_reviews for all to authenticated
  using (exists (select 1 from public.rollout_reviewers where user_id = (select auth.uid())))
  with check (
    exists (select 1 from public.rollout_reviewers where user_id = (select auth.uid()))
    and exists (
      select 1 from public.candidate_work_samples work
      where work.user_id = rollout_reviews.user_id and work.id = rollout_reviews.sample_id
        and work.sample->>'assessmentId' = 'rollout' and not (work.sample ? 'jobId')
    )
  );

create function public.submit_rollout_work(attempt_id uuid, expected_revision integer, responses text[])
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  candidate_id uuid := auth.uid();
  draft public.candidate_rollout_drafts%rowtype;
  submitted jsonb;
begin
  if candidate_id is null then
    raise exception 'Sign in to submit' using errcode = '42501';
  end if;
  if attempt_id is null or array_dims(responses) is distinct from '[1:4]'
    or exists (select 1 from unnest(responses) answer
      where answer is null or btrim(answer) = '' or char_length(answer) > 2000) then
    raise exception 'Enter all four responses' using errcode = '22023';
  end if;

  select sample into submitted from public.candidate_work_samples
    where user_id = candidate_id and id = attempt_id;
  if found then return submitted; end if;

  if expected_revision is null then
    insert into public.candidate_rollout_drafts (user_id, id, answers)
      values (candidate_id, attempt_id, responses) on conflict (user_id) do nothing;
    expected_revision := 1;
  end if;

  select * into draft from public.candidate_rollout_drafts where user_id = candidate_id for update;
  select sample into submitted from public.candidate_work_samples
    where user_id = candidate_id and id = attempt_id;
  if found then
    -- A concurrent retry may have created a draft after the first submission committed.
    delete from public.candidate_rollout_drafts where user_id = candidate_id and id = attempt_id;
    return submitted;
  end if;
  if draft.id is distinct from attempt_id or draft.revision is distinct from expected_revision then
    raise exception 'The rollout draft has changed' using errcode = '40001';
  end if;

  submitted := jsonb_build_object(
    'id', attempt_id, 'assessmentId', 'rollout', 'code', 'PS-' || upper(left(attempt_id::text, 8)),
    'date', now(), 'answers', responses, 'sample', false, 'poolOptIn', false
  );
  insert into public.candidate_work_samples (user_id, id, sample)
    values (candidate_id, attempt_id, submitted);
  delete from public.candidate_rollout_drafts where user_id = candidate_id and id = attempt_id;
  return submitted;
end;
$$;

revoke execute on function public.submit_rollout_work(uuid, integer, text[]) from public, anon, authenticated;
grant execute on function public.submit_rollout_work(uuid, integer, text[]) to authenticated;
