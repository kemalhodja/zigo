-- Migration 087: Expand social-media storage file size limit to 100MB and ensure media_url is text

update storage.buckets
set file_size_limit = 104857600
where id = 'social-media';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'social_posts' and column_name = 'media_url'
  ) then
    alter table public.social_posts alter column media_url type text;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'stories' and column_name = 'media_url'
  ) then
    alter table public.stories alter column media_url type text;
  end if;
end $$;

drop policy if exists "Verified teachers can upload social media" on storage.objects;

create policy "Verified teachers can upload social media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'social-media'
  and (name like (auth.uid()::text || '/%') or owner = auth.uid() or owner is null)
  and public.current_user_is_verified_teacher()
);
