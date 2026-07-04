-- Students and other authors must read their own comments even while moderation is pending.
drop policy if exists "Users can read own post comments" on public.post_comments;

create policy "Users can read own post comments"
on public.post_comments
for select
to authenticated
using (user_id = auth.uid());
