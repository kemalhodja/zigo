-- Migration: 124_snap_and_solve_qa.sql
-- Snap & Solve: Fotoğraflı Soru Sorma ve Videolu/Sesli Çözüm Desteği

-- 1. questions tablosuna medya sütunları ekle
alter table public.questions
  add column if not exists image_url text,
  add column if not exists grade_level text,
  add column if not exists subject text;

-- 2. answers tablosuna medya sütunları (video_url, audio_url) ekle
alter table public.answers
  add column if not exists video_url text,
  add column if not exists audio_url text,
  add column if not exists media_duration_sec int;

-- 3. İndeksler
create index if not exists idx_questions_author_created on public.questions (author_id, created_at desc);
create index if not exists idx_questions_unresolved on public.questions (area_id, is_resolved) where is_resolved = false;
create index if not exists idx_answers_question_created on public.answers (question_id, created_at desc);

-- 4. RPC: get_snap_questions (aktif çözülmemiş ve yeni gelen sorular)
create or replace function public.get_snap_questions(
  p_area_id   int default null,
  p_limit     int default 30
)
returns table (
  id          uuid,
  author_id   uuid,
  author_name text,
  author_avatar text,
  area_id     int,
  title       text,
  description text,
  image_url   text,
  is_resolved bool,
  created_at  timestamptz,
  answer_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    q.id,
    q.author_id,
    u.full_name as author_name,
    u.avatar_url as author_avatar,
    q.area_id,
    q.title,
    q.description,
    q.image_url,
    q.is_resolved,
    q.created_at,
    (select count(*) from public.answers a where a.question_id = q.id) as answer_count
  from public.questions q
  join public.users u on u.id = q.author_id
  where (p_area_id is null or q.area_id = p_area_id)
  order by q.is_resolved asc, q.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- 5. RPC: get_question_with_answers
create or replace function public.get_question_with_answers(p_question_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_question json;
  v_answers  json;
begin
  select row_to_json(q_row) into v_question
  from (
    select
      q.id,
      q.author_id,
      u.full_name as author_name,
      u.avatar_url as author_avatar,
      q.area_id,
      q.title,
      q.description,
      q.image_url,
      q.is_resolved,
      q.created_at
    from public.questions q
    join public.users u on u.id = q.author_id
    where q.id = p_question_id
  ) q_row;

  select coalesce(json_agg(row_to_json(a_row)), '[]'::json) into v_answers
  from (
    select
      a.id,
      a.question_id,
      a.teacher_id,
      u.full_name as teacher_name,
      u.avatar_url as teacher_avatar,
      u.is_verified as teacher_verified,
      a.content,
      a.video_url,
      a.audio_url,
      a.media_duration_sec,
      a.is_approved_by_parent,
      a.created_at
    from public.answers a
    join public.users u on u.id = a.teacher_id
    where a.question_id = p_question_id
    order by a.created_at asc
  ) a_row;

  return json_build_object(
    'question', v_question,
    'answers', v_answers
  );
end;
$$;

grant execute on function public.get_snap_questions(int, int) to authenticated;
grant execute on function public.get_question_with_answers(uuid) to authenticated;

notify pgrst, 'reload schema';
