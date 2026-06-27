-- Professional portfolio layer: badge, availability, video intro, soft skills, flexible details JSON.

do $$ begin
  create type public.professional_badge_type as enum ('gold', 'platinum', 'verified');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.profile_availability_status as enum ('available', 'busy', 'scheduled');
exception when duplicate_object then null;
end $$;

alter table public.teacher_profile_extras
  add column if not exists badge_type public.professional_badge_type,
  add column if not exists video_intro_url text check (video_intro_url is null or char_length(trim(video_intro_url)) <= 500),
  add column if not exists soft_skills text[] not null default '{}',
  add column if not exists availability_status public.profile_availability_status default 'available',
  add column if not exists availability_note text check (availability_note is null or char_length(trim(availability_note)) <= 120),
  add column if not exists details jsonb not null default '{}'::jsonb;

alter table public.institution_profile_extras
  add column if not exists badge_type public.professional_badge_type,
  add column if not exists video_intro_url text check (video_intro_url is null or char_length(trim(video_intro_url)) <= 500),
  add column if not exists soft_skills text[] not null default '{}',
  add column if not exists availability_status public.profile_availability_status default 'available',
  add column if not exists availability_note text check (availability_note is null or char_length(trim(availability_note)) <= 120),
  add column if not exists details jsonb not null default '{}'::jsonb;

alter table public.education_platform_profile_extras
  add column if not exists badge_type public.professional_badge_type,
  add column if not exists video_intro_url text check (video_intro_url is null or char_length(trim(video_intro_url)) <= 500),
  add column if not exists soft_skills text[] not null default '{}',
  add column if not exists availability_status public.profile_availability_status default 'available',
  add column if not exists availability_note text check (availability_note is null or char_length(trim(availability_note)) <= 120),
  add column if not exists details jsonb not null default '{}'::jsonb;

