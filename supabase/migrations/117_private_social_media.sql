-- Keep student/teacher social media behind authenticated signed URLs.
-- Feed visibility is enforced by the social-post/story queries; this storage
-- policy only prevents anonymous direct bucket reads.
update storage.buckets
set public = false
where id = 'social-media';

drop policy if exists "Social media is publicly readable" on storage.objects;
drop policy if exists "Authenticated users can read social media" on storage.objects;

create policy "Authenticated users can read social media"
on storage.objects
for select
to authenticated
using (bucket_id = 'social-media');
