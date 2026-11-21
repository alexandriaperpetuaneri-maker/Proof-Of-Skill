create table public.candidate_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb not null check (jsonb_typeof(profile) = 'object' and octet_length(profile::text) <= 8192)
);

create table public.candidate_work_samples (
  user_id uuid not null references auth.users (id) on delete cascade,
  id uuid not null,
  sample jsonb not null check (jsonb_typeof(sample) = 'object' and octet_length(sample::text) <= 65536),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.candidate_profiles enable row level security;
alter table public.candidate_work_samples enable row level security;

revoke all on public.candidate_profiles, public.candidate_work_samples from anon, authenticated;
grant select, insert, update on public.candidate_profiles to authenticated;
grant select, insert on public.candidate_work_samples to authenticated;

create policy "Candidates manage their own profile"
  on public.candidate_profiles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Candidates read their own work"
  on public.candidate_work_samples for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Candidates create their own work"
  on public.candidate_work_samples for insert to authenticated
  with check ((select auth.uid()) = user_id);
