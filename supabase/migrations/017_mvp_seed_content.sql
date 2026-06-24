do $$
declare
  v_teacher_id uuid := '00000000-0000-4000-8000-000000000101';
  v_science_teacher_id uuid := '00000000-0000-4000-8000-000000000102';
  v_parent_id uuid := '00000000-0000-4000-8000-000000000201';
  v_student_id uuid := '00000000-0000-4000-8000-000000000301';
  v_admin_id uuid := '00000000-0000-4000-8000-000000000401';
  v_math_area_id int;
  v_science_area_id int;
  v_coding_area_id int;
  v_question_id uuid := '00000000-0000-4000-8000-000000000501';
  v_instance_id uuid := '00000000-0000-0000-0000-000000000000';
begin
  select id into v_math_area_id
  from public.education_areas
  where area_name in ('LGS Matematik', 'YKS Matematik')
  order by case area_name when 'LGS Matematik' then 0 else 1 end
  limit 1;

  select id into v_science_area_id
  from public.education_areas
  where area_name in ('LGS Fen Bilimleri', 'YKS Fizik')
  order by case area_name when 'LGS Fen Bilimleri' then 0 else 1 end
  limit 1;

  select id into v_coding_area_id
  from public.education_areas
  where area_name = 'Kodlama ve Algoritma'
  limit 1;

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    is_anonymous,
    created_at,
    updated_at
  )
  values
    (
      v_teacher_id,
      v_instance_id,
      'authenticated',
      'authenticated',
      'aylin.teacher@zigo.test',
      crypt('ZigoTest123!', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Aylin Kaya","role":"teacher"}'::jsonb,
      false,
      false,
      now(),
      now()
    ),
    (
      v_science_teacher_id,
      v_instance_id,
      'authenticated',
      'authenticated',
      'mert.teacher@zigo.test',
      crypt('ZigoTest123!', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Mert Demir","role":"teacher"}'::jsonb,
      false,
      false,
      now(),
      now()
    ),
    (
      v_parent_id,
      v_instance_id,
      'authenticated',
      'authenticated',
      'parent@zigo.test',
      crypt('ZigoTest123!', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Zigo Parent","role":"parent"}'::jsonb,
      false,
      false,
      now(),
      now()
    ),
    (
      v_student_id,
      v_instance_id,
      'authenticated',
      'authenticated',
      'student@zigo.test',
      crypt('ZigoTest123!', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Zigo Student","role":"student"}'::jsonb,
      false,
      false,
      now(),
      now()
    ),
    (
      v_admin_id,
      v_instance_id,
      'authenticated',
      'authenticated',
      'admin@zigo.test',
      crypt('ZigoTest123!', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Zigo Admin","role":"parent"}'::jsonb,
      false,
      false,
      now(),
      now()
    )
  on conflict (id) do nothing;

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values
    (v_teacher_id, v_teacher_id, v_teacher_id::text, jsonb_build_object('sub', v_teacher_id::text, 'email', 'aylin.teacher@zigo.test'), 'email', now(), now(), now()),
    (v_science_teacher_id, v_science_teacher_id, v_science_teacher_id::text, jsonb_build_object('sub', v_science_teacher_id::text, 'email', 'mert.teacher@zigo.test'), 'email', now(), now(), now()),
    (v_parent_id, v_parent_id, v_parent_id::text, jsonb_build_object('sub', v_parent_id::text, 'email', 'parent@zigo.test'), 'email', now(), now(), now()),
    (v_student_id, v_student_id, v_student_id::text, jsonb_build_object('sub', v_student_id::text, 'email', 'student@zigo.test'), 'email', now(), now(), now()),
    (v_admin_id, v_admin_id, v_admin_id::text, jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@zigo.test'), 'email', now(), now(), now())
  on conflict (id) do nothing;

  update public.users as users
  set
    full_name = seed.full_name,
    role = seed.role::public.user_role,
    is_verified = seed.is_verified,
    total_points = seed.total_points
  from (
    values
      (v_teacher_id, 'Aylin Kaya', 'teacher', true, 0),
      (v_science_teacher_id, 'Mert Demir', 'teacher', true, 0),
      (v_parent_id, 'Zigo Parent', 'parent', false, 0),
      (v_student_id, 'Zigo Student', 'student', false, 120),
      (v_admin_id, 'Zigo Admin', 'parent', false, 0)
  ) as seed(id, full_name, role, is_verified, total_points)
  where users.id = seed.id;

  insert into public.platform_admins (user_id)
  values (v_admin_id)
  on conflict (user_id) do nothing;

  insert into public.user_interests (user_id, area_id)
  select v_teacher_id, v_math_area_id where v_math_area_id is not null
  on conflict do nothing;

  insert into public.user_interests (user_id, area_id)
  select v_science_teacher_id, v_science_area_id where v_science_area_id is not null
  on conflict do nothing;

  insert into public.user_interests (user_id, area_id)
  select v_student_id, v_math_area_id where v_math_area_id is not null
  on conflict do nothing;

  insert into public.user_interests (user_id, area_id)
  select v_student_id, v_coding_area_id where v_coding_area_id is not null
  on conflict do nothing;

  insert into public.user_interests (user_id, area_id)
  select v_parent_id, v_math_area_id where v_math_area_id is not null
  on conflict do nothing;

  insert into public.social_posts (author_id, area_id, caption, media_url, media_type, is_reel)
  select v_teacher_id, v_math_area_id, 'Kesirleri 60 saniyede görselleştir: önce parça, sonra sayı doğrusu, sonra mini pratik.', null, 'video', true
  where v_math_area_id is not null
    and not exists (
      select 1 from public.social_posts as posts
      where posts.author_id = v_teacher_id and posts.caption like 'Kesirleri 60 saniyede%'
    );

  insert into public.social_posts (author_id, area_id, caption, media_url, media_type, is_reel)
  select v_teacher_id, v_math_area_id, 'LGS Matematik icin gunluk 5 dakikalik tekrar rutini: 2 soru, 1 hata analizi, 1 mini hedef.', null, 'image', false
  where v_math_area_id is not null
    and not exists (
      select 1 from public.social_posts as posts
      where posts.author_id = v_teacher_id and posts.caption like 'LGS Matematik icin%'
    );

  insert into public.social_posts (author_id, area_id, caption, media_url, media_type, is_reel)
  select v_science_teacher_id, v_science_area_id, 'Bitkiler isiga neden yonelir? Evde veliyle guvenli pencere deneyi.', null, 'video', true
  where v_science_area_id is not null
    and not exists (
      select 1 from public.social_posts as posts
      where posts.author_id = v_science_teacher_id and posts.caption like 'Bitkiler isiga%'
    );

  insert into public.stories (author_id, media_url, caption)
  select v_teacher_id, null, 'Bugun kesir pratigi: 1 dakika izle, 1 soru coz.'
  where not exists (
    select 1 from public.stories as story_rows
    where story_rows.author_id = v_teacher_id and story_rows.caption = 'Bugun kesir pratigi: 1 dakika izle, 1 soru coz.'
  );

  insert into public.stories (author_id, media_url, caption)
  select v_science_teacher_id, null, 'Fen deneyi yayinlandi. Guvenli sekilde veliyle dene.'
  where not exists (
    select 1 from public.stories as story_rows
    where story_rows.author_id = v_science_teacher_id and story_rows.caption = 'Fen deneyi yayinlandi. Guvenli sekilde veliyle dene.'
  );

  insert into public.questions (id, author_id, area_id, title, description, is_resolved)
  select v_question_id, v_parent_id, v_math_area_id, 'Çocuğum kesirleri nasıl günlük pratik yapabilir?', 'Beş dakikalık, sıkmadan uygulanabilecek bir ev rutini istiyorum.', false
  where v_math_area_id is not null
  on conflict (id) do nothing;

  insert into public.answers (question_id, teacher_id, content, is_approved_by_parent)
  select v_question_id, v_teacher_id, 'Her gün iki görsel kesir sorusu, bir sayı doğrusu eşleştirmesi ve en son bir mini quiz yeterli olur.', true
  where v_math_area_id is not null
    and not exists (
      select 1 from public.answers as existing
      where existing.question_id = v_question_id and existing.teacher_id = v_teacher_id
    );
end $$;
