-- Additional RLS policies for user tag management and admin visibility

create policy if not exists "user_skills_read" on public.user_skills
  for select using (auth.uid() = user_id);

create policy if not exists "user_skills_write" on public.user_skills
  for insert with check (auth.uid() = user_id);

create policy if not exists "user_skills_delete" on public.user_skills
  for delete using (auth.uid() = user_id);

create policy if not exists "user_interests_read" on public.user_interests
  for select using (auth.uid() = user_id);

create policy if not exists "user_interests_write" on public.user_interests
  for insert with check (auth.uid() = user_id);

create policy if not exists "user_interests_delete" on public.user_interests
  for delete using (auth.uid() = user_id);

create policy if not exists "circle_members_delete" on public.circle_members
  for delete using (auth.uid() = user_id);

create policy if not exists "user_roles_read_self" on public.user_roles
  for select using (auth.uid() = user_id);
