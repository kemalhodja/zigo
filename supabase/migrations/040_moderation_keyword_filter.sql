create table if not exists public.blocked_keywords (
  id serial primary key,
  keyword text not null unique,
  category text not null check (
    category in ('profanity', 'bullying', 'self_harm', 'personal_info', 'off_platform', 'spam')
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists blocked_keywords_active_idx
on public.blocked_keywords (is_active, category);

alter table public.blocked_keywords enable row level security;

drop policy if exists "Platform admins can manage blocked keywords" on public.blocked_keywords;

create policy "Platform admins can manage blocked keywords"
on public.blocked_keywords
for all
to authenticated
using (public.current_user_is_platform_admin())
with check (public.current_user_is_platform_admin());

insert into public.blocked_keywords (keyword, category)
values
  ('salak', 'profanity'),
  ('aptal', 'profanity'),
  ('gerizekali', 'profanity'),
  ('gerizekalı', 'profanity'),
  ('mal', 'profanity'),
  ('ezik', 'bullying'),
  ('kufur', 'profanity'),
  ('küfür', 'profanity'),
  ('siktir', 'profanity'),
  ('bok', 'profanity'),
  ('orospu', 'profanity'),
  ('pic', 'profanity'),
  ('piç', 'profanity'),
  ('zorbalik', 'bullying'),
  ('zorbalık', 'bullying'),
  ('dalga geç', 'bullying'),
  ('disla', 'bullying'),
  ('dışla', 'bullying'),
  ('kendini oldur', 'self_harm'),
  ('kendini öldür', 'self_harm'),
  ('geber', 'self_harm'),
  ('olsen iyi', 'self_harm'),
  ('ölsen iyi', 'self_harm'),
  ('adresim', 'personal_info'),
  ('telefonum', 'personal_info'),
  ('okulum', 'personal_info'),
  ('evim', 'personal_info'),
  ('whatsapp', 'off_platform'),
  ('telegram', 'off_platform'),
  ('snap', 'off_platform'),
  ('discord', 'off_platform'),
  ('mesaj at', 'off_platform'),
  ('özelden', 'off_platform')
on conflict (keyword) do nothing;

alter table public.content_reports
  add column if not exists details text check (details is null or char_length(details) <= 500);

create or replace function public.normalize_moderation_text(input_text text)
returns text
language sql
immutable
as $$
  select trim(
    regexp_replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(lower(coalesce(input_text, '')), '1', 'i'),
                  '!', 'i'
                ),
                '3', 'e'
              ),
              '4', 'a'
            ),
            '@', 'a'
          ),
          '0', 'o'
        ),
        '$', 's'
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

create or replace function public.content_contains_blocked_keyword(input_text text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.blocked_keywords bk
      where bk.is_active
        and length(trim(bk.keyword)) > 0
        and (
          ' ' || public.normalize_moderation_text(input_text) || ' '
        ) like (
          '% ' || public.normalize_moderation_text(bk.keyword) || ' %'
        )
    )
    or public.normalize_moderation_text(input_text) ~ '(.)\1{5,}'
    or public.normalize_moderation_text(input_text) ~ '\m(dm)\M';
$$;

create or replace function public.assert_content_text_safe(input_text text)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if input_text is null or length(trim(input_text)) = 0 then
    return;
  end if;

  if public.content_contains_blocked_keyword(input_text) then
    raise exception 'content blocked by moderation policy';
  end if;
end;
$$;

grant execute on function public.normalize_moderation_text(text) to authenticated;
grant execute on function public.content_contains_blocked_keyword(text) to authenticated;
grant execute on function public.assert_content_text_safe(text) to authenticated;

create or replace function public.enforce_content_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  field_value text;
begin
  if TG_TABLE_NAME = 'social_posts' then
    perform public.assert_content_text_safe(NEW.caption);
    perform public.assert_content_text_safe(NEW.title);
    perform public.assert_content_text_safe(NEW.content);
  elsif TG_TABLE_NAME = 'post_comments' then
    perform public.assert_content_text_safe(NEW.content);
  elsif TG_TABLE_NAME = 'story_replies' then
    perform public.assert_content_text_safe(NEW.content);
  elsif TG_TABLE_NAME = 'stories' then
    perform public.assert_content_text_safe(NEW.caption);
  elsif TG_TABLE_NAME = 'questions' then
    perform public.assert_content_text_safe(NEW.title);
    perform public.assert_content_text_safe(NEW.description);
  elsif TG_TABLE_NAME = 'answers' then
    perform public.assert_content_text_safe(NEW.content);
  elsif TG_TABLE_NAME = 'quizzes' then
    perform public.assert_content_text_safe(NEW.title);
    perform public.assert_content_text_safe(NEW.question_text);
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_social_posts_moderation on public.social_posts;
create trigger trg_social_posts_moderation
before insert or update of caption, title, content on public.social_posts
for each row execute function public.enforce_content_moderation();

drop trigger if exists trg_post_comments_moderation on public.post_comments;
create trigger trg_post_comments_moderation
before insert or update of content on public.post_comments
for each row execute function public.enforce_content_moderation();

drop trigger if exists trg_story_replies_moderation on public.story_replies;
create trigger trg_story_replies_moderation
before insert or update of content on public.story_replies
for each row execute function public.enforce_content_moderation();

