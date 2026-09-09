create or replace function public.can_view_social_media(target_path text)
returns boolean language sql stable security definer set search_path = public as $$
  select
    target_path like (auth.uid()::text || '/%')
    or exists (
      select 1
      from public.media_uploads mu
      join public.social_posts sp on sp.id = mu.post_id
      where mu.object_path = target_path
        and mu.status = 'attached'
        and public.social_post_matches_current_user(sp.id)
    )
    or exists (
      select 1
      from public.social_posts sp
      where (sp.media_url like ('%' || replace(target_path, '/', '%2F') || '%')
             or sp.media_url like ('%' || target_path || '%'))
        and public.social_post_matches_current_user(sp.id)
    )
    or exists (
      select 1
      from public.stories st
      where (st.media_url like ('%' || replace(target_path, '/', '%2F') || '%')
             or st.media_url like ('%' || target_path || '%'))
        -- Hikayeler herkesin kendi alanındaki doğrulanmış öğretmenlerden geldiği için herkes görebilir.
        -- Süresi dolmuş olsa bile CDN cache veya eski bağlantılar üzerinden gösterimine izin verilir.
    );
$$;
