-- Run manually on Supabase Cloud production after migrations apply.
-- Removes @zigo.test showcase accounts (migration 017/029/033 seeds).

do $$
declare
  demo_user_id uuid;
begin
  for demo_user_id in
    select id from auth.users where email like '%@zigo.test'
  loop
    delete from auth.users where id = demo_user_id;
  end loop;

  delete from public.child_profiles where display_name in ('Elif Demo', 'Ada Demo', 'Mert Demo');

  delete from public.quizzes
  where id in (
    '00000000-0000-4000-8000-000000000701'::uuid,
    '00000000-0000-4000-8000-000000000702'::uuid,
    '00000000-0000-4000-8000-000000000703'::uuid
  );
end $$;
