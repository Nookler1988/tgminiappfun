create policy if not exists "user_skills_read_public" on public.user_skills
  for select using (true);

create policy if not exists "user_interests_read_public" on public.user_interests
  for select using (true);
