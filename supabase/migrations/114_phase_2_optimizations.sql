-- 1. Yük Hafifletme: social_posts Sayaç (Count) Kolonları
alter table public.social_posts
add column if not exists likes_count int not null default 0,
add column if not exists comments_count int not null default 0,
add column if not exists shares_count int not null default 0,
add column if not exists saves_count int not null default 0;

-- 2. Eski Verilerin (Backfill) Taşınması
update public.social_posts sp
set 
  likes_count = (select count(*) from public.post_likes pl where pl.post_id = sp.id),
  comments_count = (select count(*) from public.post_comments pc where pc.post_id = sp.id and pc.moderation_status = 'approved'),
  shares_count = (select count(*) from public.post_shares ps where ps.post_id = sp.id),
  saves_count = (select count(*) from public.saved_posts sap where sap.post_id = sp.id);

-- 3. Trigger Fonksiyonları
create or replace function public.increment_post_likes()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.social_posts set likes_count = likes_count + 1 where id = new.post_id;
  return new;
end;
$$;

create or replace function public.decrement_post_likes()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.social_posts set likes_count = likes_count - 1 where id = old.post_id;
  return old;
end;
$$;

create trigger tr_increment_post_likes
after insert on public.post_likes
for each row execute function public.increment_post_likes();

create trigger tr_decrement_post_likes
after delete on public.post_likes
for each row execute function public.decrement_post_likes();

-- Yorumlar (Sadece onaylı yorumları saymak için)
create or replace function public.update_post_comments_count()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT' and new.moderation_status = 'approved') then
    update public.social_posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE' and old.moderation_status = 'approved') then
    update public.social_posts set comments_count = comments_count - 1 where id = old.post_id;
  elsif (tg_op = 'UPDATE') then
    if (new.moderation_status = 'approved' and old.moderation_status != 'approved') then
      update public.social_posts set comments_count = comments_count + 1 where id = new.post_id;
    elsif (new.moderation_status != 'approved' and old.moderation_status = 'approved') then
      update public.social_posts set comments_count = comments_count - 1 where id = old.post_id;
    end if;
  end if;
  return null;
end;
$$;

create trigger tr_update_post_comments_count
after insert or update or delete on public.post_comments
for each row execute function public.update_post_comments_count();

-- Paylaşımlar
create or replace function public.increment_post_shares()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.social_posts set shares_count = shares_count + 1 where id = new.post_id;
  return new;
end;
$$;

create trigger tr_increment_post_shares
after insert on public.post_shares
for each row execute function public.increment_post_shares();

-- Kaydetmeler
create or replace function public.increment_post_saves()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.social_posts set saves_count = saves_count + 1 where id = new.post_id;
  return new;
end;
$$;

create or replace function public.decrement_post_saves()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.social_posts set saves_count = saves_count - 1 where id = old.post_id;
  return old;
end;
$$;

create trigger tr_increment_post_saves
after insert on public.saved_posts
for each row execute function public.increment_post_saves();

create trigger tr_decrement_post_saves
after delete on public.saved_posts
for each row execute function public.decrement_post_saves();

-- 4. Storage Güvenliği (Kısıtlamalar)
update storage.buckets
set 
  file_size_limit = 104857600, -- 100 MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
where id = 'media';

-- 5. RLS Optimizasyonu
create or replace function public.current_user_social_interactions_blocked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select users.social_interactions_blocked from public.users where users.id = auth.uid()),
    false
  );
$$;
