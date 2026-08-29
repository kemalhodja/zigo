alter table public.social_posts add column if not exists followers_only boolean not null default false;
