insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social-media',
  'social-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Social media is publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'social-media');

create policy "Verified teachers can upload social media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'social-media'
  and owner = auth.uid()
  and public.current_user_is_verified_teacher()
);

create policy "Users can update own social media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'social-media'
  and owner = auth.uid()
)
with check (
  bucket_id = 'social-media'
  and owner = auth.uid()
);

create policy "Users can delete own social media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'social-media'
  and owner = auth.uid()
);
