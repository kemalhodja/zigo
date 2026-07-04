do $$
begin
  create type public.student_document_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

alter table public.users
  add column if not exists bio text,
  add column if not exists avatar_url varchar(500),
  add column if not exists level int not null default 1,
  add column if not exists student_document_url varchar(500),
  add column if not exists student_document_status public.student_document_status,
  add column if not exists student_document_submitted_at timestamptz,
  add column if not exists student_document_reviewed_at timestamptz,
  add column if not exists student_document_reviewed_by uuid references public.users(id) on delete set null;

alter table public.users
  drop constraint if exists users_level_positive_check;

alter table public.users
  add constraint users_level_positive_check check (level >= 1);

alter table public.users
  drop constraint if exists users_bio_length_check;

alter table public.users
  add constraint users_bio_length_check check (bio is null or char_length(bio) <= 500);

create index if not exists users_student_document_pending_idx
on public.users (student_document_submitted_at desc)
where role = 'student' and student_document_status = 'pending';

create or replace function public.update_user_profile(
  next_bio text default null,
  next_avatar_url text default null
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.users;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  update public.users
  set
    bio = case
      when next_bio is null then bio
      else nullif(left(trim(next_bio), 500), '')
    end,
    avatar_url = case
      when next_avatar_url is null then avatar_url
      else nullif(left(trim(next_avatar_url), 500), '')
    end
  where id = auth.uid()
  returning * into updated_profile;

  if not found then
    raise exception 'profile was not found';
  end if;

  return updated_profile;
end;
$$;

grant execute on function public.update_user_profile(text, text) to authenticated;

create or replace function public.submit_student_document(
  document_url text
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.users;
  normalized_url text;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  normalized_url := nullif(left(trim(coalesce(document_url, '')), 500), '');

  if normalized_url is null then
    raise exception 'student document url is required';
  end if;

  update public.users
  set
    student_document_url = normalized_url,
    student_document_status = 'pending',
    student_document_submitted_at = now(),
    student_document_reviewed_at = null,
    student_document_reviewed_by = null
  where id = auth.uid()
    and role = 'student'
  returning * into updated_profile;

  if not found then
    raise exception 'only student accounts can submit a student document';
  end if;

  return updated_profile;
end;
$$;

grant execute on function public.submit_student_document(text) to authenticated;

create or replace function public.review_student_document(
  target_student_id uuid,
  next_status public.student_document_status
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.users;
begin
  if not public.current_user_is_platform_admin() then
    raise exception 'platform admin access is required';
  end if;

  if next_status = 'pending' then
    raise exception 'review status must be approved or rejected';
  end if;

  update public.users
  set
    student_document_status = next_status,
    student_document_reviewed_at = now(),
    student_document_reviewed_by = auth.uid()
  where id = target_student_id
    and role = 'student'
    and student_document_status = 'pending'
    and student_document_url is not null
  returning * into updated_profile;

  if not found then
    raise exception 'pending student document was not found';
  end if;

  return updated_profile;
end;
$$;

grant execute on function public.review_student_document(uuid, public.student_document_status) to authenticated;

create or replace function public.current_user_student_document_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select
        u.role <> 'student'
        or u.student_document_status = 'approved'
      from public.users u
      where u.id = auth.uid()
    ),
    false
  )
$$;

grant execute on function public.current_user_student_document_approved() to authenticated;
