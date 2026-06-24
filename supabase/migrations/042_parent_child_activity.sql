-- Parent-visible child activity log and unified activity feed.

create table if not exists public.child_activity_events (
  id uuid primary key default gen_random_uuid(),
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  activity_type text not null check (
    activity_type in ('micro_video_watched', 'mini_quiz_completed', 'duel_won')
  ),
  title text not null,
  points_awarded int not null default 0 check (points_awarded >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists child_activity_events_child_created_at_idx
on public.child_activity_events (child_profile_id, created_at desc);

alter table public.child_activity_events enable row level security;

drop policy if exists "Parents can read child activity events" on public.child_activity_events;
create policy "Parents can read child activity events"
on public.child_activity_events
for select
to authenticated
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = child_activity_events.child_profile_id
      and cp.parent_id = auth.uid()
  )
);

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
  activity_title text;
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

  activity_title := case action_kind
    when 'micro_video_watched' then 'Micro ders tamamlandı'
    when 'mini_quiz_completed' then 'Mini quiz tamamlandı'
    when 'duel_won' then 'Düello kazanıldı'
    else null
  end;

  if points_to_add is null then
    raise exception 'unknown learning action';
  end if;

  update public.child_profiles
  set total_points = total_points + points_to_add
  where child_profiles.id = target_child_profile_id
  returning child_profiles.id, child_profiles.total_points into id, total_points;

  insert into public.child_activity_events (
    child_profile_id,
    activity_type,
    title,
    points_awarded
  )
  values (
    target_child_profile_id,
    action_kind,
    activity_title,
    points_to_add
  );

  return next;
end;
$$;

create or replace function public.get_parent_child_activity(
  target_child_profile_id uuid,
  result_limit int default 20
)
returns table(
  activity_id uuid,
  activity_type text,
  title text,
  points_awarded int,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.child_profiles cp
    where cp.id = target_child_profile_id
      and cp.parent_id = auth.uid()
  ) then
    raise exception 'child profile access is required';
  end if;

  return query
  select *
  from (
    select
      qa.id as activity_id,
      'quiz_complete'::text as activity_type,
      q.title as title,
      qa.points_awarded,
      jsonb_build_object(
        'score_percent', qa.score_percent,
        'correct_answers', qa.correct_answers,
        'total_questions', qa.total_questions,
        'quiz_id', qa.quiz_id
      ) as metadata,
      coalesce(qa.completed_at, qa.created_at) as created_at
    from public.quiz_attempts qa
    join public.quizzes q on q.id = qa.quiz_id
    where qa.child_profile_id = target_child_profile_id

    union all

    select
      vc.id as activity_id,
      'micro_video_watched'::text as activity_type,
      coalesce(sp.title, sp.caption, lp.title, 'Micro ders') as title,
      vc.points_awarded,
      jsonb_build_object(
        'seconds_watched', vc.seconds_watched,
        'social_post_id', vc.social_post_id,
        'post_id', vc.post_id
      ) as metadata,
      vc.created_at
    from public.video_completions vc
    left join public.social_posts sp on sp.id = vc.social_post_id
    left join public.posts lp on lp.id = vc.post_id
    where vc.child_profile_id = target_child_profile_id

    union all

    select
      cae.id as activity_id,
      cae.activity_type,
      cae.title,
      cae.points_awarded,
      cae.metadata,
      cae.created_at
    from public.child_activity_events cae
    where cae.child_profile_id = target_child_profile_id
  ) activity
  order by activity.created_at desc
  limit greatest(result_limit, 1);
end;
$$;

grant execute on function public.get_parent_child_activity(uuid, int) to authenticated;
