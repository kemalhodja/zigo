create or replace function public.social_post_matches_current_user(p_post_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.social_posts sp
    join public.users author on author.id = sp.author_id
    where sp.id = p_post_id and (
      sp.author_id = auth.uid()
      or (
        -- Takipçilere özel veya öğrenci/veli gönderilerinde, sadece takip edenler görebilir.
        (sp.target_audience = 'followers' or author.role::text in ('student', 'parent'))
        and exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid() and f.following_id = sp.author_id
        )
      )
      or (
        -- Herkese açık öğretmen/kurum gönderilerini Zigo'daki herkes görebilir (Keşfet akışı için gerekli).
        sp.target_audience <> 'followers'
        and author.role::text not in ('student', 'parent')
      )
    )
  );
$$;
