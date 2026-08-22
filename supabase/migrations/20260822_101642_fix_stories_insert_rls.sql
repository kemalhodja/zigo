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
    from public.user_interests ui
    where ui.user_id = auth.uid()
      and ui.area_id = stories.area_id
  )
);

-- Fix SELECT policy: authors can always read their own stories
drop policy if exists "Users can read matched active stories" on public.stories;

create policy "Users can read matched active stories"
on public.stories
for select
to authenticated
using (
  author_id = auth.uid()
  or story_matches_current_user(id)
);

-- Fix story_matches_current_user to be VOLATILE so it sees newly inserted rows
CREATE OR REPLACE FUNCTION public.story_matches_current_user(p_story_id uuid)
 RETURNS boolean
 LANGUAGE sql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