drop trigger if exists trg_stories_moderation on public.stories;
create trigger trg_stories_moderation
before insert or update of caption on public.stories
for each row execute function public.enforce_content_moderation();

drop trigger if exists trg_questions_moderation on public.questions;
create trigger trg_questions_moderation
before insert or update of title, description on public.questions
for each row execute function public.enforce_content_moderation();

drop trigger if exists trg_answers_moderation on public.answers;
create trigger trg_answers_moderation
before insert or update of content on public.answers
for each row execute function public.enforce_content_moderation();

drop trigger if exists trg_quizzes_moderation on public.quizzes;
create trigger trg_quizzes_moderation
before insert or update of title, question_text on public.quizzes
for each row execute function public.enforce_content_moderation();

create or replace function public.update_user_profile(
  next_bio text default null,
  next_avatar_url text default null
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.users;
begin
  if auth.uid() is null then
    raise exception 'authentication is required';
  end if;

  if next_bio is not null then
    perform public.assert_content_text_safe(next_bio);
  end if;

  update public.users
  set
    bio = case
      when next_bio is null then bio
      else nullif(left(trim(next_bio), 500), '')
    end,
    avatar_url = case
      when next_avatar_url is null then avatar_url
      else nullif(left(trim(next_avatar_url), 500), '')
    end
  where id = auth.uid()
  returning * into updated_profile;

  if not found then
    raise exception 'profile was not found';
  end if;

  return updated_profile;
end;
$$;

create or replace function public.redeem_store_product(
  target_product_id uuid,
  redemption_note text default null
)
returns public.store_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  product public.store_products;
  current_points int;
  inserted_redemption public.store_redemptions;
begin
  perform public.assert_content_text_safe(nullif(trim(coalesce(redemption_note, '')), ''));

  if public.current_user_role() <> 'student' then
    raise exception 'only student accounts can redeem store products directly';
  end if;

  select * into product
  from public.store_products
  where id = target_product_id
    and is_active = true
  for update;

  if not found then
    raise exception 'store product was not found';
  end if;

  if product.stock_count is not null and product.stock_count <= 0 then
    raise exception 'store product is out of stock';
  end if;

  select total_points into current_points
  from public.users
  where id = auth.uid()
    and role = 'student'
  for update;

  if current_points is null then
    raise exception 'student profile was not found';
  end if;

  if current_points < product.price_points then
    raise exception 'not enough Zigo Crystals';
  end if;

  update public.users
  set total_points = total_points - product.price_points
  where id = auth.uid();

  if product.stock_count is not null then
    update public.store_products
    set stock_count = stock_count - 1
    where id = target_product_id;
  end if;

  insert into public.store_redemptions (
    product_id,
    user_id,
    points_spent,
    status,
    note
  )
  values (
    target_product_id,
    auth.uid(),
    product.price_points,
    case
      when product.requires_parent_approval then 'pending_parent_approval'::public.store_redemption_status
      else 'approved'::public.store_redemption_status
    end,
    nullif(trim(redemption_note), '')
  )
  returning * into inserted_redemption;

  return inserted_redemption;
end;
$$;

create or replace function public.redeem_child_store_product(
  target_child_profile_id uuid,
  target_product_id uuid,
  redemption_note text default null
)
returns public.store_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  product public.store_products;
  current_points int;
  inserted_redemption public.store_redemptions;
begin
  perform public.assert_content_text_safe(nullif(trim(coalesce(redemption_note, '')), ''));

  if public.current_user_role() <> 'parent' then
    raise exception 'only parents can redeem products for child profiles';
  end if;

  if not exists (
    select 1
    from public.child_profiles
    where id = target_child_profile_id
      and parent_id = auth.uid()
  ) then
    raise exception 'child profile does not belong to this parent';
  end if;

  select * into product
  from public.store_products
  where id = target_product_id
    and is_active = true
  for update;

  if not found then
    raise exception 'store product was not found';
  end if;

  if product.stock_count is not null and product.stock_count <= 0 then
    raise exception 'store product is out of stock';
  end if;

  select total_points into current_points
  from public.child_profiles
  where id = target_child_profile_id
  for update;

  if current_points < product.price_points then
    raise exception 'not enough Zigo Crystals';
  end if;

  update public.child_profiles
  set total_points = total_points - product.price_points
  where id = target_child_profile_id;

  if product.stock_count is not null then
    update public.store_products
    set stock_count = stock_count - 1
    where id = target_product_id;
  end if;

  insert into public.store_redemptions (
    product_id,
    child_profile_id,
    points_spent,
    status,
    note
  )
  values (
    target_product_id,
    target_child_profile_id,
    product.price_points,
    'approved'::public.store_redemption_status,
    nullif(trim(redemption_note), '')
  )
  returning * into inserted_redemption;

  return inserted_redemption;
end;
$$;

create or replace function public.request_account_deletion(p_reason text default null)
returns public.account_deletion_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.account_deletion_requests%rowtype;
  normalized_reason text;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  normalized_reason := nullif(left(trim(coalesce(p_reason, '')), 500), '');
  perform public.assert_content_text_safe(normalized_reason);

  insert into public.account_deletion_requests (user_id, reason, status)
  values (auth.uid(), normalized_reason, 'pending')
  on conflict (user_id, status) do update
  set reason = excluded.reason, requested_at = now()
  returning * into saved;

  return saved;
end;
$$;
