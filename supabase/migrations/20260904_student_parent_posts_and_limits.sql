-- Enable students and parents to create posts
drop policy if exists "Students and parents can create social posts" on public.social_posts;
create policy "Students and parents can create social posts"
on public.social_posts
for insert
to authenticated
with check (
  author_id = auth.uid()
  and (
    (select role::text from public.users where id = auth.uid()) in ('student', 'parent')
  )
);

drop policy if exists "Students and parents can update own social posts" on public.social_posts;
create policy "Students and parents can update own social posts"
on public.social_posts
for update
to authenticated
using (
  author_id = auth.uid()
  and (
    (select role::text from public.users where id = auth.uid()) in ('student', 'parent')
  )
)
with check (
  author_id = auth.uid()
);

-- Update daily post limits according to business rules
create or replace function public.check_daily_post_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_post_count int;
  v_has_plus boolean;
  v_limit int;
begin
  select lower(role::text) into v_role from public.users where id = new.author_id;
  v_has_plus := public.current_user_has_active_zigo_plus();

  select count(*) into v_post_count
  from public.social_posts
  where author_id = new.author_id
    and created_at >= (now() - interval '24 hours');

  if v_role in ('student', 'parent') then
    -- Öğrenci & Veli (Zigo Plus): Günde maksimum 2 gönderi
    if not v_has_plus then
      raise exception 'Paylaşım yapmak için Zigo Plus abonesi olmalısınız.' using errcode = 'P0002';
    end if;
    v_limit := 2;
  else
    -- İçerik Üreticileri (Öğretmen, Kurum, Platform, Yayınevi)
    -- Zigo Plus Abonesi ise: SINIRSIZ
    -- Abonesiz ise: Günde maksimum 1 gönderi
    if v_has_plus then
      return new; -- Sınırsız
    else
      v_limit := 1;
    end if;
  end if;

  if v_post_count >= v_limit then
    raise exception 'Günlük paylaşım limitinizi (%) doldurdunuz.', v_limit using errcode = 'P0001';
  end if;

  return new;
end;
$$;
