-- Make subscription checks and private-lesson publishing authoritative.

create or replace function public.current_user_has_active_zigo_plus()
returns boolean language sql stable security definer set search_path = public as $$
  select public.user_has_active_entitlement(auth.uid());
$$;

alter table public.private_lesson_posts
  drop constraint if exists private_lesson_posts_status_check;
alter table public.private_lesson_posts
  add constraint private_lesson_posts_status_check
  check (status in ('pending_review', 'open', 'closed', 'rejected'));

alter table public.private_lesson_posts add column if not exists moderation_note text;
alter table public.private_lesson_posts add column if not exists reviewed_by uuid references public.users(id) on delete set null;
alter table public.private_lesson_posts add column if not exists reviewed_at timestamptz;
create index if not exists private_lesson_posts_open_area_created_idx
  on public.private_lesson_posts (area_id, created_at desc) where status = 'open';

create or replace function public.moderate_private_lesson_post(target_post_id uuid, next_status text, note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.current_user_is_platform_admin() then raise exception 'platform admin access is required'; end if;
  if next_status not in ('open', 'rejected', 'closed') then raise exception 'invalid moderation status'; end if;
  update public.private_lesson_posts
  set status = next_status, moderation_note = nullif(trim(note), ''), reviewed_by = auth.uid(), reviewed_at = now()
  where id = target_post_id and status = 'pending_review';
  if not found then raise exception 'pending lesson post was not found'; end if;
end;
$$;
grant execute on function public.moderate_private_lesson_post(uuid, text, text) to authenticated;

drop policy if exists "Public read open posts" on public.private_lesson_posts;
create policy "Users can read own or open lesson posts" on public.private_lesson_posts for select to authenticated
using (parent_id = auth.uid() or status = 'open' or public.current_user_is_platform_admin());
