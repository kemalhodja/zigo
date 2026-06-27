-- Parent in-app confirmation when a lesson request is submitted.

alter table public.notifications drop constraint if exists notifications_kind_check;

alter table public.notifications
  add constraint notifications_kind_check check (
    kind in (
      'like',
      'comment',
      'follow',
      'save',
      'story',
      'system',
      'lesson_request',
      'lesson_request_urgent',
      'lesson_request_sent',
      'lesson_request_accepted',
      'lesson_request_rejected',
      'lesson_request_message'
    )
  );

create or replace function public.create_lesson_request_notification(
  recipient_id uuid,
  actor_id uuid,
  request_id uuid,
  kind text,
  message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  if actor_id <> auth.uid() then
    raise exception 'actor mismatch';
  end if;

  if kind not in (
    'lesson_request',
    'lesson_request_urgent',
    'lesson_request_sent',
    'lesson_request_accepted',
    'lesson_request_rejected',
    'lesson_request_message'
  ) then
    raise exception 'invalid notification kind';
  end if;

  if char_length(trim(message)) < 1 or char_length(message) > 500 then
    raise exception 'invalid notification message';
  end if;

  if kind = 'lesson_request_sent' then
    if recipient_id <> actor_id then
      raise exception 'confirmation notification must be self-directed';
    end if;

    if not exists (
      select 1
      from public.lesson_requests lr
      where lr.id = request_id
        and lr.sender_id = auth.uid()
    ) then
      raise exception 'invalid lesson request sender';
    end if;
  else
    if recipient_id = actor_id then
      return;
    end if;

    if not exists (
      select 1
      from public.lesson_requests lr
      where lr.id = request_id
        and (
          (lr.sender_id = auth.uid() and lr.receiver_id = recipient_id)
          or (lr.receiver_id = auth.uid() and lr.sender_id = recipient_id)
        )
    ) then
      raise exception 'invalid lesson request participants';
    end if;
  end if;

  insert into public.notifications (
    user_id,
    actor_id,
    kind,
    lesson_request_id,
    message
  )
  values (
    recipient_id,
    actor_id,
    kind,
    request_id,
    message
  );
end;
$$;

grant execute on function public.create_lesson_request_notification(uuid, uuid, uuid, text, text) to authenticated;
