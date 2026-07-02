-- Admin verification for teacher, institution (teacher org) and platform publisher accounts.

create or replace function public.verify_teacher(
  target_teacher_id uuid,
  verified boolean
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_teacher public.users;
begin
  if not public.current_user_is_platform_admin() then
    raise exception 'platform admin access is required';
  end if;

  update public.users
  set is_verified = verified
  where id = target_teacher_id
    and role in ('teacher', 'platform')
  returning * into updated_teacher;

  if not found then
    raise exception 'publisher profile was not found';
  end if;

  return updated_teacher;
end;
$$;

create or replace function public.admin_set_teacher_areas(
  target_teacher_id uuid,
  area_ids int[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_platform_admin() then
    raise exception 'platform admin access is required';
  end if;

  if not exists (
    select 1
    from public.users
    where id = target_teacher_id
      and role in ('teacher', 'platform')
  ) then
    raise exception 'publisher profile was not found';
  end if;

  delete from public.user_interests
  where user_id = target_teacher_id;

  insert into public.user_interests (user_id, area_id)
  select target_teacher_id, selected.area_id
  from unnest(area_ids) as selected(area_id)
  join public.education_areas on education_areas.id = selected.area_id
  on conflict (user_id, area_id) do nothing;
end;
$$;

insert into public.zigo_applied_migrations (migration_id)
values ('081_publisher_admin_verification')
on conflict (migration_id) do nothing;
