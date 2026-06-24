-- Only verified teachers may create or update answers (align with posts policy).

drop policy if exists "Teachers can answer assigned area questions" on public.answers;

create policy "Teachers can answer assigned area questions"
on public.answers
for insert
to authenticated
with check (
  teacher_id = auth.uid()
  and public.current_user_is_verified_teacher()
  and exists (
    select 1
    from public.questions
    where questions.id = answers.question_id
      and public.current_user_has_area(questions.area_id)
  )
);

drop policy if exists "Teachers can update own answers" on public.answers;

create policy "Teachers can update own answers"
on public.answers
for update
to authenticated
using (
  teacher_id = auth.uid()
  and public.current_user_is_verified_teacher()
)
with check (
  teacher_id = auth.uid()
  and public.current_user_is_verified_teacher()
);
