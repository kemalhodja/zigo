create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null check (char_length(question_text) between 1 and 1000),
  options jsonb not null,
  correct_option int not null check (correct_option >= 0),
  sort_order int not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create index if not exists quiz_questions_quiz_sort_idx
on public.quiz_questions (quiz_id, sort_order);

insert into public.quiz_questions (quiz_id, question_text, options, correct_option, sort_order)
select
  q.id,
  q.question_text,
  q.options,
  q.correct_option,
  0
from public.quizzes q
where not exists (
  select 1
  from public.quiz_questions qq
  where qq.quiz_id = q.id
);

alter table public.quiz_attempts
  add column if not exists total_questions int not null default 1,
  add column if not exists correct_answers int not null default 0,
  add column if not exists score_percent int not null default 0,
  add column if not exists completed_at timestamptz;

alter table public.quiz_attempts
  drop constraint if exists quiz_attempts_score_percent_check;

alter table public.quiz_attempts
  add constraint quiz_attempts_score_percent_check check (
    score_percent >= 0 and score_percent <= 100
  );

alter table public.quiz_attempts
  alter column selected_option drop not null;

update public.quiz_attempts
set
  total_questions = 1,
  correct_answers = case when is_correct then 1 else 0 end,
  score_percent = case when is_correct then 100 else 0 end,
  completed_at = coalesce(completed_at, created_at)
where completed_at is null;

create table if not exists public.quiz_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected_option int not null check (selected_option >= 0),
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists quiz_attempt_answers_attempt_idx
on public.quiz_attempt_answers (attempt_id);

alter table public.quiz_questions enable row level security;
alter table public.quiz_attempt_answers enable row level security;

drop policy if exists "Teachers manage own quiz questions" on public.quiz_questions;

create policy "Teachers manage own quiz questions"
on public.quiz_questions
for all
to authenticated
using (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_questions.quiz_id
      and q.teacher_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.quizzes q
    where q.id = quiz_questions.quiz_id
      and q.teacher_id = auth.uid()
      and public.current_user_is_verified_teacher()
  )
);

drop policy if exists "Students read matched quiz questions" on public.quiz_questions;

create policy "Students read matched quiz questions"
on public.quiz_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.quizzes q
    join public.users teacher on teacher.id = q.teacher_id
    where q.id = quiz_questions.quiz_id
      and q.is_active = true
      and teacher.role = 'teacher'
      and teacher.is_verified = true
      and public.current_user_has_area(q.area_id)
  )
);

drop policy if exists "Parents read child matched quiz questions" on public.quiz_questions;

create policy "Parents read child matched quiz questions"
on public.quiz_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.quizzes q
    join public.child_profile_interests cpi on cpi.area_id = q.area_id
    join public.child_profiles cp on cp.id = cpi.child_profile_id
    where q.id = quiz_questions.quiz_id
      and cp.parent_id = auth.uid()
  )
);

drop policy if exists "Users read own quiz attempt answers" on public.quiz_attempt_answers;

create policy "Users read own quiz attempt answers"
on public.quiz_attempt_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.quiz_attempts qa
    where qa.id = quiz_attempt_answers.attempt_id
      and qa.user_id = auth.uid()
  )
);

drop policy if exists "Parents read child quiz attempt answers" on public.quiz_attempt_answers;

create policy "Parents read child quiz attempt answers"
on public.quiz_attempt_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.quiz_attempts qa
    join public.child_profiles cp on cp.id = qa.child_profile_id
    where qa.id = quiz_attempt_answers.attempt_id
      and cp.parent_id = auth.uid()
  )
);

