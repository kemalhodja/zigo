create or replace function public.award_safe_duel_win_points(
  p_target_user_id uuid,
  p_duel_id uuid,
  p_score int,
  p_total_questions int default 3
)
returns table (
  event_id uuid,
  points_awarded int,
  already_awarded boolean,
  total_points int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_event public.learning_events%rowtype;
  current_total int;
  required_score int;
begin
  if auth.uid() is null or auth.uid() <> p_target_user_id then
    raise exception 'not authorized';
  end if;

  if public.current_user_role() <> 'student' then
    raise exception 'only students can earn duel rewards';
  end if;

  if p_total_questions < 1 then
    raise exception 'invalid duel length';
  end if;

  required_score := greatest(1, ceil(p_total_questions::numeric / 2));

  if p_score < required_score then
    raise exception 'duel score below win threshold';
  end if;

  insert into public.learning_events (user_id, action_type, target_id, points_awarded)
  values (p_target_user_id, 'duel_win', p_duel_id, 25)
  on conflict (user_id, action_type, target_id) do nothing
  returning * into inserted_event;

  if inserted_event.id is null then
    select users.total_points into current_total
    from public.users
    where users.id = p_target_user_id;

    return query
    select
      null::uuid,
      0,
      true,
      coalesce(current_total, 0);
    return;
  end if;

  update public.users as profile
  set total_points = profile.total_points + 25
  where profile.id = p_target_user_id
    and profile.role = 'student'
  returning profile.total_points into current_total;

  return query
  select
    inserted_event.id,
    inserted_event.points_awarded,
    false,
    coalesce(current_total, 0);
end;
$$;

grant execute on function public.award_safe_duel_win_points(uuid, uuid, int, int) to authenticated;

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

    insert into public.learning_events (user_id, action_type, target_id, points_awarded)
    values (auth.uid(), 'quiz_complete', target_quiz_id, awarded_points)
    on conflict (user_id, action_type, target_id) do nothing;
  end if;

  return inserted_attempt;
end;
$$;
