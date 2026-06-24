create table public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id) on delete cascade,
  display_name varchar(100) not null,
  age_group varchar(50),
  avatar_assets jsonb not null default '{"hat": null, "suit": null, "pet": null}'::jsonb,
  total_points int not null default 0 check (total_points >= 0),
  created_at timestamptz not null default now()
);

create table public.child_profile_interests (
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  area_id int not null references public.education_areas(id) on delete cascade,
  primary key (child_profile_id, area_id)
);

create index child_profiles_parent_id_idx on public.child_profiles (parent_id);
create index child_profile_interests_area_id_idx on public.child_profile_interests (area_id);

alter table public.child_profiles enable row level security;
alter table public.child_profile_interests enable row level security;

create policy "Parents can read own child profiles"
on public.child_profiles
for select
to authenticated
using (parent_id = auth.uid());

create policy "Parents can create own child profiles"
on public.child_profiles
for insert
to authenticated
with check (
  parent_id = auth.uid()
  and public.current_user_role() = 'parent'
  and total_points = 0
);

create policy "Parents can update own child profiles"
on public.child_profiles
for update
to authenticated
using (parent_id = auth.uid())
with check (parent_id = auth.uid());

create policy "Parents can delete own child profiles"
on public.child_profiles
for delete
to authenticated
using (parent_id = auth.uid());

create policy "Parents can read child profile interests"
on public.child_profile_interests
for select
to authenticated
using (
  exists (
    select 1
    from public.child_profiles
    where child_profiles.id = child_profile_interests.child_profile_id
      and child_profiles.parent_id = auth.uid()
  )
);

create policy "Parents can create child profile interests"
on public.child_profile_interests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.child_profiles
    where child_profiles.id = child_profile_interests.child_profile_id
      and child_profiles.parent_id = auth.uid()
  )
);

create policy "Parents can remove child profile interests"
on public.child_profile_interests
for delete
to authenticated
using (
  exists (
    select 1
    from public.child_profiles
    where child_profiles.id = child_profile_interests.child_profile_id
      and child_profiles.parent_id = auth.uid()
  )
);

create policy "Parents can read child matched verified posts"
on public.posts
for select
to authenticated
using (
  exists (
    select 1
    from public.child_profiles
    join public.child_profile_interests
      on child_profile_interests.child_profile_id = child_profiles.id
    join public.users teacher
      on teacher.id = posts.teacher_id
    where child_profiles.parent_id = auth.uid()
      and child_profile_interests.area_id = posts.area_id
      and teacher.role = 'teacher'
      and teacher.is_verified = true
  )
);

create or replace function public.create_child_profile(
  display_name text,
  age_group text
)
returns public.child_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_child public.child_profiles;
begin
  if public.current_user_role() <> 'parent' then
    raise exception 'only parents can create child profiles';
  end if;

  insert into public.child_profiles (
    parent_id,
    display_name,
    age_group,
    total_points
  )
  values (
    auth.uid(),
    trim(display_name),
    nullif(trim(age_group), ''),
    0
  )
  returning * into inserted_child;

  return inserted_child;
end;
$$;

grant execute on function public.create_child_profile(text, text) to authenticated;

create or replace function public.set_child_profile_interests(
  target_child_profile_id uuid,
  area_ids int[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.child_profiles
    where id = target_child_profile_id
      and parent_id = auth.uid()
  ) then
    raise exception 'child profile does not belong to this parent';
  end if;

  delete from public.child_profile_interests
  where child_profile_id = target_child_profile_id;

  insert into public.child_profile_interests (child_profile_id, area_id)
  select target_child_profile_id, education_areas.id
  from public.education_areas
  where education_areas.id = any(area_ids)
  on conflict do nothing;
end;
$$;

grant execute on function public.set_child_profile_interests(uuid, int[]) to authenticated;

create or replace function public.award_child_learning_points(
  target_child_profile_id uuid,
  action_kind text
)
returns table(id uuid, total_points int)
language plpgsql
security definer
set search_path = public
as $$
declare
  points_to_add int;
begin
  if not exists (
    select 1
    from public.child_profiles
    where child_profiles.id = target_child_profile_id
      and child_profiles.parent_id = auth.uid()
  ) then
    raise exception 'child profile does not belong to this parent';
  end if;

  points_to_add := case action_kind
    when 'micro_video_watched' then 10
    when 'mini_quiz_completed' then 10
    when 'duel_won' then 25
    else null
  end;

  if points_to_add is null then
    raise exception 'unknown learning action';
  end if;

  update public.child_profiles
  set total_points = total_points + points_to_add
  where child_profiles.id = target_child_profile_id
  returning child_profiles.id, child_profiles.total_points into id, total_points;

  return next;
end;
$$;

grant execute on function public.award_child_learning_points(uuid, text) to authenticated;

create or replace function public.update_child_avatar_assets(
  target_child_profile_id uuid,
  assets jsonb
)
returns table(id uuid, avatar_assets jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.child_profiles
    where child_profiles.id = target_child_profile_id
      and child_profiles.parent_id = auth.uid()
  ) then
    raise exception 'child profile does not belong to this parent';
  end if;

  update public.child_profiles
  set avatar_assets = child_profiles.avatar_assets || assets
  where child_profiles.id = target_child_profile_id
  returning child_profiles.id, child_profiles.avatar_assets into id, avatar_assets;

  return next;
end;
$$;

grant execute on function public.update_child_avatar_assets(uuid, jsonb) to authenticated;
