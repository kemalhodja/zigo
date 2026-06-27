-- Trust & Safety, lock-in reporting, onboarding intake, P2P payment confirmation.

do $$ begin
  create type public.teacher_credential_type as enum ('diploma', 'e_devlet');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.teacher_credential_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.lesson_payment_status as enum (
    'pending',
    'parent_confirmed',
    'teacher_confirmed',
    'payment_confirmed',
    'disputed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_dispute_status as enum ('open', 'reviewing', 'resolved_parent', 'resolved_teacher', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.exam_goal_type as enum ('lgs', 'yks', 'general');
exception when duplicate_object then null;
end $$;

alter table public.lesson_bookings
  add column if not exists payment_status public.lesson_payment_status not null default 'pending';

create table if not exists public.teacher_credential_submissions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  credential_type public.teacher_credential_type not null,
  document_url text not null,
  status public.teacher_credential_status not null default 'pending',
  admin_note text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists teacher_credential_submissions_teacher_idx
  on public.teacher_credential_submissions (teacher_id, created_at desc);

create table if not exists public.lesson_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.lesson_bookings(id) on delete cascade,
  parent_id uuid not null references public.users(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text check (char_length(trim(coalesce(comment, ''))) <= 2000),
  created_at timestamptz not null default now(),
  constraint lesson_reviews_payment_confirmed check (true)
);

create index if not exists lesson_reviews_teacher_idx
  on public.lesson_reviews (teacher_id, created_at desc);

create table if not exists public.payment_disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.lesson_bookings(id) on delete cascade,
  opened_by uuid not null references public.users(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 10 and 2000),
  status public.payment_dispute_status not null default 'open',
  resolution_note text,
  resolved_by uuid references public.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payment_disputes_booking_idx
  on public.payment_disputes (booking_id, created_at desc);

create table if not exists public.user_onboarding_intake (
  user_id uuid primary key references public.users(id) on delete cascade,
  grade_level varchar(20),
  goal_exam public.exam_goal_type not null default 'general',
  struggle_area_id int references public.education_areas(id) on delete set null,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payment confirmation: parent or teacher confirms; both sides => payment_confirmed (review eligible).
create or replace function public.confirm_lesson_payment(
  target_booking_id uuid,
  side text
)
returns public.lesson_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.lesson_bookings;
  next_status public.lesson_payment_status;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  select * into booking from public.lesson_bookings where id = target_booking_id;
  if not found then
    raise exception 'booking not found';
  end if;

  if booking.status <> 'completed' then
    raise exception 'payment can only be confirmed after lesson completion';
  end if;

  if side = 'parent' and booking.parent_id <> auth.uid() then
    raise exception 'only parent can confirm as parent';
  elsif side = 'teacher' and booking.teacher_id <> auth.uid() then
    raise exception 'only teacher can confirm as teacher';
  elsif side not in ('parent', 'teacher') then
    raise exception 'invalid side';
  end if;

  if booking.payment_status = 'disputed' then
    raise exception 'booking is under dispute';
  end if;

  if side = 'parent' then
    next_status := case
      when booking.payment_status in ('teacher_confirmed', 'payment_confirmed') then 'payment_confirmed'
      else 'parent_confirmed'
    end;
  else
    next_status := case
      when booking.payment_status in ('parent_confirmed', 'payment_confirmed') then 'payment_confirmed'
      else 'teacher_confirmed'
    end;
  end if;

  update public.lesson_bookings
  set payment_status = next_status, updated_at = now()
  where id = target_booking_id
  returning * into booking;

  return booking;
end;
$$;

create or replace function public.open_payment_dispute(
  target_booking_id uuid,
  dispute_reason text
)
returns public.payment_disputes
language plpgsql
security definer
set search_path = public
as $$
declare
  booking public.lesson_bookings;
  dispute public.payment_disputes;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  select * into booking from public.lesson_bookings where id = target_booking_id;
  if not found then
    raise exception 'booking not found';
  end if;

  if auth.uid() not in (booking.parent_id, booking.teacher_id) then
    raise exception 'not authorized for this booking';
  end if;

  if char_length(trim(dispute_reason)) < 10 then
    raise exception 'dispute reason too short';
  end if;

  update public.lesson_bookings
  set payment_status = 'disputed', updated_at = now()
  where id = target_booking_id;

  insert into public.payment_disputes (booking_id, opened_by, reason)
  values (target_booking_id, auth.uid(), trim(dispute_reason))
  returning * into dispute;

  return dispute;
end;
$$;

alter table public.teacher_credential_submissions enable row level security;
alter table public.lesson_reviews enable row level security;
alter table public.payment_disputes enable row level security;
alter table public.user_onboarding_intake enable row level security;

drop policy if exists "Teachers manage own credential submissions" on public.teacher_credential_submissions;
create policy "Teachers manage own credential submissions"
on public.teacher_credential_submissions
for all
to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

drop policy if exists "Platform admins read credential submissions" on public.teacher_credential_submissions;
create policy "Platform admins read credential submissions"
on public.teacher_credential_submissions
for select
to authenticated
using (public.current_user_is_platform_admin());

drop policy if exists "Platform admins update credential submissions" on public.teacher_credential_submissions;
create policy "Platform admins update credential submissions"
on public.teacher_credential_submissions
for update
to authenticated
using (public.current_user_is_platform_admin())
with check (public.current_user_is_platform_admin());

drop policy if exists "Public read approved teacher reviews" on public.lesson_reviews;
create policy "Public read approved teacher reviews"
on public.lesson_reviews
for select
to authenticated
using (true);

drop policy if exists "Parents create reviews on confirmed payment" on public.lesson_reviews;
create policy "Parents create reviews on confirmed payment"
on public.lesson_reviews
for insert
to authenticated
with check (
  parent_id = auth.uid()
  and exists (
    select 1 from public.lesson_bookings lb
    where lb.id = booking_id
      and lb.parent_id = auth.uid()
      and lb.payment_status = 'payment_confirmed'
  )
);

drop policy if exists "Dispute participants read" on public.payment_disputes;
create policy "Dispute participants read"
on public.payment_disputes
for select
to authenticated
using (
  exists (
    select 1 from public.lesson_bookings lb
    where lb.id = booking_id
      and (lb.parent_id = auth.uid() or lb.teacher_id = auth.uid())
  )
  or public.current_user_is_platform_admin()
);

drop policy if exists "Participants open disputes" on public.payment_disputes;
create policy "Participants open disputes"
on public.payment_disputes
for insert
to authenticated
with check (
  opened_by = auth.uid()
  and exists (
    select 1 from public.lesson_bookings lb
    where lb.id = booking_id
      and (lb.parent_id = auth.uid() or lb.teacher_id = auth.uid())
  )
);

drop policy if exists "Users manage own onboarding intake" on public.user_onboarding_intake;
create policy "Users manage own onboarding intake"
on public.user_onboarding_intake
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update on public.teacher_credential_submissions to authenticated;
grant select, insert on public.lesson_reviews to authenticated;
grant select, insert on public.payment_disputes to authenticated;
grant select, insert, update on public.user_onboarding_intake to authenticated;
grant execute on function public.confirm_lesson_payment(uuid, text) to authenticated;
grant execute on function public.open_payment_dispute(uuid, text) to authenticated;
