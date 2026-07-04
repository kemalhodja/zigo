-- Kurum türü (kurs, okul, eğitim kurumu, eğitim platformu) ve branş seçimi birlikte.

alter table public.users
  add column if not exists organization_type varchar(32);

alter table public.users
  drop constraint if exists users_organization_type_check;

alter table public.users
  add constraint users_organization_type_check check (
    organization_type is null
    or organization_type in ('kurs', 'okul', 'egitim_kurumu', 'egitim_platformu')
  );

create or replace function public.set_user_organization_type(target_type varchar)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_user public.users;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if target_type is not null and target_type not in ('kurs', 'okul', 'egitim_kurumu', 'egitim_platformu') then
    raise exception 'invalid organization type';
  end if;

  update public.users
  set organization_type = target_type
  where id = auth.uid()
  returning * into updated_user;

  if not found then
    raise exception 'profile not found';
  end if;

  return updated_user;
end;
$$;

grant execute on function public.set_user_organization_type(varchar) to authenticated;
