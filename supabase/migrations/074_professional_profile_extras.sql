-- Professional identity extras: individual teachers, institutions, education platforms.

do $$ begin
  create type public.education_degree_type as enum ('lisans', 'yuksek_lisans', 'doktora');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.teaching_style_type as enum ('visual', 'practical', 'theory');
exception when duplicate_object then null;
end $$;

create table if not exists public.teacher_profile_extras (
  user_id uuid primary key references public.users(id) on delete cascade,
  cv_url text check (cv_url is null or char_length(trim(cv_url)) <= 500),
  years_of_experience int not null default 0 check (years_of_experience >= 0 and years_of_experience <= 60),
  education_degree public.education_degree_type,
  teaching_style public.teaching_style_type,
  hourly_rate numeric(10, 2) check (hourly_rate is null or hourly_rate >= 0),
  response_time_minutes int check (response_time_minutes is null or (response_time_minutes > 0 and response_time_minutes <= 1440)),
  lesson_acceptance_rate_percent int check (
    lesson_acceptance_rate_percent is null
    or (lesson_acceptance_rate_percent >= 0 and lesson_acceptance_rate_percent <= 100)
  ),
  contact_summary text check (contact_summary is null or char_length(trim(contact_summary)) <= 200),
  updated_at timestamptz not null default now()
);

create table if not exists public.institution_profile_extras (
  user_id uuid primary key references public.users(id) on delete cascade,
  license_number varchar(64) not null check (char_length(trim(license_number)) >= 4),
  capacity int not null default 50 check (capacity > 0 and capacity <= 100000),
  branch_count int not null default 1 check (branch_count >= 1 and branch_count <= 500),
  accreditation text[] not null default '{}',
  services text[] not null default '{}',
  response_time_minutes int check (response_time_minutes is null or (response_time_minutes > 0 and response_time_minutes <= 1440)),
  contact_summary text check (contact_summary is null or char_length(trim(contact_summary)) <= 200),
  updated_at timestamptz not null default now()
);

create table if not exists public.education_platform_profile_extras (
  user_id uuid primary key references public.users(id) on delete cascade,
  content_count int not null default 0 check (content_count >= 0),
  user_base_size int not null default 0 check (user_base_size >= 0),
  subscription_model varchar(120) not null default 'freemium' check (char_length(trim(subscription_model)) >= 2),
  integration_docs_url text check (integration_docs_url is null or char_length(trim(integration_docs_url)) <= 500),
  response_time_minutes int check (response_time_minutes is null or (response_time_minutes > 0 and response_time_minutes <= 1440)),
  contact_summary text check (contact_summary is null or char_length(trim(contact_summary)) <= 200),
  updated_at timestamptz not null default now()
);

create index if not exists teacher_profile_extras_experience_idx
  on public.teacher_profile_extras (years_of_experience desc, education_degree);

create index if not exists institution_profile_extras_license_idx
  on public.institution_profile_extras (license_number);

