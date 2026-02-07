create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tg_user_id bigint unique not null,
  first_name text,
  last_name text,
  username text,
  photo_url text,
  bio text,
  city text,
  timezone text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid references public.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_skills (
  user_id uuid references public.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  level int,
  primary key (user_id, skill_id)
);

create table if not exists public.user_interests (
  user_id uuid references public.users(id) on delete cascade,
  interest_id uuid references public.interests(id) on delete cascade,
  primary key (user_id, interest_id)
);

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  circle_id uuid references public.circles(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  constraint posts_content_len check (char_length(content) <= 120)
);

create table if not exists public.match_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  opt_in boolean not null default false,
  availability_notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references public.users(id) on delete cascade,
  user_b uuid references public.users(id) on delete cascade,
  score numeric,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint matches_status check (status in ('pending','consented','declined','expired'))
);

create table if not exists public.match_consents (
  match_id uuid references public.matches(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  consent boolean not null,
  consented_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade,
  starts_at timestamptz,
  remind_at timestamptz,
  status text not null default 'scheduled'
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  body text,
  url text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint content_type check (type in ('text','video','audio'))
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes(id) on delete cascade,
  question text not null,
  position int not null default 0
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.quiz_questions(id) on delete cascade,
  answer text not null,
  is_correct boolean not null default false
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  score int,
  created_at timestamptz not null default now()
);

create or replace view public.public_profiles as
select
  id,
  first_name,
  last_name,
  username,
  bio,
  city,
  created_at
from public.users;

create or replace view public.match_view as
select
  m.id,
  m.status,
  m.score,
  m.created_at,
  case when m.user_a = auth.uid() then u2.first_name || ' ' || coalesce(u2.last_name,'') else u1.first_name || ' ' || coalesce(u1.last_name,'') end as partner_name,
  case when m.user_a = auth.uid() then u2.username else u1.username end as partner_username,
  case when m.user_a = auth.uid() then u2.bio else u1.bio end as partner_bio
from public.matches m
join public.users u1 on u1.id = m.user_a
join public.users u2 on u2.id = m.user_b
where m.user_a = auth.uid() or m.user_b = auth.uid();

grant select on public.public_profiles to anon, authenticated;
grant select on public.match_view to anon, authenticated;

alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.skills enable row level security;
alter table public.interests enable row level security;
alter table public.user_skills enable row level security;
alter table public.user_interests enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.posts enable row level security;
alter table public.match_preferences enable row level security;
alter table public.matches enable row level security;
alter table public.match_consents enable row level security;
alter table public.events enable row level security;
alter table public.content_items enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;
alter table public.quiz_attempts enable row level security;

revoke all on public.users from anon, authenticated;

grant select (id, first_name, last_name, username, bio, city, created_at) on public.users to anon, authenticated;

create policy "users_select_self" on public.users
  for select using (auth.uid() = id);

create policy "users_select_public" on public.users
  for select using (true);

create policy "users_update_self" on public.users
  for update using (auth.uid() = id);

create policy "posts_read" on public.posts
  for select using (true);

create policy "posts_write" on public.posts
  for insert with check (auth.uid() = user_id);

create policy "posts_update" on public.posts
  for update using (auth.uid() = user_id);

create policy "skills_read" on public.skills
  for select using (true);

create policy "interests_read" on public.interests
  for select using (true);

create policy "circles_read" on public.circles
  for select using (true);

create policy "circle_members_read" on public.circle_members
  for select using (auth.uid() = user_id);

create policy "circle_members_write" on public.circle_members
  for insert with check (auth.uid() = user_id);

create policy "match_preferences_read" on public.match_preferences
  for select using (auth.uid() = user_id);

create policy "match_preferences_write" on public.match_preferences
  for insert with check (auth.uid() = user_id);

create policy "match_preferences_update" on public.match_preferences
  for update using (auth.uid() = user_id);

create policy "matches_read" on public.matches
  for select using (auth.uid() = user_a or auth.uid() = user_b);

create policy "match_consents_read" on public.match_consents
  for select using (auth.uid() = user_id);

create policy "match_consents_write" on public.match_consents
  for insert with check (auth.uid() = user_id);

create policy "content_read" on public.content_items
  for select using (true);

create policy "quizzes_read" on public.quizzes
  for select using (true);

create policy "quiz_questions_read" on public.quiz_questions
  for select using (true);

create policy "quiz_answers_read" on public.quiz_answers
  for select using (true);

create policy "quiz_attempts_self" on public.quiz_attempts
  for select using (auth.uid() = user_id);

create policy "quiz_attempts_write" on public.quiz_attempts
  for insert with check (auth.uid() = user_id);

-- Admin policies (simple role check)
create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists (
    select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin'
  );
$$;

create policy "admin_write_circles" on public.circles
  for insert with check (public.is_admin());

create policy "admin_write_content" on public.content_items
  for insert with check (public.is_admin());

create policy "admin_write_skills" on public.skills
  for insert with check (public.is_admin());

create policy "admin_write_interests" on public.interests
  for insert with check (public.is_admin());

create policy "admin_write_quizzes" on public.quizzes
  for insert with check (public.is_admin());

create policy "admin_write_questions" on public.quiz_questions
  for insert with check (public.is_admin());

create policy "admin_write_answers" on public.quiz_answers
  for insert with check (public.is_admin());
