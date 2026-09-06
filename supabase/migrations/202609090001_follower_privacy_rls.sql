-- Make follower-only publishing enforceable by RLS, not only the application UI.

alter table public.social_posts drop constraint if exists social_posts_target_audience_check;
alter table public.social_posts add constraint social_posts_target_audience_check
  check (target_audience in ('all', 'parent_only', 'grade', 'followers'));
create index if not exists follows_following_follower_idx on public.follows (following_id, follower_id);

create or replace function public.social_post_matches_current_user(p_post_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.social_posts sp
    join public.users author on author.id = sp.author_id
    where sp.id = p_post_id and (
      sp.author_id = auth.uid()
      or (
        (sp.target_audience = 'followers' or author.role::text in ('student', 'parent'))
        and exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid() and f.following_id = sp.author_id
        )
      )
      or (
        sp.target_audience <> 'followers'
        and author.role::text not in ('student', 'parent')
        and sp.area_id is not null
        and public.current_user_has_area(sp.area_id)
      )
    )
  );
$$;

drop policy if exists "Users can read matched social posts" on public.social_posts;
create policy "Users can read authorized social posts" on public.social_posts
for select to authenticated using (public.social_post_matches_current_user(id));

drop policy if exists "Users can comment on matched posts" on public.post_comments;
create policy "Users can comment on authorized posts" on public.post_comments
for insert to authenticated with check (
  user_id = auth.uid()
  and public.social_post_matches_current_user(post_id)
  and coalesce((select settings.allow_comments from public.social_posts sp
    left join public.user_safety_settings settings on settings.user_id = sp.author_id
    where sp.id = post_id), true)
  and coalesce((select not sp.followers_only_comments or exists (
    select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = sp.author_id
  ) from public.social_posts sp where sp.id = post_id), false)
  and moderation_status = case when (select role::text from public.users where id = auth.uid()) = 'student' then 'pending' else 'approved' end
);

drop policy if exists "Users can follow verified teachers" on public.follows;
create policy "Users can follow allowed accounts" on public.follows
for insert to authenticated with check (
  follower_id = auth.uid()
  and exists (
    select 1 from public.users target
    left join public.user_safety_settings settings on settings.user_id = target.id
    where target.id = following_id and (
      (target.role::text = 'teacher' and target.is_verified)
      or (target.role::text in ('student', 'parent') and coalesce(settings.allow_follow_requests, true))
    )
  )
);
