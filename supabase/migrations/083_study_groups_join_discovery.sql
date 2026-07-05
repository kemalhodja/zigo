-- Allow students and parents to discover active study groups before joining.

create policy "Learners can browse active study groups"
on public.study_groups
for select
to authenticated
using (
  status = 'active'::public.study_group_status
  and exists (
    select 1
    from public.users learner
    where learner.id = auth.uid()
      and learner.role in ('student', 'parent')
  )
);

insert into public.zigo_applied_migrations (migration_id)
values ('083_study_groups_join_discovery')
on conflict (migration_id) do nothing;
