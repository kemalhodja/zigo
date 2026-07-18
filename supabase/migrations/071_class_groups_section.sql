-- Migration 071: Add classroom (section) to class_groups and user locations

-- 1. Add classroom column to users and child_profiles
alter table public.users
  add column if not exists classroom varchar(50);

alter table public.child_profiles
  add column if not exists classroom varchar(50);

-- 2. Add classroom column to class_groups and update unique constraint
alter table public.class_groups
  add column if not exists classroom varchar(50) not null default '';

alter table public.class_groups
  drop constraint if exists class_groups_unique_info;

alter table public.class_groups
  add constraint class_groups_unique_info unique (city, district, school_name, grade_level, classroom);

drop index if exists public.class_groups_search_idx;
create index if not exists class_groups_search_idx
  on public.class_groups (city, district, school_name, grade_level, classroom);

-- 3. Update join_class_group RPC
create or replace function public.join_class_group(
  p_city text,
  p_district text,
  p_school_name text,
  p_grade_level text,
  p_child_profile_id uuid default null,
  p_classroom text default ''
)
returns public.class_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_city text := nullif(trim(coalesce(p_city, '')), '');
  normalized_district text := nullif(trim(coalesce(p_district, '')), '');
  normalized_school text := nullif(trim(coalesce(p_school_name, '')), '');
  normalized_grade text := nullif(trim(coalesce(p_grade_level, '')), '');
  normalized_classroom text := trim(coalesce(p_classroom, ''));
  target_group public.class_groups;
  computed_group_name text;
  caller_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'oturum açmanız gerekiyor.';
  end if;

  -- Abone kontrolü (Sadece abone olan öğrenci ve veli sınıf gruplarına katılabilir)
  if not public.is_user_subscriber(auth.uid()) then
    raise exception 'sınıf grupları sadece abonelere özeldir. gruplara katılmak için abone olmalısınız.';
  end if;

  if normalized_city is null or normalized_district is null or normalized_school is null or normalized_grade is null then
    raise exception 'il, ilçe, okul ve sınıf bilgilerinin tamamı girilmelidir.';
  end if;

  caller_role := public.current_user_role();
  if caller_role not in ('student', 'parent') then
    raise exception 'sadece öğrenci ve veliler sınıf gruplarına katılabilir.';
  end if;

  if normalized_classroom <> '' then
    computed_group_name := normalized_school || ' - ' || normalized_grade || ' ' || normalized_classroom || ' Şubesi Grubu';
  else
    computed_group_name := normalized_school || ' - ' || normalized_grade || ' Grubu';
  end if;

  -- Update user or child profile location info
  if p_child_profile_id is not null then
    if caller_role <> 'parent' then
      raise exception 'çocuk profili için sadece veliler işlem yapabilir.';
    end if;

    update public.child_profiles
    set
      city = normalized_city,
      district = normalized_district,
      school_name = normalized_school,
      grade_level = normalized_grade,
      classroom = normalized_classroom
    where id = p_child_profile_id
      and parent_id = auth.uid();

    if not found then
      raise exception 'çocuk profili bulunamadı.';
    end if;
  else
    update public.users
    set
      city = normalized_city,
      district = normalized_district,
      school_name = normalized_school,
      grade_level = normalized_grade,
      classroom = normalized_classroom
    where id = auth.uid();
  end if;

  -- Find or insert class group
  insert into public.class_groups (city, district, school_name, grade_level, classroom, group_name)
  values (normalized_city, normalized_district, normalized_school, normalized_grade, normalized_classroom, computed_group_name)
  on conflict (city, district, school_name, grade_level, classroom) do update
    set group_name = excluded.group_name
  returning * into target_group;

  -- Insert membership (optional join)
  if p_child_profile_id is not null then
    insert into public.class_group_members (group_id, child_profile_id, role)
    values (target_group.id, p_child_profile_id, 'student')
    on conflict (group_id, child_profile_id) where child_profile_id is not null do nothing;
  else
    insert into public.class_group_members (group_id, user_id, role)
    values (target_group.id, auth.uid(), caller_role::text)
    on conflict (group_id, user_id) where user_id is not null do nothing;
  end if;

  return target_group;
end;
$$;
