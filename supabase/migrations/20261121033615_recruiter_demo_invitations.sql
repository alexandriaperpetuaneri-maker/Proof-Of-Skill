create schema proof_of_skill_private;
revoke all on schema proof_of_skill_private from public, anon, authenticated;
grant usage on schema proof_of_skill_private to authenticated;

create table proof_of_skill_private.recruiter_invite_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table proof_of_skill_private.recruiter_invites (
  email text primary key,
  token_hash bytea unique not null,
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz
);

create table proof_of_skill_private.employer_demo_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id text not null check (company_id = 'northline'),
  joined_at timestamptz not null default now()
);

alter table proof_of_skill_private.recruiter_invite_admins enable row level security;
alter table proof_of_skill_private.recruiter_invites enable row level security;
alter table proof_of_skill_private.employer_demo_members enable row level security;
revoke all on all tables in schema proof_of_skill_private from public, anon, authenticated;

create function proof_of_skill_private.recruiter_demo_access()
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'can_invite', exists (select 1 from proof_of_skill_private.recruiter_invite_admins where user_id = auth.uid()),
    'company_id', (select company_id from proof_of_skill_private.employer_demo_members where user_id = auth.uid())
  );
$$;

create function proof_of_skill_private.issue_recruiter_demo_invite(recipient text)
returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  recipient_email text := lower(btrim(recipient));
  invite_token text;
  expires timestamptz := now() + interval '7 days';
begin
  if auth.uid() is null or not exists (
    select 1 from proof_of_skill_private.recruiter_invite_admins where user_id = auth.uid()
  ) then
    raise exception 'Invite manager access required' using errcode = '42501';
  end if;
  if recipient_email is null or char_length(recipient_email) > 254
    or recipient_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'Enter a valid recipient email' using errcode = '22023';
  end if;
  if exists (
    select 1 from proof_of_skill_private.employer_demo_members member
    join auth.users account on account.id = member.user_id
    where lower(account.email) = recipient_email
  ) then
    raise exception 'This address already has access' using errcode = '23505';
  end if;

  invite_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into proof_of_skill_private.recruiter_invites(email, token_hash, expires_at)
    values (recipient_email, sha256(convert_to(invite_token, 'UTF8')), expires)
    on conflict (email) do update set token_hash = excluded.token_hash, expires_at = excluded.expires_at,
      accepted_by = null, accepted_at = null
    where recruiter_invites.accepted_by is null;
  if not found then
    raise exception 'This address already has access' using errcode = '23505';
  end if;

  return jsonb_build_object('token', invite_token, 'email', recipient_email, 'expires_at', expires);
end;
$$;

create function proof_of_skill_private.accept_recruiter_demo_invite(invite_token text)
returns text
language plpgsql security definer
set search_path = ''
as $$
declare
  account_id uuid := auth.uid();
  verified_email text;
  invite proof_of_skill_private.recruiter_invites%rowtype;
begin
  if account_id is null or invite_token is null or invite_token !~ '^[a-f0-9]{64}$' then
    raise exception 'Invite unavailable' using errcode = '22023';
  end if;
  select lower(email) into verified_email from auth.users
    where id = account_id and email_confirmed_at is not null;
  if verified_email is null then
    raise exception 'Use the verified invited email' using errcode = '42501';
  end if;

  select * into invite from proof_of_skill_private.recruiter_invites
    where email = verified_email and token_hash = sha256(convert_to(invite_token, 'UTF8'))
    for update;
  if not found or invite.expires_at <= now() then
    raise exception 'Invite unavailable for this email' using errcode = '22023';
  end if;
  if invite.accepted_at is not null then
    if invite.accepted_by = account_id and exists (
      select 1 from proof_of_skill_private.employer_demo_members where user_id = account_id
    ) then
      return 'northline';
    end if;
    raise exception 'Invite already used' using errcode = '22023';
  end if;

  insert into proof_of_skill_private.employer_demo_members(user_id, company_id)
    values (account_id, 'northline') on conflict (user_id) do nothing;
  update proof_of_skill_private.recruiter_invites
    set accepted_by = account_id, accepted_at = now() where email = verified_email;
  return 'northline';
end;
$$;

create function public.recruiter_demo_access()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select proof_of_skill_private.recruiter_demo_access(); $$;

create function public.issue_recruiter_demo_invite(recipient text)
returns jsonb language sql security invoker set search_path = ''
as $$ select proof_of_skill_private.issue_recruiter_demo_invite(recipient); $$;

create function public.accept_recruiter_demo_invite(invite_token text)
returns text language sql security invoker set search_path = ''
as $$ select proof_of_skill_private.accept_recruiter_demo_invite(invite_token); $$;

revoke execute on all functions in schema proof_of_skill_private from public, anon, authenticated;
grant execute on function proof_of_skill_private.recruiter_demo_access(),
  proof_of_skill_private.issue_recruiter_demo_invite(text), proof_of_skill_private.accept_recruiter_demo_invite(text) to authenticated;
revoke execute on function public.recruiter_demo_access(),
  public.issue_recruiter_demo_invite(text), public.accept_recruiter_demo_invite(text) from public, anon, authenticated;
grant execute on function public.recruiter_demo_access(),
  public.issue_recruiter_demo_invite(text), public.accept_recruiter_demo_invite(text) to authenticated;

create function proof_of_skill_private.can_send_recruiter_demo_invite(recipient text, invite_token text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null
    and exists (select 1 from proof_of_skill_private.recruiter_invite_admins where user_id = auth.uid())
    and exists (
      select 1 from proof_of_skill_private.recruiter_invites
      where email = lower(btrim(recipient)) and expires_at > now() and accepted_at is null
        and invite_token ~ '^[a-f0-9]{64}$' and token_hash = sha256(convert_to(invite_token, 'UTF8'))
    );
$$;

create function public.can_send_recruiter_demo_invite(recipient text, invite_token text)
returns boolean language sql stable security invoker set search_path = ''
as $$ select proof_of_skill_private.can_send_recruiter_demo_invite(recipient, invite_token); $$;

revoke execute on function proof_of_skill_private.can_send_recruiter_demo_invite(text, text),
  public.can_send_recruiter_demo_invite(text, text) from public, anon, authenticated;
grant execute on function proof_of_skill_private.can_send_recruiter_demo_invite(text, text),
  public.can_send_recruiter_demo_invite(text, text) to authenticated;
