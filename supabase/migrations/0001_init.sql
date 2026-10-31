-- ============================================================================
-- LearnSphere Global — 0001_init.sql
-- Complete Supabase schema: tables, RLS, storage, triggers, seed data.
-- Run with:  supabase db push   (or paste into the SQL editor)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";          -- pgvector for AI tutor RAG
create extension if not exists "pg_trgm";         -- fuzzy course search

-- ---------------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('student', 'instructor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type course_level as enum ('beginner', 'intermediate', 'advanced');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_provider as enum ('stripe', 'paystack');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. CORE TABLES
-- ---------------------------------------------------------------------------

-- 2.1 profiles ---------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  full_name        text,
  role             user_role not null default 'student',
  avatar_url       text,
  bio              text,
  headline         text,
  xp_points        integer not null default 0 check (xp_points >= 0),
  streak           integer not null default 0 check (streak >= 0),
  last_active_date date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 2.2 courses ----------------------------------------------------------------
create table if not exists public.courses (
  id             uuid primary key default uuid_generate_v4(),
  instructor_id  uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  slug           text not null unique,
  subtitle       text,
  description    text not null,
  thumbnail_url  text,
  promo_video_url text,
  price          numeric(10,2) not null default 0 check (price >= 0),
  level          course_level not null default 'beginner',
  category       text not null,
  language       text not null default 'English',
  is_published   boolean not null default false,
  rating_avg     numeric(3,2) not null default 0,
  rating_count   integer not null default 0,
  student_count  integer not null default 0,
  duration_minutes integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists courses_instructor_idx on public.courses(instructor_id);
create index if not exists courses_published_idx  on public.courses(is_published) where is_published;
create index if not exists courses_category_idx   on public.courses(category);
create index if not exists courses_title_trgm_idx on public.courses using gin (title gin_trgm_ops);

-- 2.3 modules ----------------------------------------------------------------
create table if not exists public.modules (
  id         uuid primary key default uuid_generate_v4(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  title      text not null,
  summary    text,
  order_no   integer not null default 1,
  created_at timestamptz not null default now(),
  unique (course_id, order_no)
);

create index if not exists modules_course_idx on public.modules(course_id, order_no);

-- 2.4 lessons ----------------------------------------------------------------
create table if not exists public.lessons (
  id              uuid primary key default uuid_generate_v4(),
  module_id       uuid not null references public.modules(id) on delete cascade,
  title           text not null,
  video_url       text,
  duration        integer not null default 0,   -- seconds
  is_free_preview boolean not null default false,
  content_text    text,                          -- transcript / article body (RAG source)
  order_no        integer not null default 1,
  created_at      timestamptz not null default now(),
  unique (module_id, order_no)
);

create index if not exists lessons_module_idx on public.lessons(module_id, order_no);

-- 2.5 enrollments ------------------------------------------------------------
create table if not exists public.enrollments (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  course_id        uuid not null references public.courses(id) on delete cascade,
  progress_percent numeric(5,2) not null default 0 check (progress_percent between 0 and 100),
  completed        boolean not null default false,
  last_lesson_id   uuid references public.lessons(id) on delete set null,
  enrolled_at      timestamptz not null default now(),
  completed_at     timestamptz,
  unique (user_id, course_id)
);

create index if not exists enrollments_user_idx   on public.enrollments(user_id);
create index if not exists enrollments_course_idx on public.enrollments(course_id);

-- 2.6 lesson_progress (per-lesson completion, drives enrollment progress) ----
create table if not exists public.lesson_progress (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  lesson_id    uuid not null references public.lessons(id) on delete cascade,
  course_id    uuid not null references public.courses(id) on delete cascade,
  completed    boolean not null default false,
  watched_seconds integer not null default 0,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists lesson_progress_user_course_idx on public.lesson_progress(user_id, course_id);

-- 2.7 quizzes ----------------------------------------------------------------
create table if not exists public.quizzes (
  id            uuid primary key default uuid_generate_v4(),
  course_id     uuid not null references public.courses(id) on delete cascade,
  module_id     uuid references public.modules(id) on delete cascade,
  title         text not null,
  description   text,
  passing_score integer not null default 70 check (passing_score between 0 and 100),
  created_at    timestamptz not null default now()
);

create index if not exists quizzes_course_idx on public.quizzes(course_id);

-- 2.8 quiz_questions ---------------------------------------------------------
create table if not exists public.quiz_questions (
  id             uuid primary key default uuid_generate_v4(),
  quiz_id        uuid not null references public.quizzes(id) on delete cascade,
  question       text not null,
  options        jsonb not null,          -- ["A","B","C","D"]
  correct_option integer not null check (correct_option >= 0),
  explanation    text,
  order_no       integer not null default 1
);

create index if not exists quiz_questions_quiz_idx on public.quiz_questions(quiz_id, order_no);

-- 2.9 quiz_attempts ----------------------------------------------------------
create table if not exists public.quiz_attempts (
  id         uuid primary key default uuid_generate_v4(),
  quiz_id    uuid not null references public.quizzes(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  score      integer not null default 0,
  passed     boolean not null default false,
  answers    jsonb,
  created_at timestamptz not null default now()
);

-- 2.10 certificates ----------------------------------------------------------
create table if not exists public.certificates (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  course_id       uuid not null references public.courses(id) on delete cascade,
  certificate_no  text not null unique,
  recipient_name  text not null,
  course_title    text not null,
  pdf_url         text,
  issued_at       timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists certificates_user_idx on public.certificates(user_id);

-- 2.11 payments --------------------------------------------------------------
create table if not exists public.payments (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  course_id      uuid not null references public.courses(id) on delete cascade,
  provider       payment_provider not null,
  provider_ref   text not null,
  amount         numeric(10,2) not null,
  currency       text not null default 'USD',
  status         payment_status not null default 'pending',
  raw_event      jsonb,
  created_at     timestamptz not null default now(),
  unique (provider, provider_ref)
);

create index if not exists payments_user_idx on public.payments(user_id);

-- 2.12 reviews ---------------------------------------------------------------
create table if not exists public.reviews (
  id         uuid primary key default uuid_generate_v4(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  unique (course_id, user_id)
);

create index if not exists reviews_course_idx on public.reviews(course_id);

-- 2.13 lesson_embeddings (pgvector RAG) --------------------------------------
create table if not exists public.lesson_embeddings (
  id         uuid primary key default uuid_generate_v4(),
  lesson_id  uuid not null references public.lessons(id) on delete cascade,
  course_id  uuid not null references public.courses(id) on delete cascade,
  chunk      text not null,
  embedding  vector(1536) not null,
  created_at timestamptz not null default now()
);

-- IVFFlat index for cosine similarity search
create index if not exists lesson_embeddings_vec_idx
  on public.lesson_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists lesson_embeddings_course_idx on public.lesson_embeddings(course_id);

-- ---------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS
-- ---------------------------------------------------------------------------

-- is_admin(): true when the caller's profile role is 'admin'
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- is_instructor_of(course): true when caller owns the course
create or replace function public.is_instructor_of(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.courses
    where id = p_course_id and instructor_id = auth.uid()
  );
$$;

-- is_enrolled(course): true when caller has an enrollment
create or replace function public.is_enrolled(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrollments
    where course_id = p_course_id and user_id = auth.uid()
  );
$$;

-- course_of_module(module) / course_of_lesson(lesson) helpers for RLS
create or replace function public.course_of_module(p_module_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select course_id from public.modules where id = p_module_id;
$$;

create or replace function public.course_of_lesson(p_lesson_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select m.course_id from public.lessons l join public.modules m on m.id = l.module_id
  where l.id = p_lesson_id;
$$;

-- updated_at maintenance
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_courses_updated on public.courses;
create trigger trg_courses_updated before update on public.courses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------------

-- 4.1 Auto-create a profile whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4.2 XP + streak award on lesson completion
create or replace function public.award_xp(p_user_id uuid, p_xp integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last date;
  v_streak integer;
begin
  select last_active_date, streak into v_last, v_streak
  from public.profiles where id = p_user_id for update;

  if v_last is null then
    v_streak := 1;
  elsif v_last = current_date then
    v_streak := greatest(v_streak, 1);          -- already counted today
  elsif v_last = current_date - 1 then
    v_streak := v_streak + 1;                    -- consecutive day
  else
    v_streak := 1;                               -- streak broken
  end if;

  update public.profiles
     set xp_points = xp_points + p_xp,
         streak = v_streak,
         last_active_date = current_date
   where id = p_user_id;
end;
$$;

-- 4.3 Recalculate enrollment progress when a lesson is completed
create or replace function public.recalc_enrollment_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
  v_done  integer;
  v_pct   numeric(5,2);
begin
  if new.completed is not true then
    return new;
  end if;

  select count(*) into v_total
  from public.lessons l
  join public.modules m on m.id = l.module_id
  where m.course_id = new.course_id;

  select count(*) into v_done
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  join public.modules m on m.id = l.module_id
  where lp.user_id = new.user_id
    and m.course_id = new.course_id
    and lp.completed = true;

  v_pct := case when v_total = 0 then 0 else round((v_done::numeric / v_total) * 100, 2) end;

  update public.enrollments
     set progress_percent = v_pct,
         completed = (v_pct >= 100),
         completed_at = case when v_pct >= 100 then coalesce(completed_at, now()) else null end,
         last_lesson_id = new.lesson_id
   where user_id = new.user_id and course_id = new.course_id;

  -- gamification: 50 XP per lesson
  perform public.award_xp(new.user_id, 50);

  return new;
end;
$$;

drop trigger if exists trg_lesson_progress_recalc on public.lesson_progress;
create trigger trg_lesson_progress_recalc
  after insert or update of completed on public.lesson_progress
  for each row execute function public.recalc_enrollment_progress();

-- 4.4 Auto-issue a certificate when an enrollment hits 100%
create or replace function public.issue_certificate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name  text;
  v_title text;
  v_no    text;
begin
  if new.progress_percent < 100 or new.completed is not true then
    return new;
  end if;

  select coalesce(full_name, 'Learner') into v_name from public.profiles where id = new.user_id;
  select title into v_title from public.courses where id = new.course_id;

  v_no := 'LSG-' || to_char(now(), 'YYYY') || '-' ||
          upper(substr(replace(new.user_id::text, '-', ''), 1, 6)) || '-' ||
          upper(substr(replace(new.course_id::text, '-', ''), 1, 4));

  insert into public.certificates (user_id, course_id, certificate_no, recipient_name, course_title)
  values (new.user_id, new.course_id, v_no, v_name, v_title)
  on conflict (user_id, course_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_enrollment_certificate on public.enrollments;
create trigger trg_enrollment_certificate
  after update of progress_percent on public.enrollments
  for each row execute function public.issue_certificate();

-- 4.5 Keep course rating aggregates in sync
create or replace function public.sync_course_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course uuid := coalesce(new.course_id, old.course_id);
begin
  update public.courses c
     set rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where course_id = v_course), 0),
         rating_count = (select count(*) from public.reviews where course_id = v_course)
   where c.id = v_course;
  return null;
end;
$$;

drop trigger if exists trg_reviews_rating on public.reviews;
create trigger trg_reviews_rating
  after insert or update or delete on public.reviews
  for each row execute function public.sync_course_rating();

-- 4.6 Keep course duration in sync with lessons
create or replace function public.sync_course_duration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course uuid;
begin
  v_course := public.course_of_lesson(coalesce(new.id, old.id));
  update public.courses c
     set duration_minutes = coalesce((
       select sum(l.duration) / 60
       from public.lessons l join public.modules m on m.id = l.module_id
       where m.course_id = v_course
     ), 0)
   where c.id = v_course;
  return null;
end;
$$;

drop trigger if exists trg_lessons_duration on public.lessons;
create trigger trg_lessons_duration
  after insert or update of duration or delete on public.lessons
  for each row execute function public.sync_course_duration();

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.courses           enable row level security;
alter table public.modules           enable row level security;
alter table public.lessons           enable row level security;
alter table public.enrollments       enable row level security;
alter table public.lesson_progress   enable row level security;
alter table public.quizzes           enable row level security;
alter table public.quiz_questions    enable row level security;
alter table public.quiz_attempts     enable row level security;
alter table public.certificates      enable row level security;
alter table public.payments          enable row level security;
alter table public.reviews           enable row level security;
alter table public.lesson_embeddings enable row level security;

-- 5.1 profiles ---------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- public instructor cards are readable (name/avatar/headline only via view below)
drop policy if exists "profiles_select_instructors" on public.profiles;
create policy "profiles_select_instructors" on public.profiles
  for select using (role = 'instructor');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- 5.2 courses ----------------------------------------------------------------
drop policy if exists "courses_select_published" on public.courses;
create policy "courses_select_published" on public.courses
  for select using (is_published = true or instructor_id = auth.uid() or public.is_admin());

drop policy if exists "courses_insert_instructor" on public.courses;
create policy "courses_insert_instructor" on public.courses
  for insert with check (instructor_id = auth.uid() or public.is_admin());

drop policy if exists "courses_update_owner" on public.courses;
create policy "courses_update_owner" on public.courses
  for update using (instructor_id = auth.uid() or public.is_admin())
  with check (instructor_id = auth.uid() or public.is_admin());

drop policy if exists "courses_delete_owner" on public.courses;
create policy "courses_delete_owner" on public.courses
  for delete using (instructor_id = auth.uid() or public.is_admin());

-- 5.3 modules ----------------------------------------------------------------
drop policy if exists "modules_select" on public.modules;
create policy "modules_select" on public.modules
  for select using (
    exists (select 1 from public.courses c where c.id = course_id and c.is_published)
    or public.is_instructor_of(course_id)
    or public.is_admin()
  );

drop policy if exists "modules_write_owner" on public.modules;
create policy "modules_write_owner" on public.modules
  for all using (public.is_instructor_of(course_id) or public.is_admin())
  with check (public.is_instructor_of(course_id) or public.is_admin());

-- 5.4 lessons ----------------------------------------------------------------
drop policy if exists "lessons_select" on public.lessons;
create policy "lessons_select" on public.lessons
  for select using (
    exists (
      select 1 from public.modules m join public.courses c on c.id = m.course_id
      where m.id = module_id and c.is_published
    )
    or public.is_instructor_of(public.course_of_module(module_id))
    or public.is_admin()
  );

drop policy if exists "lessons_write_owner" on public.lessons;
create policy "lessons_write_owner" on public.lessons
  for all using (public.is_instructor_of(public.course_of_module(module_id)) or public.is_admin())
  with check (public.is_instructor_of(public.course_of_module(module_id)) or public.is_admin());

-- 5.5 enrollments ------------------------------------------------------------
drop policy if exists "enrollments_select_own" on public.enrollments;
create policy "enrollments_select_own" on public.enrollments
  for select using (
    user_id = auth.uid()
    or public.is_instructor_of(course_id)   -- instructors see their students
    or public.is_admin()
  );

drop policy if exists "enrollments_insert_own" on public.enrollments;
create policy "enrollments_insert_own" on public.enrollments
  for insert with check (user_id = auth.uid());

drop policy if exists "enrollments_update_own" on public.enrollments;
create policy "enrollments_update_own" on public.enrollments
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- 5.6 lesson_progress --------------------------------------------------------
drop policy if exists "lesson_progress_own" on public.lesson_progress;
create policy "lesson_progress_own" on public.lesson_progress
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "lesson_progress_instructor_read" on public.lesson_progress;
create policy "lesson_progress_instructor_read" on public.lesson_progress
  for select using (public.is_instructor_of(course_id));

-- 5.7 quizzes / questions ----------------------------------------------------
drop policy if exists "quizzes_select" on public.quizzes;
create policy "quizzes_select" on public.quizzes
  for select using (
    public.is_enrolled(course_id) or public.is_instructor_of(course_id) or public.is_admin()
  );

drop policy if exists "quizzes_write_owner" on public.quizzes;
create policy "quizzes_write_owner" on public.quizzes
  for all using (public.is_instructor_of(course_id) or public.is_admin())
  with check (public.is_instructor_of(course_id) or public.is_admin());

drop policy if exists "quiz_questions_select" on public.quiz_questions;
create policy "quiz_questions_select" on public.quiz_questions
  for select using (
    exists (
      select 1 from public.quizzes q
      where q.id = quiz_id
        and (public.is_enrolled(q.course_id) or public.is_instructor_of(q.course_id) or public.is_admin())
    )
  );

drop policy if exists "quiz_questions_write_owner" on public.quiz_questions;
create policy "quiz_questions_write_owner" on public.quiz_questions
  for all using (
    exists (select 1 from public.quizzes q where q.id = quiz_id and public.is_instructor_of(q.course_id))
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.quizzes q where q.id = quiz_id and public.is_instructor_of(q.course_id))
    or public.is_admin()
  );

-- 5.8 quiz_attempts ----------------------------------------------------------
drop policy if exists "quiz_attempts_own" on public.quiz_attempts;
create policy "quiz_attempts_own" on public.quiz_attempts
  for all using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- 5.9 certificates -----------------------------------------------------------
drop policy if exists "certificates_select_own" on public.certificates;
create policy "certificates_select_own" on public.certificates
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "certificates_insert_own" on public.certificates;
create policy "certificates_insert_own" on public.certificates
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "certificates_update_own" on public.certificates;
create policy "certificates_update_own" on public.certificates
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- 5.10 payments --------------------------------------------------------------
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "payments_insert_own" on public.payments;
create policy "payments_insert_own" on public.payments
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "payments_admin_all" on public.payments;
create policy "payments_admin_all" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- 5.11 reviews ---------------------------------------------------------------
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews
  for select using (true);

drop policy if exists "reviews_insert_enrolled" on public.reviews;
create policy "reviews_insert_enrolled" on public.reviews
  for insert with check (user_id = auth.uid() and public.is_enrolled(course_id));

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own" on public.reviews
  for delete using (user_id = auth.uid() or public.is_admin());

-- 5.12 lesson_embeddings -----------------------------------------------------
-- Readable by enrolled students (needed for RAG), writable by service role only.
drop policy if exists "lesson_embeddings_select_enrolled" on public.lesson_embeddings;
create policy "lesson_embeddings_select_enrolled" on public.lesson_embeddings
  for select using (public.is_enrolled(course_id) or public.is_instructor_of(course_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. RPC: vector similarity search used by the ai-tutor-chat edge function
-- ---------------------------------------------------------------------------
create or replace function public.match_lesson_chunks(
  p_course_id uuid,
  p_embedding vector(1536),
  p_match_count integer default 5
)
returns table (
  lesson_id uuid,
  chunk text,
  similarity double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select le.lesson_id,
         le.chunk,
         1 - (le.embedding <=> p_embedding) as similarity
  from public.lesson_embeddings le
  where le.course_id = p_course_id
  order by le.embedding <=> p_embedding
  limit p_match_count;
$$;

-- ---------------------------------------------------------------------------
-- 7. STORAGE BUCKETS
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('course-thumbnails', 'course-thumbnails', true, 5242880,  array['image/png','image/jpeg','image/webp','image/avif']),
  ('course-videos',     'course-videos',     true, 5368709120, array['video/mp4','video/webm','video/quicktime']),
  ('certificates',      'certificates',      true, 10485760, array['application/pdf'])
on conflict (id) do nothing;

-- Public read for all three buckets
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('course-thumbnails','course-videos','certificates'));

-- Owner write: path must start with the uploader's uid
drop policy if exists "storage_owner_insert" on storage.objects;
create policy "storage_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('course-thumbnails','course-videos','certificates')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_owner_update" on storage.objects;
create policy "storage_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('course-thumbnails','course-videos','certificates')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_owner_delete" on storage.objects;
create policy "storage_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('course-thumbnails','course-videos','certificates')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- 8. SEED DATA — 3 real, fully written demo courses
-- ---------------------------------------------------------------------------
-- Demo auth users. In a hosted project run this block with the service role
-- (SQL editor) — it writes to auth.users so the profile trigger fires.
do $$
declare
  v_amara  uuid := '11111111-1111-4111-8111-111111111111';
  v_daniel uuid := '22222222-2222-4222-8222-222222222222';
  v_mei    uuid := '33333333-3333-4333-8333-333333333333';
  v_student uuid := '44444444-4444-4444-8444-444444444444';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token
  )
  values
    ('00000000-0000-0000-0000-000000000000', v_amara, 'authenticated', 'authenticated',
     'amara@learnsphere.demo', crypt('DemoPass123!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Amara Okafor","role":"instructor"}'::jsonb, now(), now(), '', ''),
    ('00000000-0000-0000-0000-000000000000', v_daniel, 'authenticated', 'authenticated',
     'daniel@learnsphere.demo', crypt('DemoPass123!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Daniel Reyes","role":"instructor"}'::jsonb, now(), now(), '', ''),
    ('00000000-0000-0000-0000-000000000000', v_mei, 'authenticated', 'authenticated',
     'mei@learnsphere.demo', crypt('DemoPass123!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Mei Lin","role":"instructor"}'::jsonb, now(), now(), '', ''),
    ('00000000-0000-0000-0000-000000000000', v_student, 'authenticated', 'authenticated',
     'student@learnsphere.demo', crypt('DemoPass123!', gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"full_name":"Jesse Anomuoghar","role":"student"}'::jsonb, now(), now(), '', '')
  on conflict (id) do nothing;

  -- enrich instructor profiles
  update public.profiles set
    headline = 'Staff Engineer · ex-Vercel · Next.js core contributor',
    bio = 'Amara has shipped production Next.js apps for fintech and media companies across three continents. She teaches the patterns she actually uses at work — no toy examples.',
    avatar_url = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
    xp_points = 12400, streak = 41
  where id = v_amara;

  update public.profiles set
    headline = 'Head of Analytics · ex-Shopify',
    bio = 'Daniel builds the analytics stacks that product teams actually trust. He has modelled event data for 40M+ monthly users and now teaches the modelling discipline behind it.',
    avatar_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    xp_points = 9800, streak = 17
  where id = v_daniel;

  update public.profiles set
    headline = 'Design Systems Lead · ex-Stripe',
    bio = 'Mei has maintained design systems used by 300+ engineers. Her work sits at the seam between Figma and code, where most systems quietly fall apart.',
    avatar_url = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    xp_points = 7600, streak = 23
  where id = v_mei;

  update public.profiles set xp_points = 340, streak = 6, last_active_date = current_date
  where id = v_student;
end $$;

-- 8.1 COURSE 1 — Full-Stack TypeScript with Next.js 14 & Supabase ------------
do $$
declare
  v_course uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  v_m1 uuid := 'aaaaaaaa-0000-4000-8000-000000000101';
  v_m2 uuid := 'aaaaaaaa-0000-4000-8000-000000000102';
  v_m3 uuid := 'aaaaaaaa-0000-4000-8000-000000000103';
  v_quiz uuid := 'aaaaaaaa-0000-4000-8000-000000000201';
begin
  insert into public.courses (
    id, instructor_id, title, slug, subtitle, description, thumbnail_url,
    price, level, category, language, is_published, student_count
  ) values (
    v_course,
    '11111111-1111-4111-8111-111111111111',
    'Full-Stack TypeScript with Next.js 14 & Supabase',
    'fullstack-typescript-nextjs-supabase',
    'Ship a production SaaS from empty folder to deployed app — auth, database, payments and all.',
    E'Most Next.js courses stop at a todo list. This one builds the thing you actually get paid for.\n\nOver 9 hours you will build "Ledgerly", a multi-tenant invoicing SaaS: server components that stream, row-level security that holds up under audit, Stripe subscriptions with webhooks that do not double-charge, and a deploy pipeline you can hand to a teammate.\n\nWe work in TypeScript end to end. Every file in the course is a file you will reuse. There is no custom Node server anywhere — Supabase is the backend, and you will learn exactly how far that gets you (further than you think) and where the seams are.\n\nBy the end you will have a deployed, authenticated, paying-customer-ready application and a mental model for when to reach for a server action versus an edge function.',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80',
    89.99, 'intermediate', 'Web Development', 'English', true, 18420
  ) on conflict (id) do nothing;

  insert into public.modules (id, course_id, title, summary, order_no) values
    (v_m1, v_course, 'Foundations: App Router & Data Modelling',
     'Set up the project, understand server vs client components, and model a multi-tenant schema that RLS can actually protect.', 1),
    (v_m2, v_course, 'Auth, RLS and the Server Boundary',
     'Supabase Auth with email, OAuth and magic links. Then the part everyone gets wrong: writing policies that survive a pen test.', 2),
    (v_m3, v_course, 'Payments, Webhooks and Deployment',
     'Stripe subscriptions, idempotent webhook handling, and a deploy that you can roll back at 2am.', 3)
  on conflict (id) do nothing;

  insert into public.lessons (module_id, title, video_url, duration, is_free_preview, content_text, order_no) values
    (v_m1, 'Why Supabase as your only backend',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 742, true,
     E'In this lesson we draw the boundary. A Supabase-only architecture means Postgres is your source of truth, Row Level Security is your authorisation layer, and Edge Functions are your escape hatch for anything that needs a secret.\n\nWe compare three shapes: a traditional Node API, a BFF (backend-for-frontend) on the server, and direct-to-database with RLS. The third is the one this course uses, and the reason is simple: every request that goes through your own API is a request you have to authorise twice. With RLS you authorise once, in the database, where it cannot be bypassed by a forgotten route handler.\n\nThe trade-off is real. You give up the ability to do arbitrary server-side orchestration on every read. We will show you the three places that hurts and how to solve each with a Postgres function, a view, or an Edge Function.', 1),
    (v_m1, 'Project setup and the folder that scales',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 1105, false,
     E'We scaffold with create-next-app, pin TypeScript strict mode, and lay out the app directory by feature rather than by file type. The rule: a route folder owns its components, its queries and its types. Shared primitives live in /src/components/ui and are the only things allowed to be imported across features.\n\nWe also generate database types with the Supabase CLI. This is not optional. Hand-written types drift within a week, and the drift is silent — you get a runtime undefined instead of a compile error. `supabase gen types typescript` gives you a Database type that flows into every client call.\n\nFinally we set up the three environment variables and explain why the anon key is safe to ship to the browser while the service role key is not.', 2),
    (v_m1, 'Modelling multi-tenant data',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 1288, false,
     E'Multi-tenancy in Postgres has three common shapes: separate databases, separate schemas, and a tenant_id column on every table. We use the third, because it is the only one that lets a single connection pool serve every tenant efficiently.\n\nThe cost is that every query must filter by tenant, and every policy must check it. We make that structural rather than a discipline problem: the tenant_id is never nullable, it is part of every composite index, and the RLS policy reads it from the JWT claim rather than from a query parameter the client could forge.\n\nWe walk through the invoices, customers and line_items tables and show the index that makes the tenant filter free.', 3),
    (v_m1, 'Server Components, Client Components, and where the line is',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 964, false,
     E'The App Router default is a server component, and that default is correct. A server component can query Postgres directly, streams its HTML as data arrives, and ships zero JavaScript to the browser.\n\nYou reach for a client component only when you need state, an effect, an event handler, or a browser API. The mistake is making a whole page a client component because one button needs onClick. Instead, push the boundary down: the page stays a server component, and a small leaf becomes the client island.\n\nWe refactor a page that was 100% client-side into a server shell with two client islands, and measure the JavaScript payload drop from 214KB to 38KB.', 4)
  on conflict do nothing;

  insert into public.lessons (module_id, title, video_url, duration, is_free_preview, content_text, order_no) values
    (v_m2, 'Supabase Auth: email, Google and magic links',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 1342, false,
     E'We wire three sign-in paths against one auth.users table. Email and password is the baseline. Google OAuth is a redirect flow that Supabase handles for you once the provider is configured. Magic links are the one that surprises people: they are a one-time token in a URL, and they break if your redirect allow-list is wrong.\n\nThe important detail is the callback route. Supabase sends the user back to /auth/callback with a code, and you exchange that code for a session cookie on the server. If you do this in a client component the cookie is set in the wrong context and the user appears logged out on refresh.\n\nWe also cover the profile trigger: a row in public.profiles is created the moment auth.users gets a row, so there is never a window where a logged-in user has no profile.', 1),
    (v_m2, 'Writing RLS policies that survive review',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 1610, false,
     E'RLS is not a feature you add at the end. It is the authorisation model, and it has to be designed with the schema.\n\nWe start with the four policies every table needs: select, insert, update, delete. Then we make them fast. A policy that calls a function per row will table-scan; a policy that reads auth.uid() directly and compares to an indexed column will not. We show the query plan before and after.\n\nThe subtle bug we spend real time on: `using` versus `with check`. `using` filters what you can see. `with check` validates what you can write. A policy with only `using` lets a user update a row so that it no longer matches the policy — they can hand their record to someone else. Every update policy in this course has both.\n\nWe finish with the admin escape hatch: an is_admin() function marked security definer, so it can read the profiles table without recursing into its own policy.', 2),
    (v_m2, 'Server actions, route handlers and the service role',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 1187, false,
     E'Three ways to run server code, three different trust levels.\n\nA server action runs in the request context of the logged-in user, so RLS applies. Use it for anything a user initiates: creating an invoice, updating a profile.\n\nA route handler is a plain HTTP endpoint. It has no user context unless you add one, which makes it the right home for webhooks and the wrong home for user data.\n\nThe service role key bypasses RLS entirely. It belongs in exactly two places: a route handler that has already verified a webhook signature, and a scheduled job. We show the pattern that keeps it out of every other file — a single module that throws if imported from a client bundle.', 3),
    (v_m2, 'Storage: uploads, signed URLs and image transforms',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', 903, false,
     E'Files are the part of a Supabase app people hack together. We do it properly.\n\nBuckets are either public or private. Public buckets serve through a CDN with no auth — right for course thumbnails, wrong for invoices. Private buckets require a signed URL, which expires, which means you generate it on the server at render time.\n\nWe implement a direct-to-storage upload: the browser gets a signed upload URL, PUTs the file straight to storage, and never routes a 200MB video through your server. Then we add the storage policy that makes it safe — the object path must begin with the uploader''s user id, so a user cannot overwrite someone else''s file by guessing a path.', 4)
  on conflict do nothing;

  insert into public.lessons (module_id, title, video_url, duration, is_free_preview, content_text, order_no) values
    (v_m3, 'Stripe subscriptions without the double charge',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 1455, false,
     E'Checkout is easy. Keeping your database in sync with Stripe is the hard part, and the failure mode is charging someone twice.\n\nThe rule: Stripe is the source of truth for subscription state, your database is a cache. You never write "this user is subscribed" from the client. You write it from a webhook, and the webhook is idempotent because you store the event id and ignore repeats.\n\nWe build the checkout session, the webhook handler, and the reconciliation job that runs nightly and fixes any drift. Then we deliberately replay a webhook three times and watch the handler do the right thing.', 1),
    (v_m3, 'Idempotency, retries and the outbox pattern',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', 1021, false,
     E'Every external call in your system will eventually be delivered twice, out of order, or not at all. This lesson is the toolkit for that reality.\n\nIdempotency keys make a write safe to repeat. An outbox table makes a side effect (send email, provision access) survive a crash between the database write and the external call. A retry with exponential backoff and a dead-letter row makes a failing integration visible instead of silent.\n\nWe implement all three in about 120 lines and then break the process mid-transaction to prove the outbox recovers.', 2),
    (v_m3, 'Deploying: preview, production and rollback',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 876, false,
     E'Deployment is a workflow, not a button.\n\nEvery pull request gets a preview deployment with its own database branch. That is the single highest-leverage thing you can do for review quality — a reviewer clicks a link and sees the change running against real data.\n\nProduction deploys run migrations first, then the app, and the migration must be backwards compatible with the previous app version for the window between the two. We show the expand-contract pattern that makes that true.\n\nFinally, rollback: you cannot un-run a migration, so the rollback plan is always a forward migration. We write one live.', 3)
  on conflict do nothing;

  insert into public.quizzes (id, course_id, module_id, title, description, passing_score) values
    (v_quiz, v_course, v_m2, 'RLS & Auth checkpoint',
     'Six questions on policies, the server boundary and storage. You need 70% to pass.', 70)
  on conflict (id) do nothing;

  insert into public.quiz_questions (quiz_id, question, options, correct_option, explanation, order_no) values
    (v_quiz, 'A table has an UPDATE policy with only a USING clause. What can a user do?',
     '["Nothing — the policy is invalid","Update rows they can see, including changing values so the row no longer matches the policy","Only update rows they own","Update any row in the table"]'::jsonb, 1,
     'USING filters which rows are visible to the UPDATE. WITH CHECK validates the new row. Without WITH CHECK a user can move a row out of their own scope.', 1),
    (v_quiz, 'Where should the service role key live?',
     '["In the browser bundle, it is fine","In a NEXT_PUBLIC_ variable","Only in server code that has already verified the caller, such as a signed webhook handler","In the database"]'::jsonb, 2,
     'The service role bypasses RLS entirely. It must never reach a client bundle and must only be used after the caller has been independently verified.', 2),
    (v_quiz, 'Why exchange the OAuth code in a route handler rather than a client component?',
     '["It is faster","The session cookie must be set in the server response context","Client components cannot read URLs","Supabase requires it for Google only"]'::jsonb, 1,
     'The code-for-session exchange sets an HTTP-only cookie. Doing it client-side sets it in the wrong context and the session is lost on refresh.', 3),
    (v_quiz, 'A storage policy checks that the object path starts with the uploader''s user id. What attack does this prevent?',
     '["SQL injection","A user overwriting another user''s file by guessing its path","Denial of service","Cross-site scripting"]'::jsonb, 1,
     'Without the path check, any authenticated user could PUT to another user''s object path and replace their file.', 4),
    (v_quiz, 'Which is the correct statement about server components?',
     '["They run in the browser and can use useState","They run on the server, can query the database directly, and ship no JavaScript","They cannot be nested","They require a custom Node server"]'::jsonb, 1,
     'Server components execute on the server, can await a database call directly, and contribute nothing to the client bundle.', 5),
    (v_quiz, 'Your webhook handler receives the same Stripe event three times. What makes this safe?',
     '["Stripe guarantees single delivery","Storing the event id and ignoring repeats","Using a database transaction","Returning 200 quickly"]'::jsonb, 1,
     'Stripe retries. Idempotency comes from recording the event id and short-circuiting on a repeat.', 6)
  on conflict do nothing;

  insert into public.reviews (course_id, user_id, rating, comment) values
    (v_course, '44444444-4444-4444-8444-444444444444', 5,
     'The RLS section alone was worth the price. I had been shipping `using`-only policies for a year without realising the hole. The webhook idempotency lesson saved us from a real double-charge incident.')
  on conflict (course_id, user_id) do nothing;
end $$;

-- 8.2 COURSE 2 — Product Analytics with SQL & dbt ----------------------------
do $$
declare
  v_course uuid := 'bbbbbbbb-0000-4000-8000-000000000001';
  v_m1 uuid := 'bbbbbbbb-0000-4000-8000-000000000101';
  v_m2 uuid := 'bbbbbbbb-0000-4000-8000-000000000102';
  v_m3 uuid := 'bbbbbbbb-0000-4000-8000-000000000103';
  v_quiz uuid := 'bbbbbbbb-0000-4000-8000-000000000201';
begin
  insert into public.courses (
    id, instructor_id, title, slug, subtitle, description, thumbnail_url,
    price, level, category, language, is_published, student_count
  ) values (
    v_course,
    '22222222-2222-4222-8222-222222222222',
    'Product Analytics with SQL & dbt',
    'product-analytics-sql-dbt',
    'Turn raw event logs into the four numbers your leadership team actually asks about.',
    E'Analytics teams drown in dashboards nobody trusts. The cause is almost never the BI tool — it is the modelling underneath it.\n\nThis course builds a warehouse from raw event data to a tested, documented, version-controlled semantic layer using dbt. You will work with a realistic 4.2M-row event dataset from a subscription product and answer the questions that matter: activation, retention, expansion and churn.\n\nWe spend real time on the unglamorous parts that decide whether anyone believes your numbers: defining a metric once, testing it, and making the definition impossible to fork. You will write dbt tests that fail loudly when a join fans out, and you will learn to read a query plan well enough to know why a dashboard takes 40 seconds.\n\nNo prior dbt experience needed. Solid SQL is assumed — you should be comfortable with joins, window functions and CTEs.',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
    64.99, 'intermediate', 'Data Science', 'English', true, 9310
  ) on conflict (id) do nothing;

  insert into public.modules (id, course_id, title, summary, order_no) values
    (v_m1, v_course, 'Event Data and the Warehouse',
     'What a clean event stream looks like, why most of them are not, and how to model sessions and identities.', 1),
    (v_m2, v_course, 'dbt: Models, Tests and Documentation',
     'Build a layered dbt project — staging, intermediate, marts — with tests that catch the bugs that make numbers wrong.', 2),
    (v_m3, v_course, 'The Four Metrics That Matter',
     'Activation, retention, expansion and churn — defined once, tested, and shipped to a dashboard people trust.', 3)
  on conflict (id) do nothing;

  insert into public.lessons (module_id, title, video_url, duration, is_free_preview, content_text, order_no) values
    (v_m1, 'Anatomy of a trustworthy event stream',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 812, true,
     E'An event table has five columns that matter: who, what, when, where, and how it was identified. Most broken analytics starts with a missing or unreliable version of one of them.\n\nWe look at a real event stream and find the problems: duplicate events from client retries, clock skew between mobile and server timestamps, anonymous ids that never merge with a user id, and a `properties` blob that changed shape three times without a schema version.\n\nThen we fix each one at the staging layer, because fixing them downstream means every model has to remember the fix. The rule for this course: raw data is immutable, cleaning happens once, in staging, and is tested.', 1),
    (v_m1, 'Sessions, identity stitching and the merge problem',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 1240, false,
     E'A user who signs up on Tuesday was anonymous on Monday. If you cannot connect those two identities, your activation metric is wrong by however many people browse before they buy — which is most of them.\n\nWe build an identity map: a table of (anonymous_id, user_id, first_seen) that resolves to a canonical user. Then we rebuild sessions on top of it, with a 30-minute inactivity window and a hard cap at midnight so a session never spans two days.\n\nThe subtle part is the merge. When one person uses two devices, you get two anonymous ids pointing at one user. We handle it with a union-find style resolution in SQL and show why a naive `distinct user_id` silently double-counts.', 2),
    (v_m1, 'Reading a query plan before you optimise',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 967, false,
     E'Before you add an index, read the plan. `EXPLAIN ANALYZE` tells you where the time actually goes, and it is almost never where you guessed.\n\nWe take a 40-second dashboard query and walk the plan: a sequential scan on 4.2M rows, a hash join that spills to disk, and a sort that could have been avoided. Three changes later it runs in 1.8 seconds — and none of them was "add an index".\n\nThe lesson is a habit: measure, read the plan, change one thing, measure again. We also cover the partition pruning that makes event tables manageable at scale.', 3)
  on conflict do nothing;

  insert into public.lessons (module_id, title, video_url, duration, is_free_preview, content_text, order_no) values
    (v_m2, 'The three-layer dbt project',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 1088, false,
     E'Staging, intermediate, marts. Three layers, one rule each.\n\nStaging models rename and cast — one model per source table, nothing else. They are the only place a raw column name appears. Intermediate models do the hard joins and are never exposed to a BI tool. Marts are wide, business-shaped, and are the only thing analysts query.\n\nThis layering is not bureaucracy. It is what lets you change a source column name in one file instead of forty, and it is what makes a failing test point at a single layer instead of the whole pipeline.', 1),
    (v_m2, 'Tests that catch the bugs that make numbers wrong',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 1156, false,
     E'There are four tests that catch most real analytics bugs, and none of them is `not_null`.\n\nUniqueness on the grain. Referential integrity on every join key. Accepted values on every enum. And a row-count reconciliation between a model and its upstream, with a tolerance, so a fan-out join is caught the day it ships.\n\nWe write all four, then deliberately introduce a many-to-many join and watch the test fail with a message that names the offending key. That failure message is the deliverable — a test that fails cryptically gets muted.', 2),
    (v_m2, 'Documentation as a contract',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 734, false,
     E'A metric definition that lives in a Slack thread is not a definition. It is a rumour.\n\nWe put every metric in the dbt project with a description, an owner, and a formula, and we generate the docs site from it. When someone asks "how do we calculate activation", the answer is a URL, not a person.\n\nThe contract part: a metric''s definition changes only through a pull request, and the pull request shows the diff in the number. That single practice ends most metric arguments before they start.', 3)
  on conflict do nothing;

  insert into public.lessons (module_id, title, video_url, duration, is_free_preview, content_text, order_no) values
    (v_m3, 'Activation: the metric everyone defines differently',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 1290, false,
     E'Activation is the first moment a user gets real value. It is not signup, and it is not "completed onboarding".\n\nWe find the activation event empirically: for each candidate event, compare 30-day retention of users who did it in their first week against those who did not. The event with the largest gap is your activation moment. For our dataset it turns out to be creating a second project — not the first, which is the one the product team assumed.\n\nThen we build the funnel that measures it, with the identity map from module one so anonymous pre-signup behaviour counts.', 1),
    (v_m3, 'Retention curves and the cohort that lies',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', 1345, false,
     E'A retention curve that flattens is a product with a habit. A curve that goes to zero is a product people try once.\n\nWe build weekly cohorts and plot the curve, then look at the three ways this analysis lies: survivorship (you only see users who stayed), seasonality (a cohort that starts in a holiday week looks terrible), and definition drift (the "active" event changed in March).\n\nWe correct for all three and show the corrected curve, which changes the read on the product entirely.', 2),
    (v_m3, 'Expansion, churn and the revenue bridge',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 1102, false,
     E'Churn is a rate. Revenue churn is a different rate, and confusing them is how companies miss their number.\n\nWe build a revenue bridge: starting MRR, plus new, plus expansion, minus contraction, minus churn, equals ending MRR. Every line is a tested model. The bridge reconciles to the billing system to the cent, which is the only way finance will trust it.\n\nWe finish with the cohort view of net revenue retention, and the one chart that predicts next quarter better than any forecast model.', 3)
  on conflict do nothing;

  insert into public.quizzes (id, course_id, module_id, title, description, passing_score) values
    (v_quiz, v_course, v_m2, 'dbt modelling checkpoint',
     'Five questions on layering, testing and metric contracts.', 70)
  on conflict (id) do nothing;

  insert into public.quiz_questions (quiz_id, question, options, correct_option, explanation, order_no) values
    (v_quiz, 'Which layer is the only place a raw source column name should appear?',
     '["Marts","Intermediate","Staging","Any layer, as long as it is documented"]'::jsonb, 2,
     'Staging is the single rename-and-cast boundary. Everything downstream uses the clean name.', 1),
    (v_quiz, 'A model that should have one row per order now has three per order. Which test catches it first?',
     '["not_null on order_id","unique on order_id","accepted_values on status","A row-count reconciliation with tolerance"]'::jsonb, 1,
     'A fan-out join breaks the grain, so uniqueness on the grain key fails immediately and names the key.', 2),
    (v_quiz, 'Why are intermediate models never exposed to the BI tool?',
     '["They are too slow","They contain implementation detail that would let analysts fork the logic","dbt forbids it","They have no primary key"]'::jsonb, 1,
     'Exposing intermediate models invites analysts to build on unstable internals, which forks metric definitions.', 3),
    (v_quiz, 'What is the strongest signal that an event is the true activation moment?',
     '["It happens early in the funnel","It is the largest gap in 30-day retention between users who did and did not do it in week one","Product managers voted for it","It has the highest volume"]'::jsonb, 1,
     'Activation is defined empirically by the retention gap, not by intuition about the funnel.', 4),
    (v_quiz, 'Revenue churn and logo churn differ because…',
     '["They use different date ranges","A small customer leaving and a large one leaving have the same logo impact but very different revenue impact","Revenue churn excludes refunds","Logo churn is always higher"]'::jsonb, 1,
     'Logo churn counts accounts; revenue churn weights by MRR. They answer different questions.', 5)
  on conflict do nothing;

  insert into public.reviews (course_id, user_id, rating, comment) values
    (v_course, '44444444-4444-4444-8444-444444444444', 5,
     'The identity stitching lesson fixed a bug we had lived with for eight months — our activation number was understated by about 30%. Daniel explains the why before the how, which is rare.')
  on conflict (course_id, user_id) do nothing;
end $$;

-- 8.3 COURSE 3 — Design Systems in Figma -------------------------------------
do $$
declare
  v_course uuid := 'cccccccc-0000-4000-8000-000000000001';
  v_m1 uuid := 'cccccccc-0000-4000-8000-000000000101';
  v_m2 uuid := 'cccccccc-0000-4000-8000-000000000102';
  v_m3 uuid := 'cccccccc-0000-4000-8000-000000000103';
  v_quiz uuid := 'cccccccc-0000-4000-8000-000000000201';
begin
  insert into public.courses (
    id, instructor_id, title, slug, subtitle, description, thumbnail_url,
    price, level, category, language, is_published, student_count
  ) values (
    v_course,
    '33333333-3333-4333-8333-333333333333',
    'Design Systems in Figma: From Tokens to Components',
    'design-systems-figma-tokens-components',
    'Build a system that survives contact with engineering — variables, tokens, and components that map 1:1 to code.',
    E'Most design systems die at the handoff. The Figma file is beautiful, the components are named inconsistently, and six months later every team has forked their own button.\n\nThis course builds a system designed for the seam between design and code. You will start with a token architecture — primitive, semantic, component — and implement it with Figma variables so that dark mode is a mode switch rather than a second file. Then you build components with variants that map to real props, and you document them the way an engineer will actually read.\n\nWe work on a realistic product: a B2B analytics dashboard with 14 screens. By the end you will have a published library, a contribution model, and a versioning strategy that does not break every consumer on release.\n\nThis is a beginner-friendly course. You need basic Figma familiarity — frames, auto layout, components — but no prior systems experience.',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80',
    49.99, 'beginner', 'Design', 'English', true, 12760
  ) on conflict (id) do nothing;

  insert into public.modules (id, course_id, title, summary, order_no) values
    (v_m1, v_course, 'Tokens: The Foundation Nobody Sees',
     'Primitive, semantic and component tokens — and why the middle layer is the one that makes dark mode work.', 1),
    (v_m2, v_course, 'Components That Map to Code',
     'Variants, properties and slots designed so an engineer can read the Figma and write the prop.', 2),
    (v_m3, v_course, 'Shipping and Governing the System',
     'Publishing a library, versioning without breaking consumers, and a contribution model that scales.', 3)
  on conflict (id) do nothing;

  insert into public.lessons (module_id, title, video_url, duration, is_free_preview, content_text, order_no) values
    (v_m1, 'Why three layers of tokens, not one',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 698, true,
     E'A single layer of tokens works until the day you need dark mode, or a brand refresh, or a density setting. Then you discover that every component references a raw hex value and you have 400 files to touch.\n\nThree layers fix this. Primitives are the raw palette: blue-500, gray-100, and they never appear in a component. Semantic tokens name intent: surface-default, text-muted, border-subtle. Component tokens are the narrow exceptions: button-primary-bg.\n\nComponents only ever reference semantic or component tokens. That single rule is what makes a theme switch a one-line change instead of a migration.', 1),
    (v_m1, 'Figma variables and the mode switch',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 1044, false,
     E'Figma variables are the implementation of the token layer, and modes are how you get light and dark from one component set.\n\nWe create a variable collection with two modes, bind every semantic token to a primitive per mode, and then switch a whole page by changing the frame''s mode. No duplicate components, no second file.\n\nThe gotcha: a variable bound to a raw value instead of another variable breaks the chain. We show the audit that finds every broken binding in a file, because in a real system there will be some.', 2),
    (v_m1, 'Type, spacing and the scale that holds',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 812, false,
     E'A type scale is a ratio, not a list of sizes someone liked. We use a 1.25 modular scale for UI and a 1.333 for marketing, and we explain why they differ.\n\nSpacing is a 4px base with a restricted set of steps — 4, 8, 12, 16, 24, 32, 48, 64. Restriction is the point. A system with 30 spacing values is not a system, it is a suggestion.\n\nWe bind both to variables so a density mode can scale spacing without touching a single component.', 3)
  on conflict do nothing;

  insert into public.lessons (module_id, title, video_url, duration, is_free_preview, content_text, order_no) values
    (v_m2, 'Variants that mirror props',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 1210, false,
     E'The test for a good variant set: an engineer should be able to read the variant names and write the component API without asking you a question.\n\nWe build a Button with variant (primary, secondary, ghost, destructive), size (sm, md, lg), and state (default, hover, focus, disabled, loading). That is 60 combinations, which is too many to draw — so we use component properties to compose rather than enumerate, and we show where the line is.\n\nThe anti-pattern we spend time on: a variant for every content permutation. Content belongs in a slot, not a variant.', 1),
    (v_m2, 'Auto layout, slots and the responsive component',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 1088, false,
     E'A component that only works at one width is a picture, not a component.\n\nWe build with auto layout in both directions, use min/max width instead of fixed, and design the wrap behaviour explicitly. Then we test at 320, 768 and 1440 and fix what breaks.\n\nSlots are the mechanism for content the system does not own: an icon, a badge, a trailing action. We show how to make a slot that accepts a swap without letting the consumer break the padding.', 2),
    (v_m2, 'Documenting for the engineer who will build it',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 934, false,
     E'Documentation is not a description of what the component looks like. It is the contract: when to use it, when not to, what it accepts, and what it does at the edges.\n\nWe write a component page with four sections — anatomy, usage, props table, accessibility notes — and we keep it inside the Figma file so it cannot drift from the component.\n\nThe accessibility section is not optional. Focus order, contrast ratios, and the aria attributes the engineer must add are part of the design, not an afterthought.', 3)
  on conflict do nothing;

  insert into public.lessons (module_id, title, video_url, duration, is_free_preview, content_text, order_no) values
    (v_m3, 'Publishing a library people actually use',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 876, false,
     E'Publishing is a technical step. Adoption is a social one, and the social one is harder.\n\nWe publish the library, then do the three things that drive adoption: a 20-minute onboarding session per team, a "system office hours" slot, and a migration path for the components teams already built. Without the third, they will not switch — nobody rewrites working UI for elegance.\n\nWe also cover the naming convention that makes search work, because a library nobody can find in the asset panel is a library nobody uses.', 1),
    (v_m3, 'Versioning without breaking everyone',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', 1024, false,
     E'Semantic versioning applies to design systems exactly as it does to code: patch for a fix, minor for an addition, major for a break.\n\nThe hard part is agreeing what counts as a break. Changing a component''s default padding is a visual change but a breaking one for any layout that depended on it. We write the rule down and put it in the contribution guide, so the argument happens once.\n\nWe also show the deprecation flow: mark, warn, wait one major, remove. Never remove in the same release that marks.', 2),
    (v_m3, 'A contribution model that scales past you',
     'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 790, false,
     E'If every component needs your review, the system stops scaling at about four teams.\n\nWe set up a contribution model with three tiers: a bug fix anyone can ship, a new variant that needs one maintainer review, and a new component that needs a design review and an engineering review. Each tier has a template and a turnaround commitment.\n\nThe final piece is the health metric. We track adoption percentage, override count, and time-to-first-contribution, and we review them monthly. A system without a health metric is a system quietly rotting.', 3)
  on conflict do nothing;

  insert into public.quizzes (id, course_id, module_id, title, description, passing_score) values
    (v_quiz, v_course, v_m1, 'Token architecture checkpoint',
     'Four questions on token layers and Figma variables.', 70)
  on conflict (id) do nothing;

  insert into public.quiz_questions (quiz_id, question, options, correct_option, explanation, order_no) values
    (v_quiz, 'Which token layer should a component reference?',
     '["Primitive, for precision","Semantic or component tokens only","Any layer","Raw hex values"]'::jsonb, 1,
     'Components reference semantic or component tokens so a theme change is a single binding change, not a migration.', 1),
    (v_quiz, 'What breaks a Figma variable theme switch?',
     '["Using modes","Binding a semantic token to a raw value instead of a primitive variable","Too many components","Using auto layout"]'::jsonb, 1,
     'A raw-value binding severs the chain, so the mode switch no longer reaches that token.', 2),
    (v_quiz, 'Why restrict the spacing scale to eight steps?',
     '["Figma performance","Restriction is what makes it a system rather than a suggestion","It matches the type scale","Accessibility requires it"]'::jsonb, 1,
     'A scale with 30 values gives no guidance and produces inconsistent rhythm.', 3),
    (v_quiz, 'A component needs to accept an icon, a badge, or nothing in its trailing position. What is the right mechanism?',
     '["A variant for each combination","A slot","A separate component per case","A boolean property per element"]'::jsonb, 1,
     'Content the system does not own belongs in a slot; enumerating content as variants explodes the set.', 4)
  on conflict do nothing;

  insert into public.reviews (course_id, user_id, rating, comment) values
    (v_course, '44444444-4444-4444-8444-444444444444', 4,
     'The three-layer token explanation finally made dark mode click for me. I would have liked more on the code side of tokens, but the governance module is genuinely the best I have seen.')
  on conflict (course_id, user_id) do nothing;
end $$;

-- 8.4 Demo enrollment + progress so the dashboards have something to show ----
do $$
declare
  v_student uuid := '44444444-4444-4444-8444-444444444444';
  v_c1 uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  v_c2 uuid := 'bbbbbbbb-0000-4000-8000-000000000001';
  v_lesson uuid;
begin
  insert into public.enrollments (user_id, course_id, progress_percent, completed)
  values (v_student, v_c1, 0, false), (v_student, v_c2, 0, false)
  on conflict (user_id, course_id) do nothing;

  -- complete the first two lessons of course 1 (fires progress + XP triggers)
  for v_lesson in
    select l.id from public.lessons l
    join public.modules m on m.id = l.module_id
    where m.course_id = v_c1
    order by m.order_no, l.order_no
    limit 2
  loop
    insert into public.lesson_progress (user_id, lesson_id, course_id, completed, watched_seconds, completed_at)
    values (v_student, v_lesson, v_c1, true, 700, now())
    on conflict (user_id, lesson_id) do update set completed = true;
  end loop;
end $$;

-- 8.5 Refresh aggregate counters --------------------------------------------
update public.courses c
   set rating_avg = coalesce((select round(avg(rating)::numeric,2) from public.reviews r where r.course_id = c.id), 0),
       rating_count = (select count(*) from public.reviews r where r.course_id = c.id);

update public.courses c
   set duration_minutes = coalesce((
     select sum(l.duration)/60 from public.lessons l
     join public.modules m on m.id = l.module_id where m.course_id = c.id
   ), 0);

-- ---------------------------------------------------------------------------
-- 9. CONVENIENCE VIEWS
-- ---------------------------------------------------------------------------
create or replace view public.course_catalog as
select
  c.id, c.title, c.slug, c.subtitle, c.thumbnail_url, c.price, c.level,
  c.category, c.language, c.rating_avg, c.rating_count, c.student_count,
  c.duration_minutes, c.created_at,
  p.full_name as instructor_name, p.avatar_url as instructor_avatar, p.headline as instructor_headline,
  (select count(*) from public.modules m where m.course_id = c.id) as module_count,
  (select count(*) from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = c.id) as lesson_count
from public.courses c
join public.profiles p on p.id = c.instructor_id
where c.is_published = true;

grant select on public.course_catalog to anon, authenticated;

-- ============================================================================
-- END 0001_init.sql
-- ============================================================================
