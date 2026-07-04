create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  area_id int not null references public.education_areas(id),
  title varchar(255) not null,
  question_text text not null,
  options jsonb not null,
  correct_option int not null check (correct_option >= 0),
  points_reward int not null default 10 check (points_reward > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete cascade,
  selected_option int not null check (selected_option >= 0),
  is_correct boolean not null,
  points_awarded int not null default 0 check (points_awarded >= 0),
  created_at timestamptz not null default now(),
  constraint quiz_attempts_owner_check check (
    (user_id is not null and child_profile_id is null)
    or (user_id is null and child_profile_id is not null)
  )
);

create table public.video_completions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete cascade,
  seconds_watched int not null check (seconds_watched >= 60),
  points_awarded int not null default 10 check (points_awarded >= 0),
  created_at timestamptz not null default now(),
  constraint video_completions_owner_check check (
    (user_id is not null and child_profile_id is null)
    or (user_id is null and child_profile_id is not null)
  )
);

create unique index quiz_attempts_user_once_idx
on public.quiz_attempts (quiz_id, user_id)
where user_id is not null;

create unique index quiz_attempts_child_once_idx
on public.quiz_attempts (quiz_id, child_profile_id)
where child_profile_id is not null;

create unique index video_completions_user_once_idx
on public.video_completions (post_id, user_id)
where user_id is not null;

create unique index video_completions_child_once_idx
on public.video_completions (post_id, child_profile_id)
where child_profile_id is not null;

create index quizzes_area_id_created_at_idx on public.quizzes (area_id, created_at desc);

alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.video_completions enable row level security;

create policy "Teachers can read own quizzes"
on public.quizzes
for select
to authenticated
using (teacher_id = auth.uid());

create policy "Platform admins can read all quizzes"
on public.quizzes
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Verified teachers can create area quizzes"
on public.quizzes
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and public.current_user_is_verified_teacher()
  and public.current_user_has_area(area_id)
);

create policy "Verified teachers can update own quizzes"
on public.quizzes
for update
to authenticated
using (teacher_id = auth.uid())
with check (
  teacher_id = auth.uid()
  and public.current_user_is_verified_teacher()
  and public.current_user_has_area(area_id)
);

create policy "Users can read own quiz attempts"
on public.quiz_attempts
for select
to authenticated
using (user_id = auth.uid());

create policy "Parents can read child quiz attempts"
on public.quiz_attempts
for select
to authenticated
using (
  exists (
    select 1
    from public.child_profiles
    where child_profiles.id = quiz_attempts.child_profile_id
      and child_profiles.parent_id = auth.uid()
  )
);

create policy "Users can read own video completions"
on public.video_completions
for select
to authenticated
using (user_id = auth.uid());

create policy "Parents can read child video completions"
on public.video_completions
for select
to authenticated
using (
  exists (
    select 1
    from public.child_profiles
    where child_profiles.id = video_completions.child_profile_id
      and child_profiles.parent_id = auth.uid()
  )
);

