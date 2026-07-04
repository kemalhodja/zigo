create extension if not exists pgcrypto;

do $$
begin
  create type public.user_role as enum ('teacher', 'parent', 'student');
exception
  when duplicate_object then null;
end $$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar(255) unique not null,
  full_name varchar(100) not null,
  role public.user_role not null,
  is_verified boolean not null default false,
  avatar_assets jsonb not null default '{"hat": null, "suit": null, "pet": null}'::jsonb,
  total_points int not null default 0 check (total_points >= 0),
  created_at timestamptz not null default now()
);

create table public.education_areas (
  id serial primary key,
  area_name varchar(100) unique not null,
  age_group varchar(50)
);

create table public.user_interests (
  user_id uuid not null references public.users(id) on delete cascade,
  area_id int not null references public.education_areas(id) on delete cascade,
  primary key (user_id, area_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  title varchar(255),
  content text,
  media_url varchar(255),
  area_id int not null references public.education_areas(id),
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  area_id int not null references public.education_areas(id),
  title varchar(255) not null,
  description text not null,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  is_approved_by_parent boolean not null default false,
  created_at timestamptz not null default now()
);

create index posts_area_id_created_at_idx on public.posts (area_id, created_at desc);
create index questions_area_id_created_at_idx on public.questions (area_id, created_at desc);
create index answers_question_id_created_at_idx on public.answers (question_id, created_at desc);

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.current_user_is_verified_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'teacher'
      and is_verified = true
  )
$$;

create or replace function public.current_user_has_area(target_area_id int)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_interests
    where user_id = auth.uid()
      and area_id = target_area_id
  )
$$;

alter table public.users enable row level security;
alter table public.education_areas enable row level security;
alter table public.user_interests enable row level security;
alter table public.posts enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;

create policy "Users can read own profile and verified teachers"
on public.users
for select
to authenticated
using (
  id = auth.uid()
  or (role = 'teacher' and is_verified = true)
);

create policy "Users can create own profile"
on public.users
for insert
to authenticated
with check (
  id = auth.uid()
  and is_verified = false
  and total_points = 0
);

create policy "Education areas are readable"
on public.education_areas
for select
to authenticated
using (true);

create policy "Users can read own interests"
on public.user_interests
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can select own areas"
on public.user_interests
for insert
to authenticated
with check (
  user_id = auth.uid()
);

create policy "Users can remove own areas"
on public.user_interests
for delete
to authenticated
using (
  user_id = auth.uid()
);

create policy "Users can read matched verified posts"
on public.posts
for select
to authenticated
using (
  public.current_user_has_area(area_id)
  and exists (
    select 1
    from public.users teacher
    where teacher.id = posts.teacher_id
      and teacher.role = 'teacher'
      and teacher.is_verified = true
  )
);

create policy "Verified teachers can create area posts"
on public.posts
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and public.current_user_is_verified_teacher()
  and public.current_user_has_area(area_id)
);

create policy "Verified teachers can update own posts"
on public.posts
for update
to authenticated
using (teacher_id = auth.uid())
with check (
  teacher_id = auth.uid()
  and public.current_user_is_verified_teacher()
  and public.current_user_has_area(area_id)
);

create policy "Verified teachers can delete own posts"
on public.posts
for delete
to authenticated
using (
  teacher_id = auth.uid()
  and public.current_user_is_verified_teacher()
);

create policy "Users can read matched questions"
on public.questions
for select
to authenticated
using (
  author_id = auth.uid()
  or public.current_user_has_area(area_id)
);

create policy "Parents and students can ask area questions"
on public.questions
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.current_user_role() in ('parent', 'student')
  and public.current_user_has_area(area_id)
);

create policy "Question authors can update own questions"
on public.questions
for update
to authenticated
using (author_id = auth.uid())
with check (
  author_id = auth.uid()
  and public.current_user_role() in ('parent', 'student')
);

create policy "Users can read matched answers"
on public.answers
for select
to authenticated
using (
  teacher_id = auth.uid()
  or exists (
    select 1
    from public.questions
    where questions.id = answers.question_id
      and (
        questions.author_id = auth.uid()
        or public.current_user_has_area(questions.area_id)
      )
  )
);

create policy "Teachers can answer assigned area questions"
on public.answers
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and public.current_user_role() = 'teacher'
  and exists (
    select 1
    from public.questions
    where questions.id = answers.question_id
      and public.current_user_has_area(questions.area_id)
  )
);

create policy "Teachers can update own answers"
on public.answers
for update
to authenticated
using (teacher_id = auth.uid())
with check (
  teacher_id = auth.uid()
  and public.current_user_role() = 'teacher'
);

create or replace function public.approve_answer(answer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.answers
  set is_approved_by_parent = true
  from public.questions
  where answers.id = answer_id
    and questions.id = answers.question_id
    and questions.author_id = auth.uid()
    and public.current_user_role() = 'parent';

  if not found then
    raise exception 'answer approval is not allowed for this user';
  end if;
end;
$$;

grant execute on function public.approve_answer(uuid) to authenticated;

create or replace function public.award_learning_points(
  student_id uuid,
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
  if student_id <> auth.uid() then
    raise exception 'students can only earn points for their own profile';
  end if;

  if public.current_user_role() <> 'student' then
    raise exception 'only students can earn learning points';
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

  update public.users
  set total_points = total_points + points_to_add
  where users.id = student_id
    and users.role = 'student'
  returning users.id, users.total_points into id, total_points;

  if not found then
    raise exception 'student profile was not found';
  end if;

  return next;
end;
$$;

grant execute on function public.award_learning_points(uuid, text) to authenticated;

create or replace function public.update_avatar_assets(
  student_id uuid,
  assets jsonb
)
returns table(id uuid, avatar_assets jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  if student_id <> auth.uid() then
    raise exception 'students can only customize their own avatar';
  end if;

  if public.current_user_role() <> 'student' then
    raise exception 'only students can customize avatars';
  end if;

  update public.users
  set avatar_assets = users.avatar_assets || assets
  where users.id = student_id
    and users.role = 'student'
  returning users.id, users.avatar_assets into id, avatar_assets;

  if not found then
    raise exception 'student profile was not found';
  end if;

  return next;
end;
$$;

grant execute on function public.update_avatar_assets(uuid, jsonb) to authenticated;

create or replace function public.create_profile(
  full_name text,
  profile_role public.user_role
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_profile public.users;
  auth_email text;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  if exists (select 1 from public.users where id = auth.uid()) then
    raise exception 'profile already exists';
  end if;

  auth_email := coalesce(auth.jwt() ->> 'email', '');

  if length(trim(auth_email)) = 0 then
    raise exception 'authenticated email is required';
  end if;

  insert into public.users (
    id,
    email,
    full_name,
    role,
    is_verified,
    total_points
  )
  values (
    auth.uid(),
    auth_email,
    trim(full_name),
    profile_role,
    false,
    0
  )
  returning * into inserted_profile;

  return inserted_profile;
end;
$$;

grant execute on function public.create_profile(text, public.user_role) to authenticated;

create or replace function public.set_user_interests(area_ids int[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  if not exists (select 1 from public.users where id = auth.uid()) then
    raise exception 'profile is required before selecting areas';
  end if;

  delete from public.user_interests
  where user_id = auth.uid();

  insert into public.user_interests (user_id, area_id)
  select auth.uid(), education_areas.id
  from public.education_areas
  where education_areas.id = any(area_ids)
  on conflict do nothing;
end;
$$;

grant execute on function public.set_user_interests(int[]) to authenticated;
