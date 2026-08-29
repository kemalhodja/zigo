create or replace function public.auto_hide_social_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.social_posts where id = p_post_id;
end;
$$;

grant execute on function public.auto_hide_social_post(uuid) to authenticated;
