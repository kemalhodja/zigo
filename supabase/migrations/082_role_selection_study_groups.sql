-- Deferred role selection after registration + supervised study groups.

alter table public.users
  add column if not exists role_selection_completed boolean not null default true;

create type public.study_group_status as enum ('pending_parent', 'active', 'closed');
create type public.study_group_approval_kind as enum ('create_group', 'join_group');
create type public.study_group_approval_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  description text,
  area_id int references public.education_areas(id) on delete set null,
  owner_user_id uuid not null references public.users(id) on delete cascade,
  status public.study_group_status not null default 'pending_parent',
  created_at timestamptz not null default now()
);

create table if not exists public.study_group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.study_group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.study_groups(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists study_group_messages_group_created_idx
on public.study_group_messages (group_id, created_at desc);

create table if not exists public.study_group_approvals (
  id uuid primary key default gen_random_uuid(),
  kind public.study_group_approval_kind not null,
  status public.study_group_approval_status not null default 'pending',
  group_id uuid not null references public.study_groups(id) on delete cascade,
  student_user_id uuid not null references public.users(id) on delete cascade,
  parent_user_id uuid not null references public.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists study_group_approvals_parent_pending_idx
on public.study_group_approvals (parent_user_id, status, created_at desc);

alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;
alter table public.study_group_messages enable row level security;
alter table public.study_group_approvals enable row level security;

create or replace function public.current_user_is_parent_or_student()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
      and role in ('parent', 'student')
  );
$$;

create or replace function public.user_is_active_study_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.study_groups g
    join public.study_group_members m on m.group_id = g.id
    where g.id = p_group_id
      and g.status = 'active'
      and m.user_id = p_user_id
  );
$$;

create policy "Members read active study groups"
on public.study_groups
for select
to authenticated
using (
  status = 'active'
  and public.user_is_active_study_group_member(id, auth.uid())
);

create policy "Owners and parents read own study groups"
on public.study_groups
for select
to authenticated
using (owner_user_id = auth.uid());

create policy "Parents read pending approvals for their groups"
on public.study_groups
for select
to authenticated
using (
  exists (
    select 1
    from public.study_group_approvals a
    where a.group_id = study_groups.id
      and a.parent_user_id = auth.uid()
  )
);

create policy "Members read study group membership"
on public.study_group_members
for select
to authenticated
using (public.user_is_active_study_group_member(group_id, auth.uid()) or user_id = auth.uid());

create policy "Members read study group messages"
on public.study_group_messages
for select
to authenticated
using (public.user_is_active_study_group_member(group_id, auth.uid()));

create policy "Parents read pending study group approvals"
on public.study_group_approvals
for select
to authenticated
using (parent_user_id = auth.uid() or student_user_id = auth.uid());

