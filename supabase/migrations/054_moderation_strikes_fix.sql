-- 053 yarım kaldıysa social_posts insert politikasını geri yükle + trigger ile kısıt uygula.

create or replace function public.enforce_social_interactions_not_blocked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_social_interactions_blocked() then
    raise exception 'social interactions blocked by moderation policy';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_post_comments_social_block on public.post_comments;
create trigger trg_post_comments_social_block
before insert on public.post_comments
for each row execute function public.enforce_social_interactions_not_blocked();

drop trigger if exists trg_story_replies_social_block on public.story_replies;
create trigger trg_story_replies_social_block
before insert on public.story_replies
for each row execute function public.enforce_social_interactions_not_blocked();

drop trigger if exists trg_questions_social_block on public.questions;
create trigger trg_questions_social_block
before insert on public.questions
for each row execute function public.enforce_social_interactions_not_blocked();

drop trigger if exists trg_answers_social_block on public.answers;
create trigger trg_answers_social_block
before insert on public.answers
for each row execute function public.enforce_social_interactions_not_blocked();

drop trigger if exists trg_social_posts_social_block on public.social_posts;
create trigger trg_social_posts_social_block
before insert on public.social_posts
for each row execute function public.enforce_social_interactions_not_blocked();

drop trigger if exists trg_stories_social_block on public.stories;
create trigger trg_stories_social_block
before insert on public.stories
for each row execute function public.enforce_social_interactions_not_blocked();

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'social_posts'
      and policyname = 'Verified teachers can create area social posts'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'social_posts'
        and column_name = 'premium_prep_label'
    ) then
      execute $policy$
        create policy "Verified teachers can create area social posts"
        on public.social_posts
        for insert
        to authenticated
        with check (
          author_id = auth.uid()
          and area_id is not null
          and public.current_user_is_verified_teacher()
          and public.current_user_has_area(area_id)
          and (
            not (
              (premium_prep_label is not null and premium_prep_url is not null)
              or (sponsored_label is not null and sponsored_target_url is not null)
              or post_type = 'quiz'
            )
            or public.current_user_has_active_zigo_plus()
          )
          and (
            post_type <> 'quiz'
            or (
              quiz_id is not null
              and exists (
                select 1
                from public.quizzes q
                where q.id = quiz_id
                  and q.teacher_id = auth.uid()
                  and q.area_id = social_posts.area_id
                  and q.is_active
              )
            )
          )
        )
      $policy$;
    else
      execute $policy$
        create policy "Verified teachers can create area social posts"
        on public.social_posts
        for insert
        to authenticated
        with check (
          author_id = auth.uid()
          and area_id is not null
          and public.current_user_is_verified_teacher()
          and public.current_user_has_area(area_id)
        )
      $policy$;
    end if;
  end if;
end $$;
