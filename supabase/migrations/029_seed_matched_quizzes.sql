-- Seed verified-teacher quizzes aligned to demo Match-Feed areas for /learn QA.

do $$
declare
  v_math_teacher_id uuid := '00000000-0000-4000-8000-000000000101';
  v_science_teacher_id uuid := '00000000-0000-4000-8000-000000000102';
  v_math_quiz_id uuid := '00000000-0000-4000-8000-000000000701';
  v_science_quiz_id uuid := '00000000-0000-4000-8000-000000000702';
  v_coding_quiz_id uuid := '00000000-0000-4000-8000-000000000703';
  v_math_area_id int;
  v_science_area_id int;
  v_coding_area_id int;
begin
  select id into v_math_area_id
  from public.education_areas
  where area_name = 'LGS Matematik'
  limit 1;

  select id into v_science_area_id
  from public.education_areas
  where area_name = 'LGS Fen Bilimleri'
  limit 1;

  select id into v_coding_area_id
  from public.education_areas
  where area_name = 'Kodlama ve Algoritma'
  limit 1;

  insert into public.user_interests (user_id, area_id)
  select v_math_teacher_id, v_coding_area_id
  where v_coding_area_id is not null
  on conflict do nothing;

  insert into public.quizzes (
    id,
    teacher_id,
    area_id,
    title,
    question_text,
    options,
    correct_option,
    points_reward,
    is_active
  )
  values (
    v_math_quiz_id,
    v_math_teacher_id,
    v_math_area_id,
    'Kesir karsilastirma',
    '3/4 ile 5/8 kesirlerinden hangisi daha buyuktur?',
    '["3/4", "5/8", "Esit", "Karsilastirilamaz"]'::jsonb,
    0,
    10,
    true
  )
  on conflict (id) do update
  set
    teacher_id = excluded.teacher_id,
    area_id = excluded.area_id,
    title = excluded.title,
    question_text = excluded.question_text,
    options = excluded.options,
    correct_option = excluded.correct_option,
    points_reward = excluded.points_reward,
    is_active = excluded.is_active;

  insert into public.quizzes (
    id,
    teacher_id,
    area_id,
    title,
    question_text,
    options,
    correct_option,
    points_reward,
    is_active
  )
  select
    v_science_quiz_id,
    v_science_teacher_id,
    v_science_area_id,
    'Fotosentez temeli',
    'Bitkiler gunes isigini hangi maddeye donusturur?',
    '["Oksijen ve glikoz", "Sadece su", "Sadece karbondioksit", "Azot"]'::jsonb,
    0,
    10,
    true
  where v_science_area_id is not null
  on conflict (id) do update
  set
    teacher_id = excluded.teacher_id,
    area_id = excluded.area_id,
    title = excluded.title,
    question_text = excluded.question_text,
    options = excluded.options,
    correct_option = excluded.correct_option,
    points_reward = excluded.points_reward,
    is_active = excluded.is_active;

  insert into public.quizzes (
    id,
    teacher_id,
    area_id,
    title,
    question_text,
    options,
    correct_option,
    points_reward,
    is_active
  )
  select
    v_coding_quiz_id,
    v_math_teacher_id,
    v_coding_area_id,
    'Dongu mantigi',
    'Bir for dongusu en cok hangi is icin kullanilir?',
    '["Tekrarlayan adimlar", "Sadece yazdirma", "Dosya silme", "Renk secme"]'::jsonb,
    0,
    10,
    true
  where v_coding_area_id is not null
  on conflict (id) do update
  set
    teacher_id = excluded.teacher_id,
    area_id = excluded.area_id,
    title = excluded.title,
    question_text = excluded.question_text,
    options = excluded.options,
    correct_option = excluded.correct_option,
    points_reward = excluded.points_reward,
    is_active = excluded.is_active;
end;
$$;
