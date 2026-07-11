-- Migration 067: Subscriber Class Groups, District/School fields, and Subscriber Point/Store Gates

-- 1. Add district and school_name columns to users and child_profiles
alter table public.users
  add column if not exists district varchar(100),
  add column if not exists school_name varchar(255);

alter table public.child_profiles
  add column if not exists city varchar(100),
  add column if not exists district varchar(100),
  add column if not exists school_name varchar(255);

-- 2. Create class_groups table (Sınıf Grupları)
create table if not exists public.class_groups (
  id uuid primary key default gen_random_uuid(),
  city varchar(100) not null,
  district varchar(100) not null,
  school_name varchar(255) not null,
  grade_level varchar(50) not null,
  group_name varchar(255) not null,
  created_at timestamptz not null default now(),
  constraint class_groups_unique_info unique (city, district, school_name, grade_level)
);

create index if not exists class_groups_search_idx
  on public.class_groups (city, district, school_name, grade_level);

-- 3. Create class_group_members table (İsteğe Bağlı Katılım)
create table if not exists public.class_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.class_groups(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  child_profile_id uuid references public.child_profiles(id) on delete cascade,
  role varchar(50) not null check (role in ('student', 'parent')),
  joined_at timestamptz not null default now(),
  constraint class_group_members_owner_check check (
    (user_id is not null and child_profile_id is null)
    or (user_id is null and child_profile_id is not null)
  )
);

create unique index if not exists class_group_members_user_unique_idx
  on public.class_group_members (group_id, user_id)
  where user_id is not null;

create unique index if not exists class_group_members_child_unique_idx
  on public.class_group_members (group_id, child_profile_id)
  where child_profile_id is not null;

-- 4. Enable RLS and policies
alter table public.class_groups enable row level security;
alter table public.class_group_members enable row level security;

drop policy if exists "Class groups are readable by authenticated users" on public.class_groups;
create policy "Class groups are readable by authenticated users"
on public.class_groups
for select
to authenticated
using (true);

drop policy if exists "Class group members are readable by authenticated users" on public.class_group_members;
create policy "Class group members are readable by authenticated users"
on public.class_group_members
for select
to authenticated
using (true);

-- 5. Helper to check if user is a subscriber (Abone olan)
create or replace function public.is_user_subscriber(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = target_user_id
      and (
        is_premium = true
        or (ad_free_until is not null and ad_free_until > now())
      )
  ) or exists (
    select 1
    from public.user_subscriptions us
    where us.user_id = target_user_id
      and us.tier = 'zigo_plus'
      and (us.current_period_end is null or us.current_period_end > now())
  );
$$;

grant execute on function public.is_user_subscriber(uuid) to authenticated;

-- 6. RPC: Join or Create Class Group (İsteğe bağlı giriş yapma)
create or replace function public.join_class_group(
  p_city text,
  p_district text,
  p_school_name text,
  p_grade_level text,
  p_child_profile_id uuid default null
)
returns public.class_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_city text := nullif(trim(coalesce(p_city, '')), '');
  normalized_district text := nullif(trim(coalesce(p_district, '')), '');
  normalized_school text := nullif(trim(coalesce(p_school_name, '')), '');
  normalized_grade text := nullif(trim(coalesce(p_grade_level, '')), '');
  target_group public.class_groups;
  computed_group_name text;
  caller_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'oturum açmanız gerekiyor.';
  end if;

  -- Abone kontrolü (Sadece abone olan öğrenci ve veli sınıf gruplarına katılabilir)
  if not public.is_user_subscriber(auth.uid()) then
    raise exception 'sınıf grupları sadece abonelere özeldir. gruplara katılmak için abone olmalısınız.';
  end if;

  if normalized_city is null or normalized_district is null or normalized_school is null or normalized_grade is null then
    raise exception 'il, ilçe, okul ve sınıf bilgilerinin tamamı girilmelidir.';
  end if;

  caller_role := public.current_user_role();
  if caller_role not in ('student', 'parent') then
    raise exception 'sadece öğrenci ve veliler sınıf gruplarına katılabilir.';
  end if;

  computed_group_name := normalized_school || ' - ' || normalized_grade || ' Grubu';

  -- Update user or child profile location info
  if p_child_profile_id is not null then
    if caller_role <> 'parent' then
      raise exception 'çocuk profili için sadece veliler işlem yapabilir.';
    end if;

    update public.child_profiles
    set
      city = normalized_city,
      district = normalized_district,
      school_name = normalized_school,
      grade_level = normalized_grade
    where id = p_child_profile_id
      and parent_id = auth.uid();

    if not found then
      raise exception 'çocuk profili bulunamadı.';
    end if;
  else
    update public.users
    set
      city = normalized_city,
      district = normalized_district,
      school_name = normalized_school,
      grade_level = normalized_grade
    where id = auth.uid();
  end if;

  -- Find or insert class group
  insert into public.class_groups (city, district, school_name, grade_level, group_name)
  values (normalized_city, normalized_district, normalized_school, normalized_grade, computed_group_name)
  on conflict (city, district, school_name, grade_level) do update
    set group_name = excluded.group_name
  returning * into target_group;

  -- Insert membership (optional join)
  if p_child_profile_id is not null then
    insert into public.class_group_members (group_id, child_profile_id, role)
    values (target_group.id, p_child_profile_id, 'student')
    on conflict (group_id, child_profile_id) where child_profile_id is not null do nothing;
  else
    insert into public.class_group_members (group_id, user_id, role)
    values (target_group.id, auth.uid(), caller_role::text)
    on conflict (group_id, user_id) where user_id is not null do nothing;
  end if;

  return target_group;