-- Upsert teacher extras (individual teachers only).
create or replace function public.upsert_teacher_profile_extras(
  next_cv_url text default null,
  next_years_of_experience int default null,
  next_education_degree public.education_degree_type default null,
  next_teaching_style public.teaching_style_type default null,
  next_hourly_rate numeric default null,
  next_response_time_minutes int default null,
  next_lesson_acceptance_rate_percent int default null,
  next_contact_summary text default null
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
  if not found then
    raise exception 'profile was not found';
  end if;

  if actor.role <> 'teacher' or actor.organization_type is not null then
    raise exception 'only individual teachers can update teacher profile extras';
  end if;

  insert into public.teacher_profile_extras (
    user_id,
    cv_url,
    years_of_experience,
    education_degree,
    teaching_style,
    hourly_rate,
    response_time_minutes,
    lesson_acceptance_rate_percent,
    contact_summary
  )
  values (
    auth.uid(),
    nullif(left(trim(coalesce(next_cv_url, '')), 500), ''),
    coalesce(next_years_of_experience, 0),
    next_education_degree,
    next_teaching_style,
    next_hourly_rate,
    next_response_time_minutes,
    next_lesson_acceptance_rate_percent,
    nullif(left(trim(coalesce(next_contact_summary, '')), 200), '')
  )
  on conflict (user_id) do update set
    cv_url = coalesce(excluded.cv_url, teacher_profile_extras.cv_url),
    years_of_experience = coalesce(excluded.years_of_experience, teacher_profile_extras.years_of_experience),
    education_degree = coalesce(excluded.education_degree, teacher_profile_extras.education_degree),
    teaching_style = coalesce(excluded.teaching_style, teacher_profile_extras.teaching_style),
    hourly_rate = coalesce(excluded.hourly_rate, teacher_profile_extras.hourly_rate),
    response_time_minutes = coalesce(excluded.response_time_minutes, teacher_profile_extras.response_time_minutes),
    lesson_acceptance_rate_percent = coalesce(
      excluded.lesson_acceptance_rate_percent,
      teacher_profile_extras.lesson_acceptance_rate_percent
    ),
    contact_summary = coalesce(excluded.contact_summary, teacher_profile_extras.contact_summary),
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
  next_contact_summary text default null
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
    user_id,
    license_number,
    capacity,
    branch_count,
    accreditation,
    services,
    response_time_minutes,
    contact_summary
  )
  values (
    auth.uid(),
    left(trim(next_license_number), 64),
    coalesce(next_capacity, 50),
    coalesce(next_branch_count, 1),
    coalesce(next_accreditation, '{}'),
    coalesce(next_services, '{}'),
    next_response_time_minutes,
    nullif(left(trim(coalesce(next_contact_summary, '')), 200), '')
  )
  on conflict (user_id) do update set
    license_number = excluded.license_number,
    capacity = coalesce(excluded.capacity, institution_profile_extras.capacity),
    branch_count = coalesce(excluded.branch_count, institution_profile_extras.branch_count),
    accreditation = coalesce(excluded.accreditation, institution_profile_extras.accreditation),
    services = coalesce(excluded.services, institution_profile_extras.services),
    response_time_minutes = coalesce(excluded.response_time_minutes, institution_profile_extras.response_time_minutes),
    contact_summary = coalesce(excluded.contact_summary, institution_profile_extras.contact_summary),
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
  next_contact_summary text default null
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
    user_id,
    content_count,
    user_base_size,
    subscription_model,
    integration_docs_url,
    response_time_minutes,
    contact_summary
  )
  values (
    auth.uid(),
    coalesce(next_content_count, 0),
    coalesce(next_user_base_size, 0),
    coalesce(nullif(left(trim(coalesce(next_subscription_model, '')), 120), ''), 'freemium'),
    nullif(left(trim(coalesce(next_integration_docs_url, '')), 500), ''),
    next_response_time_minutes,
    nullif(left(trim(coalesce(next_contact_summary, '')), 200), '')
  )
  on conflict (user_id) do update set
    content_count = coalesce(excluded.content_count, education_platform_profile_extras.content_count),
    user_base_size = coalesce(excluded.user_base_size, education_platform_profile_extras.user_base_size),
    subscription_model = coalesce(excluded.subscription_model, education_platform_profile_extras.subscription_model),
    integration_docs_url = coalesce(excluded.integration_docs_url, education_platform_profile_extras.integration_docs_url),
    response_time_minutes = coalesce(excluded.response_time_minutes, education_platform_profile_extras.response_time_minutes),
    contact_summary = coalesce(excluded.contact_summary, education_platform_profile_extras.contact_summary),
    updated_at = now()
  returning * into row;

  return row;
end;
$$;

grant execute on function public.upsert_teacher_profile_extras(
  text, int, public.education_degree_type, public.teaching_style_type, numeric, int, int, text
) to authenticated;

grant execute on function public.upsert_institution_profile_extras(
  text, int, int, text[], text[], int, text
) to authenticated;

grant execute on function public.upsert_education_platform_profile_extras(
  int, int, text, text, int, text
) to authenticated;

alter table public.teacher_profile_extras enable row level security;
alter table public.institution_profile_extras enable row level security;
alter table public.education_platform_profile_extras enable row level security;

drop policy if exists "Anyone can read teacher profile extras" on public.teacher_profile_extras;
create policy "Anyone can read teacher profile extras"
on public.teacher_profile_extras for select
using (true);

drop policy if exists "Teachers manage own teacher profile extras" on public.teacher_profile_extras;
create policy "Teachers manage own teacher profile extras"
on public.teacher_profile_extras for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Anyone can read institution profile extras" on public.institution_profile_extras;
create policy "Anyone can read institution profile extras"
on public.institution_profile_extras for select
using (true);

drop policy if exists "Institutions manage own profile extras" on public.institution_profile_extras;
create policy "Institutions manage own profile extras"
on public.institution_profile_extras for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Anyone can read platform profile extras" on public.education_platform_profile_extras;
create policy "Anyone can read platform profile extras"
on public.education_platform_profile_extras for select
using (true);

drop policy if exists "Platforms manage own profile extras" on public.education_platform_profile_extras;
create policy "Platforms manage own profile extras"
on public.education_platform_profile_extras for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
