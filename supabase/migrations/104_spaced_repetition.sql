-- Migration: 104_spaced_repetition.sql
-- SM-2 aralikli tekrar motoru (roadmap #12)
-- Kartlar soru anlik görüntüsünü tasir (self-contained); kaynak: UGC quiz yanlislari.

create table if not exists public.review_items (
    id uuid default gen_random_uuid() primary key,
    user_id uuid not null references public.users(id) on delete cascade,
    source text not null,
    source_ref text not null,
    question_text text not null,
    options jsonb not null,
    correct_index int not null check (correct_index >= 0),
    ease_factor real not null default 2.5 check (ease_factor >= 1.3),
    interval_days int not null default 0 check (interval_days >= 0),
    repetitions int not null default 0 check (repetitions >= 0),
    due_at timestamptz not null default now(),
    last_reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    unique (user_id, source, source_ref)
);

create index if not exists idx_review_items_due
    on public.review_items (user_id, due_at asc);

alter table public.review_items enable row level security;

drop policy if exists "Users manage own review items" on public.review_items;
create policy "Users manage own review items"
on public.review_items
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update, delete on public.review_items to authenticated;
grant all on public.review_items to service_role;

notify pgrst, 'reload schema';
