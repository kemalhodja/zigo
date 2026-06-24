create policy "Platform admins can read all post comments"
on public.post_comments
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Platform admins can moderate post comments"
on public.post_comments
for update
to authenticated
using (public.current_user_is_platform_admin())
with check (public.current_user_is_platform_admin());

create policy "Platform admins can read all story replies"
on public.story_replies
for select
to authenticated
using (public.current_user_is_platform_admin());

create policy "Platform admins can moderate story replies"
on public.story_replies
for update
to authenticated
using (public.current_user_is_platform_admin())
with check (public.current_user_is_platform_admin());
