-- Migration 088: Add location fields to social_posts table for location-based explore and tagging

alter table public.social_posts
  add column if not exists location_name varchar(150),
  add column if not exists city varchar(100),
  add column if not exists district varchar(100);

create index if not exists idx_social_posts_location
  on public.social_posts (city, district);

comment on column public.social_posts.location_name is 'Display location name for post (e.g. Kadıköy, İstanbul or Okul Adı)';
comment on column public.social_posts.city is 'City for location-based explore ranking algorithm';
comment on column public.social_posts.district is 'District for location-based explore ranking algorithm';
