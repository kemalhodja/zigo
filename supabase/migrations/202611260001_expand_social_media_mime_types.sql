-- Expand social-media bucket MIME types to support modern mobile formats:
-- AVIF images and iPhone MOV (video/quicktime) / M4V short promo videos.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v'
]
where id = 'social-media';
