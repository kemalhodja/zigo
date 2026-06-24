alter table public.stories
add column if not exists area_id int references public.education_areas(id);

update public.stories
set area_id = teacher_area.area_id
from (
  select distinct on (user_id) user_id, area_id
  from public.user_interests
  order by user_id, area_id
) as teacher_area
where stories.author_id = teacher_area.user_id
  and stories.area_id is null;

create or replace function public.story_matches_current_user(p_story_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.stories
    join public.users author on author.id = stories.author_id
    where stories.id = p_story_id
      and stories.expires_at > now()
      and (
        stories.author_id = auth.uid()
        or (
          author.role = 'teacher'
          and author.is_verified = true
          and stories.area_id is not null
          and exists (
            select 1
            from public.user_interests viewer_area
            where viewer_area.user_id = auth.uid()
              and viewer_area.area_id = stories.area_id
          )
        )
      )
  );
$$;

drop policy if exists "Verified teachers can create stories" on public.stories;
drop policy if exists "Verified teachers can create assigned area stories" on public.stories;

create policy "Verified teachers can create assigned area stories"
on public.stories
for insert
to authenticated
with check (
  author_id = auth.uid()
  and area_id is not null
  and exists (
    select 1
    from public.users
    where users.id = auth.uid()
      and users.role = 'teacher'
      and users.is_verified = true
  )
  and exists (
    select 1
    from public.user_interests
    where user_interests.user_id = auth.uid()
      and user_interests.area_id = stories.area_id
  )
);
