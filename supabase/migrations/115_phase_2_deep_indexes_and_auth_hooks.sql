-- 115_phase_2_deep_indexes_and_auth_hooks.sql

-- 1. Yetersiz İndekslerin Eklenmesi (N+1 Table Scan Önleme)
-- Follows tablosu "Takipçilerim kim?" (follower query) sorgusu için following_id indeksine ihtiyaç duyar.
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows(following_id);

-- Kullanıcının kaydettiği veya beğendiği gönderileri anında bulmak için indeksler
CREATE INDEX IF NOT EXISTS saved_posts_user_idx ON public.saved_posts(user_id);
CREATE INDEX IF NOT EXISTS post_likes_user_idx ON public.post_likes(user_id);

-- 2. JWT Tabanlı 0ms RLS Optimizasyonu (Auth Hook ve Claims Senkronizasyonu)
-- Zigo'da bir kullanıcı engellendiğinde `users` tablosundaki `social_interactions_blocked` değişir.
-- Bunu direkt auth.users.raw_app_meta_data içine gömecek bir trigger yazıyoruz.
-- Not: Bu sayede RLS fonksiyonları public.users'a gitmeden kimlik kartından (JWT) okuyabilir.

create or replace function public.sync_user_status_to_auth()
returns trigger
language plpgsql
security definer
as $$
begin
  update auth.users
  set raw_app_meta_data = 
    coalesce(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('social_interactions_blocked', new.social_interactions_blocked)
  where id = new.id;
  
  return new;
end;
$$;

drop trigger if exists on_user_status_change on public.users;
create trigger on_user_status_change
after update of social_interactions_blocked on public.users
for each row
when (old.social_interactions_blocked is distinct from new.social_interactions_blocked)
execute function public.sync_user_status_to_auth();

-- Ve RLS fonksiyonunu 0ms (JWT) olarak güncelliyoruz.
create or replace function public.current_user_social_interactions_blocked()
returns boolean
language sql
stable
as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'social_interactions_blocked')::boolean,
    false
  );
$$;
