-- Harden lesson request professional comms: dedupe, length limits, area match, unread helpers.

alter table public.lesson_requests
  drop constraint if exists lesson_requests_message_body_length_check;

alter table public.lesson_requests
  add constraint lesson_requests_message_body_length_check
  check (char_length(message_body) between 10 and 2000);

alter table public.lesson_request_messages
  drop constraint if exists lesson_request_messages_content_length_check;

alter table public.lesson_request_messages
  add constraint lesson_request_messages_content_length_check
  check (char_length(content) between 1 and 2000);

create unique index if not exists lesson_requests_one_pending_per_pair_idx
  on public.lesson_requests (
    sender_id,
    receiver_id,
    coalesce(child_profile_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where status = 'pending';

create index if not exists lesson_request_messages_unread_idx
  on public.lesson_request_messages (request_id, is_read, sender_id);

create or replace function public.teacher_shares_area_with_parent(
  teacher_user_id uuid,
  parent_user_id uuid,
  target_area_id int default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when target_area_id is not null then exists (
      select 1
      from public.user_interests parent_interest
      join public.user_interests teacher_interest
        on teacher_interest.area_id = parent_interest.area_id
      where parent_interest.user_id = parent_user_id
        and teacher_interest.user_id = teacher_user_id
        and parent_interest.area_id = target_area_id
    )
    else exists (
      select 1
      from public.user_interests parent_interest
      join public.user_interests teacher_interest
        on teacher_interest.area_id = parent_interest.area_id
      where parent_interest.user_id = parent_user_id
        and teacher_interest.user_id = teacher_user_id
    )
  end
$$;

create or replace function public.count_lesson_request_unread(for_user_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select count(*)::int
    from public.lesson_requests lr
    where lr.receiver_id = for_user_id
      and lr.status = 'pending'
  ), 0)
  + coalesce((
    select count(*)::int
    from public.lesson_request_messages msg
    join public.lesson_requests lr on lr.id = msg.request_id
    where (lr.sender_id = for_user_id or lr.receiver_id = for_user_id)
      and msg.sender_id <> for_user_id
      and msg.is_read = false
  ), 0)
$$;

create or replace function public.mark_lesson_request_thread_read(
  target_request_id uuid,
  for_user_id uuid default auth.uid()
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count int;
begin
  if for_user_id is null then
    raise exception 'authentication is required';
  end if;

  if not public.user_participates_in_lesson_request(target_request_id) then
    raise exception 'not a participant in this request';
  end if;

  update public.lesson_request_messages msg
  set is_read = true
  where msg.request_id = target_request_id
    and msg.sender_id <> for_user_id
    and msg.is_read = false;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

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
  and public.teacher_shares_area_with_parent(receiver_id, auth.uid(), area_id)
  and (
    child_profile_id is null
    or exists (
      select 1
      from public.child_profiles cp
      where cp.id = child_profile_id
        and cp.parent_id = auth.uid()
    )
  )
  and (
    area_id is null
    or public.current_user_has_area(area_id)
  )
);

drop policy if exists "Platform admins read lesson requests" on public.lesson_requests;
create policy "Platform admins read lesson requests"
on public.lesson_requests
for select
to authenticated
using (public.current_user_is_platform_admin());

drop policy if exists "Platform admins read lesson request messages" on public.lesson_request_messages;
create policy "Platform admins read lesson request messages"
on public.lesson_request_messages
for select
to authenticated
using (public.current_user_is_platform_admin());

grant execute on function public.count_lesson_request_unread(uuid) to authenticated;
grant execute on function public.mark_lesson_request_thread_read(uuid, uuid) to authenticated;