create or replace function public.sync_quiz_questions_for_quiz(target_quiz_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz_row public.quizzes;
begin
  select * into quiz_row
  from public.quizzes
  where id = target_quiz_id;

  if not found then
    raise exception 'quiz was not found';
  end if;

  if auth.uid() is not null
    and quiz_row.teacher_id <> auth.uid()
    and not public.current_user_is_platform_admin() then
    raise exception 'quiz question sync requires quiz ownership';
  end if;

  if exists (
    select 1
    from public.quiz_questions qq
    where qq.quiz_id = quiz_row.id
  ) then
    return;
  end if;

  insert into public.quiz_questions (
    quiz_id,
    question_text,
    options,
    correct_option,
    sort_order
  )
  values (
    quiz_row.id,
    quiz_row.question_text,
    quiz_row.options,
    quiz_row.correct_option,
    0
  );
end;
$$;

grant execute on function public.sync_quiz_questions_for_quiz(uuid) to authenticated;

drop function if exists public.get_matched_quizzes();
drop function if exists public.get_child_matched_quizzes(uuid);

create or replace function public.get_matched_quizzes()
returns table(
  id uuid,
  area_id int,
  title varchar,
  question_text text,
  options jsonb,
  points_reward int,
  question_count bigint,
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
    coalesce(first_question.question_text, quizzes.question_text) as question_text,
    coalesce(first_question.options, quizzes.options) as options,
    quizzes.points_reward,
    coalesce(question_counts.question_count, 1) as question_count,
    quizzes.created_at
  from public.quizzes
  join public.users teacher on teacher.id = quizzes.teacher_id
  left join lateral (
    select qq.question_text, qq.options
    from public.quiz_questions qq
    where qq.quiz_id = quizzes.id
    order by qq.sort_order, qq.created_at
    limit 1
  ) first_question on true
  left join lateral (
    select count(*)::bigint as question_count
    from public.quiz_questions qq
    where qq.quiz_id = quizzes.id
  ) question_counts on true
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
  question_count bigint,
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
    coalesce(first_question.question_text, quizzes.question_text) as question_text,
    coalesce(first_question.options, quizzes.options) as options,
    quizzes.points_reward,
    coalesce(question_counts.question_count, 1) as question_count,
    quizzes.created_at
  from public.quizzes
  join public.users teacher on teacher.id = quizzes.teacher_id
  join public.child_profile_interests
    on child_profile_interests.area_id = quizzes.area_id
  join public.child_profiles
    on child_profiles.id = child_profile_interests.child_profile_id
  left join lateral (
    select qq.question_text, qq.options
    from public.quiz_questions qq
    where qq.quiz_id = quizzes.id
    order by qq.sort_order, qq.created_at
    limit 1
  ) first_question on true
  left join lateral (
    select count(*)::bigint as question_count
    from public.quiz_questions qq
    where qq.quiz_id = quizzes.id
  ) question_counts on true
  where quizzes.is_active = true
    and teacher.role = 'teacher'
    and teacher.is_verified = true
    and child_profiles.id = target_child_profile_id
    and child_profiles.parent_id = auth.uid()
  order by quizzes.created_at desc
$$;

grant execute on function public.get_child_matched_quizzes(uuid) to authenticated;

create or replace function public.get_quiz_questions_for_play(target_quiz_id uuid)
returns table(
  id uuid,
  question_text text,
  options jsonb,
  sort_order int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    qq.id,
    qq.question_text,
    qq.options,
    qq.sort_order
  from public.quiz_questions qq
  join public.quizzes q on q.id = qq.quiz_id
  join public.users teacher on teacher.id = q.teacher_id
  where q.id = target_quiz_id
    and q.is_active = true
    and teacher.role = 'teacher'
    and teacher.is_verified = true
    and (
      public.current_user_has_area(q.area_id)
      or exists (
        select 1
        from public.child_profiles cp
        join public.child_profile_interests cpi on cpi.child_profile_id = cp.id
        where cp.parent_id = auth.uid()
          and cpi.area_id = q.area_id
      )
    )
  order by qq.sort_order, qq.created_at
$$;

grant execute on function public.get_quiz_questions_for_play(uuid) to authenticated;

create or replace function public.get_parent_child_quiz_activity(
  target_child_profile_id uuid,
  result_limit int default 10
)
returns table(
  attempt_id uuid,
  quiz_id uuid,
  quiz_title varchar,
  total_questions int,
  correct_answers int,
  score_percent int,
  points_awarded int,
  completed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    qa.id as attempt_id,
    qa.quiz_id,
    q.title as quiz_title,
    qa.total_questions,
    qa.correct_answers,
    qa.score_percent,
    qa.points_awarded,
    coalesce(qa.completed_at, qa.created_at) as completed_at
  from public.quiz_attempts qa
  join public.quizzes q on q.id = qa.quiz_id
  join public.child_profiles cp on cp.id = qa.child_profile_id
  where qa.child_profile_id = target_child_profile_id
    and cp.parent_id = auth.uid()
  order by coalesce(qa.completed_at, qa.created_at) desc
  limit greatest(result_limit, 1)
$$;

grant execute on function public.get_parent_child_quiz_activity(uuid, int) to authenticated;

create or replace function public._finalize_quiz_attempt(
  p_quiz public.quizzes,
  p_user_id uuid,
  p_child_profile_id uuid,
  p_total_questions int,
  p_correct_answers int,
  p_first_selected_option int,
  p_answer_rows jsonb
)
returns public.quiz_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_attempt public.quiz_attempts;
  inserted_attempt public.quiz_attempts;
  awarded_points int;
  score int;
  answer_row jsonb;
begin
  if p_child_profile_id is not null then
    select * into existing_attempt
    from public.quiz_attempts
    where quiz_id = p_quiz.id
      and child_profile_id = p_child_profile_id;
  else
    select * into existing_attempt
    from public.quiz_attempts
    where quiz_id = p_quiz.id
      and user_id = p_user_id;
  end if;

  if found then
    return existing_attempt;
  end if;

  score := case
    when p_total_questions = 0 then 0
    else round((p_correct_answers::numeric / p_total_questions::numeric) * 100)
  end;

  awarded_points := round((p_quiz.points_reward::numeric * score) / 100);

  insert into public.quiz_attempts (
    quiz_id,
    user_id,
    child_profile_id,
    selected_option,
    is_correct,
    points_awarded,
    total_questions,
    correct_answers,
    score_percent,
    completed_at
  )
  values (
    p_quiz.id,
    p_user_id,
    p_child_profile_id,
    p_first_selected_option,
    score = 100,
    awarded_points,
    p_total_questions,
    p_correct_answers,
    score,
    now()
  )
  returning * into inserted_attempt;

  for answer_row in select * from jsonb_array_elements(coalesce(p_answer_rows, '[]'::jsonb))
  loop
    insert into public.quiz_attempt_answers (
      attempt_id,
      question_id,
      selected_option,
      is_correct
    )
    values (
      inserted_attempt.id,
      (answer_row ->> 'question_id')::uuid,
      (answer_row ->> 'selected_option')::int,
      (answer_row ->> 'is_correct')::boolean
    );
  end loop;

  if awarded_points > 0 then
    if p_child_profile_id is not null then
      update public.child_profiles
      set total_points = total_points + awarded_points
      where id = p_child_profile_id;
    else
      update public.users
      set total_points = total_points + awarded_points
      where id = p_user_id
        and role = 'student';
    end if;
  end if;

  return inserted_attempt;
end;
$$;

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
  quiz_row public.quizzes;
  question_row public.quiz_questions;
  answer_is_correct boolean;
  answer_payload jsonb;
begin
  if public.current_user_role() <> 'student' then
    raise exception 'only student accounts can submit quiz attempts directly';
  end if;

  select * into quiz_row
  from public.quizzes
  where id = target_quiz_id
    and is_active = true;

  if not found then
    raise exception 'quiz was not found';
  end if;

  if not public.current_user_has_area(quiz_row.area_id) then
    raise exception 'quiz does not match selected education areas';
  end if;

  select * into question_row
  from public.quiz_questions
  where quiz_id = quiz_row.id
  order by sort_order, created_at
  limit 1;

  if not found then
    answer_is_correct := selected_option = quiz_row.correct_option;
    return public._finalize_quiz_attempt(
      quiz_row,
      auth.uid(),
      null,
      1,
      case when answer_is_correct then 1 else 0 end,
      selected_option,
      '[]'::jsonb
    );
  end if;

  answer_is_correct := selected_option = question_row.correct_option;
  answer_payload := jsonb_build_array(
    jsonb_build_object(
      'question_id', question_row.id,
      'selected_option', selected_option,
      'is_correct', answer_is_correct
    )
  );

  return public._finalize_quiz_attempt(
    quiz_row,
    auth.uid(),
    null,
    1,
    case when answer_is_correct then 1 else 0 end,
    selected_option,
    answer_payload
  );
end;
$$;

grant execute on function public.submit_quiz_attempt(uuid, int) to authenticated;

create or replace function public.submit_quiz_attempt_full(
  target_quiz_id uuid,
  answer_payload jsonb
)
returns public.quiz_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz_row public.quizzes;
  question_row public.quiz_questions;
  answer_entry jsonb;
  selected_option int;
  total_count int := 0;
  correct_count int := 0;
  first_selected int := null;
  stored_answers jsonb := '[]'::jsonb;
  answer_is_correct boolean;
begin
  if public.current_user_role() <> 'student' then
    raise exception 'only student accounts can submit quiz attempts directly';
  end if;

  if answer_payload is null or jsonb_typeof(answer_payload) <> 'array' then
    raise exception 'quiz answers payload must be an array';
  end if;

  select * into quiz_row
  from public.quizzes
  where id = target_quiz_id
    and is_active = true;

  if not found then
    raise exception 'quiz was not found';
  end if;

  if not public.current_user_has_area(quiz_row.area_id) then
    raise exception 'quiz does not match selected education areas';
  end if;

  for question_row in
    select *
    from public.quiz_questions
    where quiz_id = quiz_row.id
    order by sort_order, created_at
  loop
    total_count := total_count + 1;

    select entry into answer_entry
    from jsonb_array_elements(answer_payload) entry
    where (entry ->> 'question_id')::uuid = question_row.id
    limit 1;

    if answer_entry is null then
      raise exception 'missing answer for quiz question';
    end if;

    selected_option := (answer_entry ->> 'selected_option')::int;
    answer_is_correct := selected_option = question_row.correct_option;

    if first_selected is null then
      first_selected := selected_option;
    end if;

    if answer_is_correct then
      correct_count := correct_count + 1;
    end if;

    stored_answers := stored_answers || jsonb_build_array(
      jsonb_build_object(
        'question_id', question_row.id,
        'selected_option', selected_option,
        'is_correct', answer_is_correct
      )
    );
  end loop;

  if total_count = 0 then
    raise exception 'quiz has no questions';
  end if;

  return public._finalize_quiz_attempt(
    quiz_row,
    auth.uid(),
    null,
    total_count,
    correct_count,
    first_selected,
    stored_answers
  );
end;
$$;

grant execute on function public.submit_quiz_attempt_full(uuid, jsonb) to authenticated;

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
  quiz_row public.quizzes;
  question_row public.quiz_questions;
  answer_is_correct boolean;
  answer_payload jsonb;
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

  select * into quiz_row
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
      and area_id = quiz_row.area_id
  ) then
    raise exception 'quiz does not match child education areas';
  end if;

  select * into question_row
  from public.quiz_questions
  where quiz_id = quiz_row.id
  order by sort_order, created_at
  limit 1;

  if not found then
    answer_is_correct := selected_option = quiz_row.correct_option;
    return public._finalize_quiz_attempt(
      quiz_row,
      null,
      target_child_profile_id,
      1,
      case when answer_is_correct then 1 else 0 end,
      selected_option,
      '[]'::jsonb
    );
  end if;

  answer_is_correct := selected_option = question_row.correct_option;
  answer_payload := jsonb_build_array(
    jsonb_build_object(
      'question_id', question_row.id,
      'selected_option', selected_option,
      'is_correct', answer_is_correct
    )
  );

  return public._finalize_quiz_attempt(
    quiz_row,
    null,
    target_child_profile_id,
    1,
    case when answer_is_correct then 1 else 0 end,
    selected_option,
    answer_payload
  );
end;
$$;

grant execute on function public.submit_child_quiz_attempt(uuid, uuid, int) to authenticated;

create or replace function public.submit_child_quiz_attempt_full(
  target_child_profile_id uuid,
  target_quiz_id uuid,
  answer_payload jsonb
)
returns public.quiz_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz_row public.quizzes;
  question_row public.quiz_questions;
  answer_entry jsonb;
  selected_option int;
  total_count int := 0;
  correct_count int := 0;
  first_selected int := null;
  stored_answers jsonb := '[]'::jsonb;
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

  if answer_payload is null or jsonb_typeof(answer_payload) <> 'array' then
    raise exception 'quiz answers payload must be an array';
  end if;

  select * into quiz_row
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
      and area_id = quiz_row.area_id
  ) then
    raise exception 'quiz does not match child education areas';
  end if;

  for question_row in
    select *
    from public.quiz_questions
    where quiz_id = quiz_row.id
    order by sort_order, created_at
  loop
    total_count := total_count + 1;

    select entry into answer_entry
    from jsonb_array_elements(answer_payload) entry
    where (entry ->> 'question_id')::uuid = question_row.id
    limit 1;

    if answer_entry is null then
      raise exception 'missing answer for quiz question';
    end if;

    selected_option := (answer_entry ->> 'selected_option')::int;
    answer_is_correct := selected_option = question_row.correct_option;

    if first_selected is null then
      first_selected := selected_option;
    end if;

    if answer_is_correct then
      correct_count := correct_count + 1;
    end if;

    stored_answers := stored_answers || jsonb_build_array(
      jsonb_build_object(
        'question_id', question_row.id,
        'selected_option', selected_option,
        'is_correct', answer_is_correct
      )
    );
  end loop;

  if total_count = 0 then
    raise exception 'quiz has no questions';
  end if;

  return public._finalize_quiz_attempt(
    quiz_row,
    null,
    target_child_profile_id,
    total_count,
    correct_count,
    first_selected,
    stored_answers
  );
end;
$$;

grant execute on function public.submit_child_quiz_attempt_full(uuid, uuid, jsonb) to authenticated;

create or replace function public.enforce_content_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_TABLE_NAME = 'social_posts' then
    perform public.assert_content_text_safe(NEW.caption);
    perform public.assert_content_text_safe(NEW.title);
    perform public.assert_content_text_safe(NEW.content);
  elsif TG_TABLE_NAME = 'post_comments' then
    perform public.assert_content_text_safe(NEW.content);
  elsif TG_TABLE_NAME = 'story_replies' then
    perform public.assert_content_text_safe(NEW.content);
  elsif TG_TABLE_NAME = 'stories' then
    perform public.assert_content_text_safe(NEW.caption);
  elsif TG_TABLE_NAME = 'questions' then
    perform public.assert_content_text_safe(NEW.title);
    perform public.assert_content_text_safe(NEW.description);
  elsif TG_TABLE_NAME = 'answers' then
    perform public.assert_content_text_safe(NEW.content);
  elsif TG_TABLE_NAME = 'quizzes' then
    perform public.assert_content_text_safe(NEW.title);
    perform public.assert_content_text_safe(NEW.question_text);
  elsif TG_TABLE_NAME = 'quiz_questions' then
    perform public.assert_content_text_safe(NEW.question_text);
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_quizzes_moderation on public.quizzes;

create trigger trg_quizzes_moderation
before insert or update of title, question_text on public.quizzes
for each row execute function public.enforce_content_moderation();

drop trigger if exists trg_quiz_questions_moderation on public.quiz_questions;

create trigger trg_quiz_questions_moderation
before insert or update of question_text on public.quiz_questions
for each row execute function public.enforce_content_moderation();
