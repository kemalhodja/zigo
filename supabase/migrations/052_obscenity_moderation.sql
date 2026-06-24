-- Müstehcen / uygunsuz içerik filtresi (öğrenci güvenliği).

alter table public.blocked_keywords
  drop constraint if exists blocked_keywords_category_check;

alter table public.blocked_keywords
  add constraint blocked_keywords_category_check check (
    category in (
      'profanity',
      'bullying',
      'self_harm',
      'personal_info',
      'off_platform',
      'spam',
      'obscenity'
    )
  );

insert into public.blocked_keywords (keyword, category)
values
  ('porno izle', 'obscenity'),
  ('porn izle', 'obscenity'),
  ('çıplak foto', 'obscenity'),
  ('ciplak foto', 'obscenity'),
  ('çıplak video', 'obscenity'),
  ('ciplak video', 'obscenity'),
  ('seks videosu', 'obscenity'),
  ('seks video', 'obscenity'),
  ('müstehcen video', 'obscenity'),
  ('mustehcen video', 'obscenity'),
  ('erotik video', 'obscenity'),
  ('nsfw içerik', 'obscenity'),
  ('nsfw icerik', 'obscenity'),
  ('müstehcen', 'obscenity'),
  ('mustehcen', 'obscenity'),
  ('porno', 'obscenity'),
  ('pornografi', 'obscenity'),
  ('pornhub', 'obscenity'),
  ('onlyfans', 'obscenity'),
  ('xvideos', 'obscenity'),
  ('xhamster', 'obscenity'),
  ('çıplak', 'obscenity'),
  ('ciplak', 'obscenity'),
  ('çıplaklık', 'obscenity'),
  ('ciplaklik', 'obscenity'),
  ('erotik', 'obscenity'),
  ('nsfw', 'obscenity'),
  ('nude', 'obscenity'),
  ('naked', 'obscenity'),
  ('xxx', 'obscenity'),
  ('hentai', 'obscenity'),
  ('sikiş', 'obscenity'),
  ('sikis', 'obscenity'),
  ('seviş', 'obscenity'),
  ('sevis', 'obscenity'),
  ('masturbasyon', 'obscenity'),
  ('masturb', 'obscenity'),
  ('fuhuş', 'obscenity'),
  ('fuhus', 'obscenity'),
  ('escort', 'obscenity'),
  ('amcık', 'obscenity'),
  ('amcik', 'obscenity'),
  ('yarrak', 'obscenity'),
  ('softcore', 'obscenity'),
  ('hardcore', 'obscenity')
on conflict (keyword) do update
set category = excluded.category,
    is_active = true;

create or replace function public.content_contains_obscenity_pattern(input_text text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select public.normalize_moderation_text(input_text) as value
  ),
  compact as (
    select regexp_replace((select value from normalized), '[^a-z0-9]', '', 'g') as value
  )
  select
    (select value from normalized) ~ '\m(porno izle|porn izle|çıplak foto|ciplak foto|çıplak video|ciplak video|seks videosu|seks video|müstehcen video|mustehcen video|erotik video|nsfw içerik|nsfw icerik)\M'
    or (select value from compact) ~ '(pornhub|onlyfans|xvideos|xhamster|nsfw|hentai|xxx+|nude|mustehcen|müstehcen|porn|p0rn)'
    or (select value from normalized) ~ '\m(müstehcen|mustehcen|porno|pornografi|çıplak|ciplak|erotik|nsfw|hentai|xxx|nude|sikiş|sikis)\M';
$$;

create or replace function public.content_contains_blocked_keyword(input_text text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.blocked_keywords bk
      where bk.is_active
        and length(trim(bk.keyword)) > 0
        and (
          ' ' || public.normalize_moderation_text(input_text) || ' '
        ) like (
          '% ' || public.normalize_moderation_text(bk.keyword) || ' %'
        )
    )
    or public.content_contains_obscenity_pattern(input_text)
    or public.normalize_moderation_text(input_text) ~ '(.)\1{5,}'
    or public.normalize_moderation_text(input_text) ~ '\m(dm)\M';
$$;

grant execute on function public.content_contains_obscenity_pattern(text) to authenticated;
