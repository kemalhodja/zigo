-- Professional parent ↔ teacher / institution communication.
-- Students cannot create or read lesson requests or thread messages (RLS + role checks).
-- Free-form DM tables are intentionally avoided; messaging is tied to accepted requests.

do $$
begin
  create type public.lesson_request_status as enum ('pending', 'accepted', 'rejected', 'closed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.lesson_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete set null,
  area_id int references public.education_areas(id) on delete set null,
  status public.lesson_request_status not null default 'pending',
  message_body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_requests_sender_receiver_check check (sender_id <> receiver_id)
);

create index if not exists lesson_requests_sender_id_created_at_idx
  on public.lesson_requests (sender_id, created_at desc);

create index if not exists lesson_requests_receiver_id_status_idx
  on public.lesson_requests (receiver_id, status, created_at desc);

create table if not exists public.lesson_request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.lesson_requests(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists lesson_request_messages_request_id_created_at_idx
  on public.lesson_request_messages (request_id, created_at asc);

create or replace function public.touch_lesson_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.lesson_requests
  set updated_at = now()
  where id = new.request_id;
  return new;
end;
$$;

drop trigger if exists lesson_request_messages_touch_request on public.lesson_request_messages;
create trigger lesson_request_messages_touch_request
after insert on public.lesson_request_messages
for each row
execute function public.touch_lesson_request_updated_at();

create or replace function public.current_user_is_parent_or_teacher()
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
      and role in ('parent', 'teacher')
  )
$$;

create or replace function public.user_participates_in_lesson_request(target_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lesson_requests lr
    where lr.id = target_request_id
      and (lr.sender_id = auth.uid() or lr.receiver_id = auth.uid())
  )
$$;

alter table public.lesson_requests enable row level security;
alter table public.lesson_request_messages enable row level security;

drop policy if exists "Parents create lesson requests to verified teachers" on public.lesson_requests;
create policy "Parents create lesson requests to verified teachers"
on public.lesson_requests
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.users sender
    where sender.id = auth.uid()
      and sender.role = 'parent'
  )
  and public.user_is_verified_teacher(receiver_id)
  and (
    child_profile_id is null
    or exists (
      select 1
      from public.child_profiles cp
      where cp.id = child_profile_id
        and cp.parent_id = auth.uid()
    )
  )
);

drop policy if exists "Participants read lesson requests" on public.lesson_requests;
create policy "Participants read lesson requests"
on public.lesson_requests
for select
to authenticated
using (
  public.current_user_is_parent_or_teacher()
  and (sender_id = auth.uid() or receiver_id = auth.uid())
);

drop policy if exists "Teachers update lesson request status" on public.lesson_requests;
create policy "Teachers update lesson request status"
on public.lesson_requests
for update
to authenticated
using (
  receiver_id = auth.uid()
  and exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'teacher'
      and is_verified = true
  )
)
with check (
  receiver_id = auth.uid()
  and status in ('accepted', 'rejected', 'closed')
);

drop policy if exists "Participants close lesson requests" on public.lesson_requests;
create policy "Participants close lesson requests"
on public.lesson_requests
for update
to authenticated
using (
  (sender_id = auth.uid() or receiver_id = auth.uid())
  and status in ('accepted', 'pending')
)
with check (
  (sender_id = auth.uid() or receiver_id = auth.uid())
  and status = 'closed'
);

drop policy if exists "Participants read lesson request thread" on public.lesson_request_messages;
create policy "Participants read lesson request thread"
on public.lesson_request_messages
for select
to authenticated
using (
  public.current_user_is_parent_or_teacher()
  and public.user_participates_in_lesson_request(request_id)
);

drop policy if exists "Participants post on accepted lesson requests" on public.lesson_request_messages;
create policy "Participants post on accepted lesson requests"
on public.lesson_request_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.current_user_is_parent_or_teacher()
  and public.user_participates_in_lesson_request(request_id)
  and exists (
    select 1
    from public.lesson_requests lr
    where lr.id = request_id
      and lr.status = 'accepted'
  )
);

drop policy if exists "Participants mark lesson request messages read" on public.lesson_request_messages;
create policy "Participants mark lesson request messages read"
on public.lesson_request_messages
for update
to authenticated
using (
  public.current_user_is_parent_or_teacher()
  and public.user_participates_in_lesson_request(request_id)
  and sender_id <> auth.uid()
)
with check (
  public.current_user_is_parent_or_teacher()
  and public.user_participates_in_lesson_request(request_id)
  and sender_id <> auth.uid()
);

grant select, insert, update on public.lesson_requests to authenticated;
grant select, insert, update on public.lesson_request_messages to authenticated;
