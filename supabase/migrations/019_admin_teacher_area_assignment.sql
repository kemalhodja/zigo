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
      and role = 'teacher'
  ) then
    raise exception 'teacher profile was not found';
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

grant execute on function public.admin_set_teacher_areas(uuid, int[]) to authenticated;
