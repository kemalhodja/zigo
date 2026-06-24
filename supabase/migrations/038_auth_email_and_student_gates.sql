do $$
begin
  create type public.student_document_status as enum ('pending', 'approved', 'rejected');
exception
  when duplicate_object then null;
end $$;

create or replace function public.current_user_email_confirmed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select au.email_confirmed_at is not null
      from auth.users au
      where au.id = auth.uid()
    ),
    false
  )
$$;

grant execute on function public.current_user_email_confirmed() to authenticated;

create or replace function public.set_user_interests(area_ids int[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  if not public.current_user_email_confirmed() then
    raise exception 'email confirmation is required';
  end if;

  select role
  into current_role
  from public.users
  where id = auth.uid();

  if current_role is null then
    raise exception 'profile is required before selecting areas';
  end if;

  if current_role = 'teacher' then
    raise exception 'teacher areas are assigned by platform admins';
  end if;

  delete from public.user_interests
  where user_id = auth.uid();

  insert into public.user_interests (user_id, area_id)
  select auth.uid(), education_areas.id
  from public.education_areas
  where education_areas.id = any(area_ids)
  on conflict do nothing;
end;
$$;

grant execute on function public.set_user_interests(int[]) to authenticated;

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

  if not public.current_user_email_confirmed() then
    raise exception 'email confirmation is required';
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

update public.users
set
  student_document_url = coalesce(student_document_url, 'demo://seed/student-document'),
  student_document_status = 'approved',
  student_document_submitted_at = coalesce(student_document_submitted_at, now()),
  student_document_reviewed_at = coalesce(student_document_reviewed_at, now())
where email = 'student@zigo.test'
  and role = 'student';