create or replace function public.get_matched_quizzes()
returns table(
  id uuid,
  area_id int,
  title varchar,
  question_text text,
  options jsonb,
  points_reward int,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    quizzes.id,
    quizzes.area_id,
    quizzes.title,
    quizzes.question_text,
    quizzes.options,
    quizzes.points_reward,
    quizzes.created_at
  from public.quizzes
  join public.users teacher on teacher.id = quizzes.teacher_id
  where quizzes.is_active = true
    and teacher.role = 'teacher'
    and teacher.is_verified = true
    and public.current_user_has_area(quizzes.area_id)
  order by quizzes.created_at desc
$$;

grant execute on function public.get_matched_quizzes() to authenticated;

create or replace function public.get_child_matched_quizzes(target_child_profile_id uuid)
returns table(
  id uuid,
  area_id int,
  title varchar,
  question_text text,
  options jsonb,
  points_reward int,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    quizzes.id,
    quizzes.area_id,
    quizzes.title,
    quizzes.question_text,
    quizzes.options,
    quizzes.points_reward,
    quizzes.created_at
  from public.quizzes
  join public.users teacher on teacher.id = quizzes.teacher_id
  join public.child_profile_interests
    on child_profile_interests.area_id = quizzes.area_id
  join public.child_profiles
    on child_profiles.id = child_profile_interests.child_profile_id
  where quizzes.is_active = true
    and teacher.role = 'teacher'
    and teacher.is_verified = true
    and child_profiles.id = target_child_profile_id
    and child_profiles.parent_id = auth.uid()
  order by quizzes.created_at desc
$$;

grant execute on function public.get_child_matched_quizzes(uuid) to authenticated;

create or replace function public.submit_quiz_attempt(
  target_quiz_id uuid,
  selected_option int
)
returns public.quiz_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz public.quizzes;
  existing_attempt public.quiz_attempts;
  inserted_attempt public.quiz_attempts;
  awarded_points int;
  answer_is_correct boolean;
begin
  if public.current_user_role() <> 'student' then
    raise exception 'only student accounts can submit quiz attempts directly';
  end if;

  select * into quiz
  from public.quizzes
  where id = target_quiz_id
    and is_active = true;

  if not found then
    raise exception 'quiz was not found';
  end if;

  if not public.current_user_has_area(quiz.area_id) then
    raise exception 'quiz does not match selected education areas';
  end if;

  select * into existing_attempt
  from public.quiz_attempts
  where quiz_id = target_quiz_id
    and user_id = auth.uid();

  if found then
    return existing_attempt;
  end if;

  answer_is_correct := selected_option = quiz.correct_option;
  awarded_points := case when answer_is_correct then quiz.points_reward else 0 end;

  insert into public.quiz_attempts (
    quiz_id,
    user_id,
    selected_option,
    is_correct,
    points_awarded
  )
  values (
    target_quiz_id,
    auth.uid(),
    selected_option,
    answer_is_correct,
    awarded_points
  )
  returning * into inserted_attempt;

  if awarded_points > 0 then
    update public.users
    set total_points = total_points + awarded_points
    where id = auth.uid()
      and role = 'student';
  end if;

  return inserted_attempt;
end;
$$;

grant execute on function public.submit_quiz_attempt(uuid, int) to authenticated;

create or replace function public.submit_child_quiz_attempt(
  target_child_profile_id uuid,
  target_quiz_id uuid,
  selected_option int
)
returns public.quiz_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz public.quizzes;
  existing_attempt public.quiz_attempts;
  inserted_attempt public.quiz_attempts;
  awarded_points int;
  answer_is_correct boolean;
begin
  if public.current_user_role() <> 'parent' then
    raise exception 'only parents can submit attempts for child profiles';
  end if;

  if not exists (
    select 1
    from public.child_profiles
    where id = target_child_profile_id
      and parent_id = auth.uid()
  ) then
    raise exception 'child profile does not belong to this parent';
  end if;

  select * into quiz
  from public.quizzes
  where id = target_quiz_id
    and is_active = true;

  if not found then
    raise exception 'quiz was not found';
  end if;

  if not exists (
    select 1
    from public.child_profile_interests
    where child_profile_id = target_child_profile_id
      and area_id = quiz.area_id
  ) then
    raise exception 'quiz does not match child education areas';
  end if;

  select * into existing_attempt
  from public.quiz_attempts
  where quiz_id = target_quiz_id
    and child_profile_id = target_child_profile_id;

  if found then
    return existing_attempt;
  end if;

  answer_is_correct := selected_option = quiz.correct_option;
  awarded_points := case when answer_is_correct then quiz.points_reward else 0 end;

  insert into public.quiz_attempts (
    quiz_id,
    child_profile_id,
    selected_option,
    is_correct,
    points_awarded
  )
  values (
    target_quiz_id,
    target_child_profile_id,
    selected_option,
    answer_is_correct,
    awarded_points
  )
  returning * into inserted_attempt;

  if awarded_points > 0 then
    update public.child_profiles
    set total_points = total_points + awarded_points
    where id = target_child_profile_id;
  end if;

  return inserted_attempt;
end;
$$;

grant execute on function public.submit_child_quiz_attempt(uuid, uuid, int) to authenticated;

create or replace function public.complete_video_post(
  target_post_id uuid,
  seconds_watched int default 60
)
returns public.video_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  post public.posts;
  existing_completion public.video_completions;
  inserted_completion public.video_completions;
begin
  if public.current_user_role() <> 'student' then
    raise exception 'only student accounts can complete videos directly';
  end if;

  if seconds_watched < 60 then
    raise exception 'at least 60 seconds must be watched';
  end if;

  select * into post
  from public.posts
  where id = target_post_id
    and media_url is not null;

  if not found then
    raise exception 'video post was not found';
  end if;

  if not public.current_user_has_area(post.area_id) then
    raise exception 'video does not match selected education areas';
  end if;

  select * into existing_completion
  from public.video_completions
  where post_id = target_post_id
    and user_id = auth.uid();

  if found then
    return existing_completion;
  end if;

  insert into public.video_completions (
    post_id,
    user_id,
    seconds_watched,
    points_awarded
  )
  values (
    target_post_id,
    auth.uid(),
    seconds_watched,
    10
  )
  returning * into inserted_completion;

  update public.users
  set total_points = total_points + 10
  where id = auth.uid()
    and role = 'student';

  return inserted_completion;
end;
$$;

grant execute on function public.complete_video_post(uuid, int) to authenticated;

create or replace function public.complete_child_video_post(
  target_child_profile_id uuid,
  target_post_id uuid,
  seconds_watched int default 60
)
returns public.video_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  post public.posts;
  existing_completion public.video_completions;
  inserted_completion public.video_completions;
begin
  if public.current_user_role() <> 'parent' then
    raise exception 'only parents can complete videos for child profiles';
  end if;

  if seconds_watched < 60 then
    raise exception 'at least 60 seconds must be watched';
  end if;

  if not exists (
    select 1
    from public.child_profiles
    where id = target_child_profile_id
      and parent_id = auth.uid()
  ) then
    raise exception 'child profile does not belong to this parent';
  end if;

  select * into post
  from public.posts
  where id = target_post_id
    and media_url is not null;

  if not found then
    raise exception 'video post was not found';
  end if;

  if not exists (
    select 1
    from public.child_profile_interests
    where child_profile_id = target_child_profile_id
      and area_id = post.area_id
  ) then
    raise exception 'video does not match child education areas';
  end if;

  select * into existing_completion
  from public.video_completions
  where post_id = target_post_id
    and child_profile_id = target_child_profile_id;

  if found then
    return existing_completion;
  end if;

  insert into public.video_completions (
    post_id,
    child_profile_id,
    seconds_watched,
    points_awarded
  )
  values (
    target_post_id,
    target_child_profile_id,
    seconds_watched,
    10
  )
  returning * into inserted_completion;

  update public.child_profiles
  set total_points = total_points + 10
  where id = target_child_profile_id;

  return inserted_completion;
end;
$$;

grant execute on function public.complete_child_video_post(uuid, uuid, int) to authenticated;