end;
$$;

grant execute on function public.join_class_group(text, text, text, text, uuid) to authenticated;

-- 7. RPC: Leave Class Group (İsteğe bağlı gruptan ayrılma)
create or replace function public.leave_class_group(
  p_group_id uuid,
  p_child_profile_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'oturum açmanız gerekiyor.';
  end if;

  if p_child_profile_id is not null then
    delete from public.class_group_members
    where group_id = p_group_id
      and child_profile_id = p_child_profile_id
      and exists (
        select 1 from public.child_profiles
        where id = p_child_profile_id and parent_id = auth.uid()
      );
  else
    delete from public.class_group_members
    where group_id = p_group_id
      and user_id = auth.uid();
  end if;

  return true;
end;
$$;

grant execute on function public.leave_class_group(uuid, uuid) to authenticated;

-- 8. Enforce Subscriber Gate on Reels Points (abone olmayan zigo puan kazanamaz)
create or replace function public.award_social_reel_watch_points(
  p_target_user_id uuid,
  p_target_id uuid,
  p_points int
)
returns table (
  event_id uuid,
  points_awarded int,
  already_awarded boolean,
  total_points int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_event public.learning_events%rowtype;
  current_total int;
  awarded_val int := p_points;
begin
  if auth.uid() is null or auth.uid() <> p_target_user_id then
    raise exception 'not authorized';
  end if;

  if p_points <> 10 then
    raise exception 'invalid points';
  end if;

  if not exists (
    select 1
    from public.social_posts
    join public.users on users.id = social_posts.author_id
    where social_posts.id = p_target_id
      and (social_posts.is_reel = true or social_posts.media_type = 'video')
      and social_posts.area_id is not null
      and public.current_user_has_area(social_posts.area_id)
      and users.role = 'teacher'
      and users.is_verified = true
  ) then
    raise exception 'not a verified matched reel';
  end if;

  -- Abone olmayan kullanıcılar zigo puan kazanamaz
  if not public.is_user_subscriber(p_target_user_id) then
    awarded_val := 0;
  end if;

  insert into public.learning_events (user_id, action_type, target_id, points_awarded)
  values (p_target_user_id, 'reel_watch', p_target_id, awarded_val)
  on conflict (user_id, action_type, target_id) do nothing
  returning * into inserted_event;

  if inserted_event.id is null then
    select users.total_points into current_total
    from public.users
    where users.id = p_target_user_id;

    return query
    select
      null::uuid,
      0,
      true,
      coalesce(current_total, 0);
    return;
  end if;

  if awarded_val > 0 then
    update public.users as profile
    set total_points = profile.total_points + awarded_val
    where profile.id = p_target_user_id
    returning profile.total_points into current_total;
  else
    select users.total_points into current_total
    from public.users
    where users.id = p_target_user_id;
  end if;

  return query
  select
    inserted_event.id,
    awarded_val,
    false,
    coalesce(current_total, 0);
end;
$$;

-- 9. Enforce Subscriber Gate on Duel Win Points
create or replace function public.award_safe_duel_win_points(
  p_target_user_id uuid,
  p_duel_id uuid,
  p_score int,
  p_total_questions int default 3
)
returns table (
  event_id uuid,
  points_awarded int,
  already_awarded boolean,
  total_points int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_event public.learning_events%rowtype;
  current_total int;
  required_score int;
  awarded_val int := 25;
begin
  if auth.uid() is null or auth.uid() <> p_target_user_id then
    raise exception 'not authorized';
  end if;

  if public.current_user_role() <> 'student' then
    raise exception 'only students can earn duel rewards';
  end if;

  if p_total_questions < 1 then
    raise exception 'invalid duel length';
  end if;

  required_score := greatest(1, ceil(p_total_questions::numeric / 2));

  if p_score < required_score then
    raise exception 'duel score below win threshold';
  end if;

  -- Abone olmayan kullanıcılar zigo puan kazanamaz
  if not public.is_user_subscriber(p_target_user_id) then
    awarded_val := 0;
  end if;

  insert into public.learning_events (user_id, action_type, target_id, points_awarded)
  values (p_target_user_id, 'duel_win', p_duel_id, awarded_val)
  on conflict (user_id, action_type, target_id) do nothing
  returning * into inserted_event;

  if inserted_event.id is null then
    select users.total_points into current_total
    from public.users
    where users.id = p_target_user_id;

    return query
    select
      null::uuid,
      0,
      true,
      coalesce(current_total, 0);
    return;
  end if;

  if awarded_val > 0 then
    update public.users as profile
    set total_points = profile.total_points + awarded_val
    where profile.id = p_target_user_id
      and profile.role = 'student'
    returning profile.total_points into current_total;
  else
    select users.total_points into current_total
    from public.users
    where users.id = p_target_user_id;
  end if;

  return query
  select
    inserted_event.id,
    awarded_val,
    false,
    coalesce(current_total, 0);
end;
$$;

-- 10. Enforce Subscriber Gate on Quiz Attempts
create or replace function public.submit_quiz_attempt(
  target_quiz_id uuid,
  selected_option int
)
returns public.quiz_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz public.quizzes;
  existing_attempt public.quiz_attempts;
  inserted_attempt public.quiz_attempts;
  awarded_points int;
  answer_is_correct boolean;
begin
  if public.current_user_role() <> 'student' then
    raise exception 'only student accounts can submit quiz attempts directly';
  end if;

  select * into quiz
  from public.quizzes
  where id = target_quiz_id
    and is_active = true;

  if not found then
    raise exception 'quiz was not found';
  end if;

  if not public.current_user_has_area(quiz.area_id) then
    raise exception 'quiz does not match selected education areas';
  end if;

  select * into existing_attempt
  from public.quiz_attempts
  where quiz_id = target_quiz_id
    and user_id = auth.uid();

  if found then
    return existing_attempt;
  end if;

  answer_is_correct := selected_option = quiz.correct_option;
  awarded_points := case when answer_is_correct then quiz.points_reward else 0 end;

  -- Abone olmayan kullanıcılar zigo puan kazanamaz
  if not public.is_user_subscriber(auth.uid()) then
    awarded_points := 0;
  end if;

  insert into public.quiz_attempts (
    quiz_id,
    user_id,
    selected_option,
    is_correct,
    points_awarded
  )
  values (
    target_quiz_id,
    auth.uid(),
    selected_option,
    answer_is_correct,
    awarded_points
  )
  returning * into inserted_attempt;

  if awarded_points > 0 then
    update public.users
    set total_points = total_points + awarded_points
    where id = auth.uid()
      and role = 'student';

    insert into public.learning_events (user_id, action_type, target_id, points_awarded)
    values (auth.uid(), 'quiz_complete', target_quiz_id, awarded_points)
    on conflict (user_id, action_type, target_id) do nothing;
  end if;

  return inserted_attempt;
end;
$$;

-- 11. Enforce Subscriber Gate on Child/Parent Profile Points
create or replace function public.award_child_learning_points(
  target_child_profile_id uuid,
  action_kind text
)
returns table(id uuid, total_points int)
language plpgsql
security definer
set search_path = public
as $$
declare
  points_to_add int;
begin
  if not exists (
    select 1
    from public.child_profiles
    where child_profiles.id = target_child_profile_id
      and child_profiles.parent_id = auth.uid()
  ) then
    raise exception 'child profile does not belong to this parent';
  end if;

  points_to_add := case action_kind
    when 'micro_video_watched' then 10
    when 'mini_quiz_completed' then 10
    when 'duel_won' then 25
    else null
  end;

  if points_to_add is null then
    raise exception 'unknown learning action';
  end if;

  -- Abone olmayan veli ve öğrenci zigo puan kazanamaz
  if not public.is_user_subscriber(auth.uid()) then
    points_to_add := 0;
  end if;

  update public.child_profiles
  set total_points = total_points + points_to_add
  where child_profiles.id = target_child_profile_id
  returning child_profiles.id, child_profiles.total_points into id, total_points;

  return next;
end;
$$;

-- 12. Enforce Subscriber Gate on Store Redemptions
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
  if public.current_user_role() <> 'student' then
    raise exception 'only student accounts can redeem store products directly';
  end if;

  -- Abone kontrolü (Abone olmayanlar mağazadan alışveriş yapamaz)
  if not public.is_user_subscriber(auth.uid()) then
    raise exception 'sadece abone olan öğrenciler zigo puan kazanabilir ve mağazadan alışveriş yapabilir.';
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
  if public.current_user_role() <> 'parent' then
    raise exception 'only parent accounts can redeem child rewards directly';
  end if;

  -- Abone kontrolü (Abone olmayan veliler mağazadan alışveriş yapamaz)
  if not public.is_user_subscriber(auth.uid()) then
    raise exception 'sadece abone olan veliler zigo puan kazanabilir ve mağazadan alışveriş yapabilir.';
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

  if current_points is null then
    raise exception 'child profile was not found';
  end if;

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
