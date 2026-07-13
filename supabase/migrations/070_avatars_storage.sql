-- Avatars storage bucket and update update_user_profile RPC

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- RLS policies for avatars storage bucket
create policy "Avatars are publicly readable"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and owner = auth.uid()
);

create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner = auth.uid()
)
with check (
  bucket_id = 'avatars'
  and owner = auth.uid()
);

create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and owner = auth.uid()
);

-- Drop old update_user_profile function to avoid overload conflicts
drop function if exists public.update_user_profile(text, text);

-- Re-create update_user_profile with full_name support
create or replace function public.update_user_profile(
  next_bio text default null,
  next_avatar_url text default null,
  next_full_name text default null
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

  update public.users
  set
    bio = case
      when next_bio is null then bio
      else nullif(left(trim(next_bio), 500), '')
    end,
    avatar_url = case
      when next_avatar_url is null then avatar_url
      else nullif(left(trim(next_avatar_url), 500), '')
    end,
    full_name = case
      when next_full_name is null then full_name
      else coalesce(nullif(left(trim(next_full_name), 100), ''), full_name)
    end
  where id = auth.uid()
  returning * into updated_profile;

  if not found then
    raise exception 'profile was not found';
  end if;

  return updated_profile;
end;
$$;

grant execute on function public.update_user_profile(text, text, text) to authenticated;
