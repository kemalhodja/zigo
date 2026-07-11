-- Migration: 068_post_audience_and_parent_dm_gates
-- Description: Add target_audience and target_grade columns to social_posts for teacher targeted sharing (Sadece Veli / Sınıf / Genel).

alter table public.social_posts
  add column if not exists target_audience text not null default 'all'
    check (target_audience in ('all', 'parent_only', 'grade')),
  add column if not exists target_grade text null;

create index if not exists idx_social_posts_audience
  on public.social_posts (target_audience, target_grade);

comment on column public.social_posts.target_audience is 'Target audience: all (Everyone), parent_only (Only parents), or grade (Specific grade/class level)';
comment on column public.social_posts.target_grade is 'Target grade level if target_audience = grade (e.g., 1-4. Sınıf, 5-8. Sınıf, Okul Öncesi)';
