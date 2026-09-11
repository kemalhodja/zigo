-- Migration: 125_explore_creator_org_roles.sql
-- Keşfet (Explore): Yalnızca bireysel öğretmenler değil, Kurum, Platform ve Yayınevi
-- gibi tüm doğrulanmış içerik üreticilerinin gönderilerinin keşfete düşmesini sağlar.
-- Öğrenci ve veli gönderileri KESİNLİKLE Keşfet'e düşmez.

create or replace function public.list_explore_social_posts(
  p_limit int default 30,
  p_query text default null
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result json;
  safe_limit int := greatest(1, least(coalesce(p_limit, 30), 50));
  trimmed_query text := nullif(trim(coalesce(p_query, '')), '');
begin
  select coalesce(
    json_agg(row_payload order by sort_created_at desc),
    '[]'::json
  )
  into result
  from (
    select
      (to_jsonb(sp) || jsonb_build_object(
        'author', jsonb_build_object(
          'id', u.id,
          'full_name', u.full_name,
          'role', u.role,
          'is_verified', u.is_verified,
          'organization_type', u.organization_type,
          'avatar_url', u.avatar_url
        ),
        'area', jsonb_build_object('area_name', ea.area_name),
        'co_author', case
          when co.id is not null then jsonb_build_object('id', co.id, 'full_name', co.full_name)
          else null
        end
      ))::json as row_payload,
      sp.created_at as sort_created_at
    from public.social_posts sp
    inner join public.users u on u.id = sp.author_id
    left join public.education_areas ea on ea.id = sp.area_id
    left join public.users co on co.id = sp.co_author_id
    where sp.area_id is not null
      -- Yalnızca içerik üreticileri: Öğretmen, Eğitim Kurumu, Eğitim Platformu, Yayınevi
      -- Öğrenci ve Veli gönderileri Keşfet'e ASLA düşmez!
      and u.role::text not in ('student', 'parent')
      and (
        u.is_verified = true
        or u.organization_type in ('kurs', 'okul', 'egitim_kurumu', 'egitim_platformu', 'yayinevi')
      )
      -- Takipçilere özel gönderiler Keşfet'e düşmez
      and coalesce(sp.target_audience, 'all') <> 'followers'
      and (
        trimmed_query is null
        or sp.caption ilike '%' || trimmed_query || '%'
        or sp.location_name ilike '%' || trimmed_query || '%'
        or sp.city ilike '%' || trimmed_query || '%'
        or sp.district ilike '%' || trimmed_query || '%'
      )
      and (
        auth.uid() is null
        or sp.author_id = auth.uid()
        or not exists (
          select 1
          from public.user_blocks ub
          where (
            ub.blocker_id = auth.uid()
            and ub.blocked_id = sp.author_id
          )
          or (
            ub.blocker_id = sp.author_id
            and ub.blocked_id = auth.uid()
          )
        )
      )
    order by sp.created_at desc
    limit safe_limit
  ) rows;

  return result;
end;
$$;

grant execute on function public.list_explore_social_posts(int, text) to authenticated;
grant execute on function public.list_explore_social_posts(int, text) to anon;

notify pgrst, 'reload schema';
