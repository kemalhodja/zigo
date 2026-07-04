drop policy if exists "Authenticated users can read social posts" on public.social_posts;
drop policy if exists "Verified teachers can create social posts" on public.social_posts;
drop policy if exists "Authors can update own social posts" on public.social_posts;

create policy "Users can read matched social posts"
on public.social_posts
for select
to authenticated
using (
  author_id = auth.uid()
  or (
    area_id is not null
    and public.current_user_has_area(area_id)
  )
);

create policy "Verified teachers can create area social posts"
on public.social_posts
for insert
to authenticated
with check (
  author_id = auth.uid()
  and area_id is not null
  and public.current_user_is_verified_teacher()
  and public.current_user_has_area(area_id)
);

create policy "Verified authors can update own area social posts"
on public.social_posts
for update
to authenticated
using (author_id = auth.uid())
with check (
  author_id = auth.uid()
  and area_id is not null
  and public.current_user_is_verified_teacher()
  and public.current_user_has_area(area_id)
);
