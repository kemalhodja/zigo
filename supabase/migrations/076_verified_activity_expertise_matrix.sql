-- Verified activity stats, expertise matrix, review-topic boosts, credential storage.

create table if not exists public.teacher_expertise_selections (
  teacher_id uuid not null references public.users(id) on delete cascade,
  track_slug text not null check (char_length(trim(track_slug)) >= 2),
  review_boost_score int not null default 0 check (review_boost_score >= 0),
  selected_at timestamptz not null default now(),
  primary key (teacher_id, track_slug)
);

create index if not exists teacher_expertise_selections_teacher_idx
  on public.teacher_expertise_selections (teacher_id, review_boost_score desc);

alter table public.lesson_reviews
  add column if not exists topic_tags text[] not null default '{}',
  add column if not exists matched_track_slugs text[] not null default '{}';

-- Platform activity: bookings + lesson request message response latency.
create or replace function public.get_teacher_platform_activity_stats(target_teacher_id uuid)
returns table (
  total_completed_lessons int,
  completed_student_count int,
  avg_response_minutes int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  msg_avg int;
  profile_fallback int;
  lesson_count int;
  student_count int;
begin
  select count(*)::int into lesson_count
  from public.lesson_bookings
  where teacher_id = target_teacher_id and status = 'completed';

  select count(distinct coalesce(child_profile_id::text, parent_id::text))::int
  into student_count
  from public.lesson_bookings
  where teacher_id = target_teacher_id and status = 'completed';

  with parent_first as (
    select m.request_id, min(m.created_at) as first_at
    from public.lesson_request_messages m
    join public.lesson_requests r on r.id = m.request_id
    where r.receiver_id = target_teacher_id
      and m.sender_id = r.sender_id
    group by m.request_id
  ),
  teacher_first as (
    select m.request_id, min(m.created_at) as first_at
    from public.lesson_request_messages m
    join public.lesson_requests r on r.id = m.request_id
    where r.receiver_id = target_teacher_id
      and m.sender_id = target_teacher_id
    group by m.request_id
  )
  select coalesce(
    avg(extract(epoch from (t.first_at - p.first_at)) / 60.0)::int,
    0
  )
  into msg_avg
  from parent_first p
  join teacher_first t on t.request_id = p.request_id
  where t.first_at > p.first_at;

  select response_time_minutes into profile_fallback
  from public.teacher_profile_extras
  where user_id = target_teacher_id;

  avg_response_minutes := case
    when coalesce(msg_avg, 0) > 0 then msg_avg
    else coalesce(profile_fallback, 0)
  end;

  total_completed_lessons := lesson_count;
  completed_student_count := student_count;
  return next;
end;
$$;

create or replace function public.teacher_has_approved_credentials(target_teacher_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teacher_credential_submissions
    where teacher_id = target_teacher_id
      and status = 'approved'
  );
$$;

create or replace function public.set_teacher_expertise_matrix(
  track_slugs text[]
)
returns setof public.teacher_expertise_selections
language plpgsql
security definer
set search_path = public
as $$
declare
  actor public.users;
  slug text;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  select * into actor from public.users where id = auth.uid();
  if actor.role <> 'teacher' then
    raise exception 'only teachers can set expertise matrix';
  end if;

  delete from public.teacher_expertise_selections where teacher_id = auth.uid();

  foreach slug in array coalesce(track_slugs, '{}')
  loop
    slug := trim(slug);
    if char_length(slug) < 2 then
      continue;
    end if;
    insert into public.teacher_expertise_selections (teacher_id, track_slug)
    values (auth.uid(), left(slug, 80))
    on conflict (teacher_id, track_slug) do nothing;
  end loop;

  return query
  select * from public.teacher_expertise_selections
  where teacher_id = auth.uid()
  order by track_slug;
end;
$$;

create or replace function public.boost_teacher_expertise_from_review(
  target_teacher_id uuid,
  boost_slugs text[],
  boost_amount int default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  slug text;
begin
  foreach slug in array coalesce(boost_slugs, '{}')
  loop
    update public.teacher_expertise_selections
    set review_boost_score = review_boost_score + greatest(boost_amount, 0)
    where teacher_id = target_teacher_id
      and track_slug = trim(slug);
  end loop;
end;
$$;

grant execute on function public.get_teacher_platform_activity_stats(uuid) to authenticated, anon;
grant execute on function public.teacher_has_approved_credentials(uuid) to authenticated, anon;
grant execute on function public.set_teacher_expertise_matrix(text[]) to authenticated;
grant execute on function public.boost_teacher_expertise_from_review(uuid, text[], int) to authenticated;

alter table public.teacher_expertise_selections enable row level security;

drop policy if exists "Anyone can read teacher expertise matrix" on public.teacher_expertise_selections;
create policy "Anyone can read teacher expertise matrix"
on public.teacher_expertise_selections for select
using (true);

drop policy if exists "Teachers manage own expertise matrix" on public.teacher_expertise_selections;
create policy "Teachers manage own expertise matrix"
on public.teacher_expertise_selections for all
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

-- Private credential documents bucket (PDF/images).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'teacher-credentials',
  'teacher-credentials',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Teachers upload own credential files" on storage.objects;
create policy "Teachers upload own credential files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'teacher-credentials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Teachers read own credential files" on storage.objects;
create policy "Teachers read own credential files"
on storage.objects for select to authenticated
using (
  bucket_id = 'teacher-credentials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Platform admins read credential files" on storage.objects;
create policy "Platform admins read credential files"
on storage.objects for select to authenticated
using (
  bucket_id = 'teacher-credentials'
  and public.current_user_is_platform_admin()
);
