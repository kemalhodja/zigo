-- Family relationships, media lifecycle, canonical entitlements and safety controls.

create table if not exists public.family_link_invitations (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.users(id) on delete cascade,
  student_email text not null,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_student_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create unique index if not exists family_link_pending_invite_idx
  on public.family_link_invitations (guardian_id, lower(student_email))
  where status = 'pending';

create table if not exists public.family_student_links (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.users(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  relationship text not null default 'guardian' check (relationship in ('guardian', 'parent', 'caregiver')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (guardian_id, student_id)
);

create index if not exists family_student_links_student_idx on public.family_student_links (student_id) where status = 'active';

alter table public.family_link_invitations enable row level security;
alter table public.family_student_links enable row level security;

create policy "Guardians read own family invitations" on public.family_link_invitations
  for select to authenticated using (guardian_id = auth.uid());
create policy "Family members read active links" on public.family_student_links
  for select to authenticated using (status = 'active' and (guardian_id = auth.uid() or student_id = auth.uid()));

create or replace function public.is_active_guardian_of(target_student_id uuid, target_guardian_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.family_student_links f
    where f.guardian_id = target_guardian_id and f.student_id = target_student_id and f.status = 'active'
  );
$$;

create or replace function public.create_family_link_invitation(target_student_email text)
returns table (invitation_id uuid, invitation_token text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  normalized_email text := lower(trim(target_student_email));
  raw_token text := encode(gen_random_bytes(32), 'hex');
  invite public.family_link_invitations;
begin
  if auth.uid() is null or public.current_user_role() <> 'parent' then raise exception 'only parent accounts can create family invitations'; end if;
  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'a valid student email is required'; end if;
  update public.family_link_invitations set status = 'expired'
    where guardian_id = auth.uid() and lower(student_email) = normalized_email and status = 'pending' and expires_at <= now();
  update public.family_link_invitations set status = 'revoked'
    where guardian_id = auth.uid() and lower(student_email) = normalized_email and status = 'pending';
  insert into public.family_link_invitations (guardian_id, student_email, token_hash)
  values (auth.uid(), normalized_email, encode(digest(raw_token, 'sha256'), 'hex')) returning * into invite;
  return query select invite.id, raw_token, invite.expires_at;
end;
$$;

create or replace function public.accept_family_link_invitation(raw_token text)
returns public.family_student_links
language plpgsql security definer set search_path = public as $$
declare
  invite public.family_link_invitations;
  link public.family_student_links;
  account_email text;
begin
  if auth.uid() is null or public.current_user_role() <> 'student' then raise exception 'only student accounts can accept a family invitation'; end if;
  select lower(email) into account_email from public.users where id = auth.uid();
  select * into invite from public.family_link_invitations
    where token_hash = encode(digest(trim(raw_token), 'sha256'), 'hex') and status = 'pending' and expires_at > now()
    for update;
  if not found or lower(invite.student_email) <> account_email then raise exception 'family invitation is invalid or expired'; end if;
  insert into public.family_student_links (guardian_id, student_id)
  values (invite.guardian_id, auth.uid())
  on conflict (guardian_id, student_id) do update set status = 'active', revoked_at = null
  returning * into link;
  update public.family_link_invitations set status = 'accepted', accepted_student_id = auth.uid(), accepted_at = now() where id = invite.id;
  return link;
end;
$$;

create or replace function public.revoke_family_student_link(target_link_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.family_student_links set status = 'revoked', revoked_at = now()
    where id = target_link_id and status = 'active' and (guardian_id = auth.uid() or student_id = auth.uid());
  if not found then raise exception 'family link was not found'; end if;
end;
$$;

grant execute on function public.create_family_link_invitation(text) to authenticated;
grant execute on function public.accept_family_link_invitation(text) to authenticated;
grant execute on function public.revoke_family_student_link(uuid) to authenticated;
grant execute on function public.is_active_guardian_of(uuid, uuid) to authenticated;

create table if not exists public.user_safety_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  allow_comments boolean not null default true,
  allow_story_replies boolean not null default true,
  allow_follow_requests boolean not null default true,
  profile_discoverable boolean not null default true,
  require_guardian_post_approval boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.user_safety_settings enable row level security;
create policy "Users manage own safety settings" on public.user_safety_settings for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.media_uploads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  object_path text not null unique,
  media_type text not null check (media_type in ('image', 'video')),
  byte_size bigint not null check (byte_size >= 0),
  status text not null default 'pending' check (status in ('pending', 'attached', 'deleted')),
  post_id uuid references public.social_posts(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  attached_at timestamptz,
  deleted_at timestamptz
);
create index if not exists media_uploads_pending_expiry_idx on public.media_uploads (expires_at) where status = 'pending';
alter table public.media_uploads enable row level security;
create policy "Owners manage media lifecycle" on public.media_uploads for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create or replace function public.user_has_active_entitlement(target_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = target_user_id and (
      coalesce(u.is_premium, false)
      or u.created_at > now() - interval '7 days'
      or exists (
        select 1 from public.user_subscriptions us
        where us.user_id = target_user_id and us.tier = 'zigo_plus'
          and (us.current_period_end is null or us.current_period_end > now())
      )
    )
  );
$$;
grant execute on function public.user_has_active_entitlement(uuid) to authenticated;

alter table public.role_change_requests add column if not exists reason text;
alter table public.role_change_requests add column if not exists reviewed_by uuid references public.users(id) on delete set null;
alter table public.role_change_requests add column if not exists reviewed_at timestamptz;
alter table public.role_change_requests add column if not exists reviewer_note text;

create or replace function public.reject_role_change_request(request_id uuid, note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.current_user_is_platform_admin() then raise exception 'only admins can reject role change requests'; end if;
  update public.role_change_requests set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), reviewer_note = nullif(trim(note), ''), updated_at = now()
    where id = request_id and status in ('pending', 'paid');
  if not found then raise exception 'role change request is not pending'; end if;
end;
$$;
grant execute on function public.reject_role_change_request(uuid, text) to authenticated;
