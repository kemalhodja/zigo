-- 7-day registration trial for new accounts.

alter table public.user_subscriptions
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz;

create or replace function public.grant_registration_trial(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_subscriptions (user_id, tier, trial_started_at, trial_ends_at)
  values (p_user_id, 'free', now(), now() + interval '7 days')
  on conflict (user_id) do update
  set
    trial_started_at = coalesce(public.user_subscriptions.trial_started_at, excluded.trial_started_at),
    trial_ends_at = coalesce(public.user_subscriptions.trial_ends_at, excluded.trial_ends_at),
    updated_at = now()
  where public.user_subscriptions.trial_started_at is null;
end;
$$;

insert into public.zigo_applied_migrations (migration_id)
values ('062_registration_trial')
on conflict (migration_id) do nothing;
