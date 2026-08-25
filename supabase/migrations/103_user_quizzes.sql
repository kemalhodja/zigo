-- Migration: 103_user_quizzes.sql
-- UGC quiz motoru (roadmap #8): ogrenciler quiz uretip paylasir.
-- Moderasyon: ogrenci quizleri 'pending' baslar, dogrulanmis ogretmenler otomatik 'approved'.

create table if not exists public.user_quizzes (
    id uuid default gen_random_uuid() primary key,
    creator_id uuid not null references public.users(id) on delete cascade,
    title text not null check (char_length(title) between 3 and 80),
    description text,
    area_id integer references public.education_areas(id) on delete set null,
    questions jsonb not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    play_count int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint user_quizzes_questions_shape check (
        jsonb_typeof(questions) = 'array'
        and jsonb_array_length(questions) between 3 and 10
    )
);

create index if not exists idx_user_quizzes_approved_recent
    on public.user_quizzes (created_at desc) where status = 'approved';
create index if not exists idx_user_quizzes_creator
    on public.user_quizzes (creator_id, created_at desc);

alter table public.user_quizzes enable row level security;

drop policy if exists "Anyone can view approved quizzes" on public.user_quizzes;
create policy "Anyone can view approved quizzes"
on public.user_quizzes
for select
to authenticated
using (status = 'approved');

drop policy if exists "Creators manage own quizzes" on public.user_quizzes;
create policy "Creators manage own quizzes"
on public.user_quizzes
for select
to authenticated
using (creator_id = auth.uid());

drop policy if exists "Users create own quizzes" on public.user_quizzes;
create policy "Users create own quizzes"
on public.user_quizzes
for insert
to authenticated
with check (creator_id = auth.uid());

drop policy if exists "Users update own pending quizzes" on public.user_quizzes;
create policy "Users update own pending quizzes"
on public.user_quizzes
for update
to authenticated
using (creator_id = auth.uid() and status = 'pending')
with check (creator_id = auth.uid());

grant select, insert, update, delete on public.user_quizzes to authenticated;
grant all on public.user_quizzes to service_role;

-- Best-effort play counter callable by any authenticated user.
create or replace function public.increment_user_quiz_play_count(p_quiz_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update user_quizzes
  set play_count = play_count + 1
  where id = p_quiz_id and status = 'approved';
$$;

grant execute on function public.increment_user_quiz_play_count(uuid) to authenticated;

notify pgrst, 'reload schema';
