create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  unique (user_id, status)
);

create index if not exists account_deletion_requests_user_idx
on public.account_deletion_requests (user_id, requested_at desc);

alter table public.account_deletion_requests enable row level security;

drop policy if exists "Users can read own deletion requests" on public.account_deletion_requests;
drop policy if exists "Users can request account deletion" on public.account_deletion_requests;

create policy "Users can read own deletion requests"
on public.account_deletion_requests
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can request account deletion"
on public.account_deletion_requests
for insert
to authenticated
with check (user_id = auth.uid());

create or replace function public.request_account_deletion(p_reason text default null)
returns public.account_deletion_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.account_deletion_requests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  insert into public.account_deletion_requests (user_id, reason, status)
  values (auth.uid(), left(trim(coalesce(p_reason, '')), 500), 'pending')
  on conflict (user_id, status) do update
  set reason = excluded.reason, requested_at = now()
  returning * into saved;

  return saved;
end;
$$;

create or replace function public.export_user_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.users%rowtype;
  payload jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  select * into profile from public.users where id = auth.uid();

  payload := jsonb_build_object(
    'profile', jsonb_build_object(
      'id', profile.id,
      'email', profile.email,
      'full_name', profile.full_name,
      'role', profile.role,
      'total_points', profile.total_points,
      'created_at', profile.created_at
    ),
    'interests', coalesce((
      select jsonb_agg(jsonb_build_object('area_id', ui.area_id))
      from public.user_interests ui where ui.user_id = auth.uid()
    ), '[]'::jsonb),
    'learning_events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'action_type', le.action_type,
        'points_awarded', le.points_awarded,
        'created_at', le.created_at
      ) order by le.created_at desc)
      from public.learning_events le
      where le.user_id = auth.uid()
      limit 200
    ), '[]'::jsonb),
    'child_profiles', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', cp.id,
        'display_name', cp.display_name,
        'total_points', cp.total_points
      ))
      from public.child_profiles cp
      where cp.parent_id = auth.uid()
    ), '[]'::jsonb),
    'exported_at', now()
  );

  return payload;
end;
$$;

grant execute on function public.request_account_deletion(text) to authenticated;
grant execute on function public.export_user_data() to authenticated;

do $$
declare
  v_parent_id uuid := '00000000-0000-4000-8000-000000000201';
  v_child_id uuid := '00000000-0000-4000-8000-000000000701';
  v_math_area_id int;
begin
  select id into v_math_area_id
  from public.education_areas
  where area_name in ('LGS Matematik', 'YKS Matematik')
  order by case area_name when 'LGS Matematik' then 0 else 1 end
  limit 1;

  insert into public.child_profiles (id, parent_id, display_name, age_group, total_points)
  values (v_child_id, v_parent_id, 'Elif Demo', '8-10', 45)
  on conflict (id) do update
  set display_name = excluded.display_name, age_group = excluded.age_group;

  if v_math_area_id is not null then
    insert into public.child_profile_interests (child_profile_id, area_id)
    values (v_child_id, v_math_area_id)
    on conflict do nothing;
  end if;
end $$;