create or replace function public.get_teacher_completed_lesson_count(target_teacher_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.lesson_bookings
  where teacher_id = target_teacher_id
    and status = 'completed';
$$;

grant execute on function public.get_teacher_completed_lesson_count(uuid) to authenticated, anon;

create or replace function public.upsert_teacher_profile_extras(
  next_cv_url text default null,
  next_years_of_experience int default null,
  next_education_degree public.education_degree_type default null,
  next_teaching_style public.teaching_style_type default null,
  next_hourly_rate numeric default null,
  next_response_time_minutes int default null,
  next_lesson_acceptance_rate_percent int default null,
  next_contact_summary text default null,
  next_badge_type public.professional_badge_type default null,
  next_video_intro_url text default null,
  next_soft_skills text[] default null,
  next_availability_status public.profile_availability_status default null,
  next_availability_note text default null,
  next_details jsonb default null
)
returns public.teacher_profile_extras
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.users;
  row public.teacher_profile_extras;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  select * into actor from public.users where id = auth.uid();
  if actor.role <> 'teacher' or actor.organization_type is not null then
    raise exception 'only individual teachers can update teacher profile extras';
  end if;

  insert into public.teacher_profile_extras (
    user_id, cv_url, years_of_experience, education_degree, teaching_style,
    hourly_rate, response_time_minutes, lesson_acceptance_rate_percent, contact_summary,
    badge_type, video_intro_url, soft_skills, availability_status, availability_note, details
  )
  values (
    auth.uid(),
    nullif(left(trim(coalesce(next_cv_url, '')), 500), ''),
    coalesce(next_years_of_experience, 0),
    next_education_degree, next_teaching_style, next_hourly_rate,
    next_response_time_minutes, next_lesson_acceptance_rate_percent,
    nullif(left(trim(coalesce(next_contact_summary, '')), 200), ''),
    next_badge_type,
    nullif(left(trim(coalesce(next_video_intro_url, '')), 500), ''),
    coalesce(next_soft_skills, '{}'),
    coalesce(next_availability_status, 'available'),
    nullif(left(trim(coalesce(next_availability_note, '')), 120), ''),
    coalesce(next_details, '{}'::jsonb)
  )
  on conflict (user_id) do update set
    cv_url = coalesce(excluded.cv_url, teacher_profile_extras.cv_url),
    years_of_experience = coalesce(excluded.years_of_experience, teacher_profile_extras.years_of_experience),
    education_degree = coalesce(excluded.education_degree, teacher_profile_extras.education_degree),
    teaching_style = coalesce(excluded.teaching_style, teacher_profile_extras.teaching_style),
    hourly_rate = coalesce(excluded.hourly_rate, teacher_profile_extras.hourly_rate),
    response_time_minutes = coalesce(excluded.response_time_minutes, teacher_profile_extras.response_time_minutes),
    lesson_acceptance_rate_percent = coalesce(excluded.lesson_acceptance_rate_percent, teacher_profile_extras.lesson_acceptance_rate_percent),
    contact_summary = coalesce(excluded.contact_summary, teacher_profile_extras.contact_summary),
    badge_type = coalesce(excluded.badge_type, teacher_profile_extras.badge_type),
    video_intro_url = coalesce(excluded.video_intro_url, teacher_profile_extras.video_intro_url),
    soft_skills = coalesce(excluded.soft_skills, teacher_profile_extras.soft_skills),
    availability_status = coalesce(excluded.availability_status, teacher_profile_extras.availability_status),
    availability_note = coalesce(excluded.availability_note, teacher_profile_extras.availability_note),
    details = coalesce(excluded.details, teacher_profile_extras.details),
    updated_at = now()
  returning * into row;

  return row;
end;
$$;

create or replace function public.upsert_institution_profile_extras(
  next_license_number text,
  next_capacity int default null,
  next_branch_count int default null,
  next_accreditation text[] default null,
  next_services text[] default null,
  next_response_time_minutes int default null,
  next_contact_summary text default null,
  next_badge_type public.professional_badge_type default null,
  next_video_intro_url text default null,
  next_soft_skills text[] default null,
  next_availability_status public.profile_availability_status default null,
  next_availability_note text default null,
  next_details jsonb default null
)
returns public.institution_profile_extras
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.users;
  row public.institution_profile_extras;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  select * into actor from public.users where id = auth.uid();
  if actor.role <> 'teacher' or actor.organization_type is null
     or actor.organization_type = 'egitim_platformu' then
    raise exception 'only institution accounts can update institution profile extras';
  end if;

  if char_length(trim(next_license_number)) < 4 then
    raise exception 'MEB license number is required';
  end if;

  insert into public.institution_profile_extras (
    user_id, license_number, capacity, branch_count, accreditation, services,
    response_time_minutes, contact_summary,
    badge_type, video_intro_url, soft_skills, availability_status, availability_note, details
  )
  values (
    auth.uid(), left(trim(next_license_number), 64),
    coalesce(next_capacity, 50), coalesce(next_branch_count, 1),
    coalesce(next_accreditation, '{}'), coalesce(next_services, '{}'),
    next_response_time_minutes,
    nullif(left(trim(coalesce(next_contact_summary, '')), 200), ''),
    next_badge_type,
    nullif(left(trim(coalesce(next_video_intro_url, '')), 500), ''),
    coalesce(next_soft_skills, '{}'),
    coalesce(next_availability_status, 'available'),
    nullif(left(trim(coalesce(next_availability_note, '')), 120), ''),
    coalesce(next_details, '{}'::jsonb)
  )
  on conflict (user_id) do update set
    license_number = excluded.license_number,
    capacity = coalesce(excluded.capacity, institution_profile_extras.capacity),
    branch_count = coalesce(excluded.branch_count, institution_profile_extras.branch_count),
    accreditation = coalesce(excluded.accreditation, institution_profile_extras.accreditation),
    services = coalesce(excluded.services, institution_profile_extras.services),
    response_time_minutes = coalesce(excluded.response_time_minutes, institution_profile_extras.response_time_minutes),
    contact_summary = coalesce(excluded.contact_summary, institution_profile_extras.contact_summary),
    badge_type = coalesce(excluded.badge_type, institution_profile_extras.badge_type),
    video_intro_url = coalesce(excluded.video_intro_url, institution_profile_extras.video_intro_url),
    soft_skills = coalesce(excluded.soft_skills, institution_profile_extras.soft_skills),
    availability_status = coalesce(excluded.availability_status, institution_profile_extras.availability_status),
    availability_note = coalesce(excluded.availability_note, institution_profile_extras.availability_note),
    details = coalesce(excluded.details, institution_profile_extras.details),
    updated_at = now()
  returning * into row;

  return row;
end;
$$;

create or replace function public.upsert_education_platform_profile_extras(
  next_content_count int default null,
  next_user_base_size int default null,
  next_subscription_model text default null,
  next_integration_docs_url text default null,
  next_response_time_minutes int default null,
  next_contact_summary text default null,
  next_badge_type public.professional_badge_type default null,
  next_video_intro_url text default null,
  next_soft_skills text[] default null,
  next_availability_status public.profile_availability_status default null,
  next_availability_note text default null,
  next_details jsonb default null
)
returns public.education_platform_profile_extras
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.users;
  row public.education_platform_profile_extras;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  select * into actor from public.users where id = auth.uid();
  if actor.role <> 'teacher' or actor.organization_type <> 'egitim_platformu' then
    raise exception 'only education platform accounts can update platform profile extras';
  end if;

  insert into public.education_platform_profile_extras (
    user_id, content_count, user_base_size, subscription_model, integration_docs_url,
    response_time_minutes, contact_summary,
    badge_type, video_intro_url, soft_skills, availability_status, availability_note, details
  )
  values (
    auth.uid(),
    coalesce(next_content_count, 0), coalesce(next_user_base_size, 0),
    coalesce(nullif(left(trim(coalesce(next_subscription_model, '')), 120), ''), 'freemium'),
    nullif(left(trim(coalesce(next_integration_docs_url, '')), 500), ''),
    next_response_time_minutes,
    nullif(left(trim(coalesce(next_contact_summary, '')), 200), ''),
    next_badge_type,
    nullif(left(trim(coalesce(next_video_intro_url, '')), 500), ''),
    coalesce(next_soft_skills, '{}'),
    coalesce(next_availability_status, 'available'),
    nullif(left(trim(coalesce(next_availability_note, '')), 120), ''),
    coalesce(next_details, '{}'::jsonb)
  )
  on conflict (user_id) do update set
    content_count = coalesce(excluded.content_count, education_platform_profile_extras.content_count),
    user_base_size = coalesce(excluded.user_base_size, education_platform_profile_extras.user_base_size),
    subscription_model = coalesce(excluded.subscription_model, education_platform_profile_extras.subscription_model),
    integration_docs_url = coalesce(excluded.integration_docs_url, education_platform_profile_extras.integration_docs_url),
    response_time_minutes = coalesce(excluded.response_time_minutes, education_platform_profile_extras.response_time_minutes),
    contact_summary = coalesce(excluded.contact_summary, education_platform_profile_extras.contact_summary),
    badge_type = coalesce(excluded.badge_type, education_platform_profile_extras.badge_type),
    video_intro_url = coalesce(excluded.video_intro_url, education_platform_profile_extras.video_intro_url),
    soft_skills = coalesce(excluded.soft_skills, education_platform_profile_extras.soft_skills),
    availability_status = coalesce(excluded.availability_status, education_platform_profile_extras.availability_status),
    availability_note = coalesce(excluded.availability_note, education_platform_profile_extras.availability_note),
    details = coalesce(excluded.details, education_platform_profile_extras.details),
    updated_at = now()
  returning * into row;

  return row;
end;
$$;

grant execute on function public.upsert_teacher_profile_extras(
  text, int, public.education_degree_type, public.teaching_style_type, numeric, int, int, text,
  public.professional_badge_type, text, text[], public.profile_availability_status, text, jsonb
) to authenticated;

grant execute on function public.upsert_institution_profile_extras(
  text, int, int, text[], text[], int, text,
  public.professional_badge_type, text, text[], public.profile_availability_status, text, jsonb
) to authenticated;

grant execute on function public.upsert_education_platform_profile_extras(
  int, int, text, text, int, text,
  public.professional_badge_type, text, text[], public.profile_availability_status, text, jsonb
) to authenticated;