create or replace function public.complete_role_selection(
  profile_role public.user_role,
  org_type text default null
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_user public.users;
  normalized_org varchar(32);
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  if profile_role not in ('teacher', 'parent', 'student', 'platform') then
    raise exception 'invalid role';
  end if;

  normalized_org := nullif(trim(coalesce(org_type, '')), '');
  if normalized_org is not null
    and normalized_org not in ('kurs', 'okul', 'egitim_kurumu', 'egitim_platformu') then
    normalized_org := null;
  end if;

  if profile_role = 'platform'::public.user_role then
    normalized_org := coalesce(normalized_org, 'egitim_platformu');
  end if;

  update public.users
  set
    role = profile_role,
    organization_type = normalized_org,
    role_selection_completed = true
  where id = auth.uid()
    and role_selection_completed = false
  returning * into updated_user;

  if not found then
    raise exception 'role selection is not pending';
  end if;

  return updated_user;
end;
$$;

create or replace function public.create_study_group(
  p_name text,
  p_description text default null,
  p_area_id int default null,
  p_parent_email text default null
)
returns public.study_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.users;
  parent_user public.users;
  created_group public.study_groups;
begin
  select * into actor from public.users where id = auth.uid();
  if actor.id is null then
    raise exception 'authentication is required';
  end if;

  if actor.role not in ('parent', 'student') then
    raise exception 'only parents and students can create study groups';
  end if;

  if actor.role = 'parent' then
    insert into public.study_groups (name, description, area_id, owner_user_id, status)
    values (trim(p_name), nullif(trim(coalesce(p_description, '')), ''), p_area_id, actor.id, 'active')
    returning * into created_group;

    insert into public.study_group_members (group_id, user_id)
    values (created_group.id, actor.id)
    on conflict do nothing;

    return created_group;
  end if;

  if p_parent_email is null or trim(p_parent_email) = '' then
    raise exception 'parent email is required for student group creation';
  end if;

  select * into parent_user
  from public.users
  where lower(email) = lower(trim(p_parent_email))
    and role = 'parent'
  limit 1;

  if parent_user.id is null then
    raise exception 'parent account was not found';
  end if;

  insert into public.study_groups (name, description, area_id, owner_user_id, status)
  values (trim(p_name), nullif(trim(coalesce(p_description, '')), ''), p_area_id, actor.id, 'pending_parent')
  returning * into created_group;

  insert into public.study_group_approvals (kind, group_id, student_user_id, parent_user_id, note)
  values ('create_group', created_group.id, actor.id, parent_user.id, 'Grup açma isteği');

  return created_group;
end;
$$;

create or replace function public.request_study_group_join(
  p_group_id uuid,
  p_parent_email text
)
returns public.study_group_approvals
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.users;
  target_group public.study_groups;
  parent_user public.users;
  created_approval public.study_group_approvals;
begin
  select * into actor from public.users where id = auth.uid();
  if actor.id is null or actor.role <> 'student' then
    raise exception 'only students can request to join study groups';
  end if;

  select * into target_group from public.study_groups where id = p_group_id and status = 'active';
  if target_group.id is null then
    raise exception 'study group was not found';
  end if;

  if public.user_is_active_study_group_member(p_group_id, actor.id) then
    raise exception 'already a member';
  end if;

  select * into parent_user
  from public.users
  where lower(email) = lower(trim(p_parent_email))
    and role = 'parent'
  limit 1;

  if parent_user.id is null then
    raise exception 'parent account was not found';
  end if;

  insert into public.study_group_approvals (kind, group_id, student_user_id, parent_user_id, note)
  values ('join_group', p_group_id, actor.id, parent_user.id, 'Gruba katılma isteği')
  returning * into created_approval;

  return created_approval;
end;
$$;

create or replace function public.parent_review_study_group_approval(
  p_approval_id uuid,
  p_decision text
)
returns public.study_group_approvals
language plpgsql
security definer
set search_path = public
as $$
declare
  approval_row public.study_group_approvals;
  target_group public.study_groups;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  select * into approval_row
  from public.study_group_approvals
  where id = p_approval_id
    and parent_user_id = auth.uid()
    and status = 'pending'
  for update;

  if approval_row.id is null then
    raise exception 'approval request was not found';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'invalid decision';
  end if;

  update public.study_group_approvals
  set status = p_decision::public.study_group_approval_status,
      reviewed_at = now()
  where id = p_approval_id
  returning * into approval_row;

  select * into target_group from public.study_groups where id = approval_row.group_id;

  if p_decision = 'approved' then
    if approval_row.kind = 'create_group' then
      update public.study_groups
      set status = 'active'
      where id = approval_row.group_id;
    end if;

    insert into public.study_group_members (group_id, user_id)
    values (approval_row.group_id, approval_row.student_user_id)
    on conflict do nothing;
  elsif approval_row.kind = 'create_group' then
    update public.study_groups
    set status = 'closed'
    where id = approval_row.group_id;
  end if;

  return approval_row;
end;
$$;

create or replace function public.send_study_group_message(
  p_group_id uuid,
  p_content text
)
returns public.study_group_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.users;
  created_message public.study_group_messages;
begin
  select * into actor from public.users where id = auth.uid();
  if actor.id is null then
    raise exception 'authentication is required';
  end if;

  if actor.role not in ('parent', 'student') then
    raise exception 'only parents and students can message in study groups';
  end if;

  if not public.user_is_active_study_group_member(p_group_id, auth.uid()) then
    raise exception 'not a group member';
  end if;

  insert into public.study_group_messages (group_id, sender_id, content)
  values (p_group_id, auth.uid(), trim(p_content))
  returning * into created_message;

  return created_message;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_role;
  requested_full_name text;
  requested_org_type varchar(32);
  defer_role boolean;
  role_completed boolean;
begin
  defer_role := coalesce((new.raw_user_meta_data ->> 'defer_role_selection')::boolean, false);
  role_completed := not defer_role;

  requested_role := case
    when defer_role then 'student'::public.user_role
    when new.raw_user_meta_data ->> 'role' in ('teacher', 'parent', 'student', 'platform')
      then (new.raw_user_meta_data ->> 'role')::public.user_role
    else 'student'::public.user_role
  end;

  requested_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  requested_org_type := nullif(trim(coalesce(new.raw_user_meta_data ->> 'organization_type', '')), '');
  if requested_org_type is not null
    and requested_org_type not in ('kurs', 'okul', 'egitim_kurumu', 'egitim_platformu') then
    requested_org_type := null;
  end if;

  if requested_role = 'platform'::public.user_role then
    requested_org_type := coalesce(requested_org_type, 'egitim_platformu');
  end if;

  insert into public.users (
    id,
    email,
    full_name,
    role,
    organization_type,
    is_verified,
    total_points,
    role_selection_completed
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(requested_full_name, split_part(coalesce(new.email, 'Zigo User'), '@', 1), 'Zigo User'),
    requested_role,
    requested_org_type,
    false,
    0,
    role_completed
  )
  on conflict (id) do nothing;

  perform public.grant_registration_trial(new.id);

  return new;
end;
$$;

insert into public.zigo_applied_migrations (migration_id)
values ('082_role_selection_study_groups')
on conflict (migration_id) do nothing;
