# LearnSphere Global

A world-class global learning platform — Udemy/Coursera-class product surface, built on a
**Next.js 14 App Router frontend** and a **Supabase-only backend**. There is no custom Node
server: Postgres is the source of truth, Row Level Security is the authorisation layer, and
Edge Functions are the escape hatch for anything that needs a secret.

---

## What's inside

| Layer | Stack |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui primitives, Framer Motion |
| Backend | Supabase — Postgres, Auth, Storage, Realtime, Edge Functions (Deno) |
| AI | OpenAI `gpt-4o-mini` + `text-embedding-3-small`, pgvector similarity search |
| Payments | Stripe (global) + Paystack (NGN, GHS, ZAR, KES) |
| Certificates | `pdf-lib` in a Deno Edge Function |

### Product surface

- **Landing page** — hero, trusted-by marquee, course grid, feature grid, pricing with
  monthly/annual toggle, instructor section, CTA.
- **Auth** — email + password, Google OAuth, GitHub OAuth, magic link. Session exchanged
  server-side in `/auth/callback` so the cookie is set in the right context.
- **Student dashboard** — XP, streak, weekly activity chart, daily goal ring, continue-learning
  hero, course progress, certificates, recommendations.
- **Course player** — video with progress saved every 10s, auto-complete at 95% watched,
  curriculum sidebar, lesson notes, prev/next, AI tutor panel, certificate download at 100%.
- **Instructor dashboard** — revenue, students, ratings, completion rate, course list,
  recent students, direct-to-storage uploads, AI outline generator entry point.
- **Admin console** — platform GMV, users table, courses, payments, `is_admin()`-gated.
- **Dark / light mode** — `next-themes` with a system default, no flash on load.

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/LearnSphere-Global.git
cd LearnSphere-Global
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Open **SQL Editor**.
3. Paste the entire contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   and run it.

That single file creates everything:

- **Extensions** — `uuid-ossp`, `pgcrypto`, `vector` (pgvector), `pg_trgm`
- **Enums** — `user_role`, `course_level`, `payment_provider`, `payment_status`
- **Tables** — `profiles`, `courses`, `modules`, `lessons`, `enrollments`,
  `lesson_progress`, `quizzes`, `quiz_questions`, `quiz_attempts`, `certificates`,
  `payments`, `reviews`, `lesson_embeddings`
- **RLS** on every table, with `is_admin()`, `is_instructor_of()`, `is_enrolled()` helpers
- **Storage buckets** — `course-thumbnails`, `course-videos`, `certificates`
  (public read, owner-write where the path must start with the uploader's uid)
- **Triggers** — auto-create profile on `auth.users` insert; XP + streak on lesson
  complete; enrollment progress recalculation; auto-issue certificate at 100%;
  rating and duration aggregates
- **Seed data** — 3 fully written courses with modules, lessons, quizzes, reviews
- **RPC** — `match_lesson_chunks()` for the AI tutor's vector search

> **Using the Supabase CLI instead?**
> ```bash
> supabase link --project-ref <your-ref>
> supabase db push
> ```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in at minimum:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
```

### 4. Deploy the Edge Functions

```bash
supabase functions deploy ai-tutor-chat
supabase functions deploy generate-certificate
supabase functions deploy ai-course-outline-generator
supabase functions deploy embed-lessons

# Secrets the functions need
supabase secrets set OPENAI_API_KEY=sk-...
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically by the Supabase runtime.

### 5. Index the course content for the AI tutor

The tutor answers from `lesson_embeddings`. Populate them once per course:

```bash
curl -X POST "https://<ref>.supabase.co/functions/v1/embed-lessons" \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"courseId":"aaaaaaaa-0000-4000-8000-000000000001"}'
```

Re-run it whenever lesson `content_text` changes — the function clears and re-indexes.

### 6. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo accounts** (created by the seed block):

| Role | Email | Password |
|---|---|---|
| Student | `student@learnsphere.demo` | `DemoPass123!` |
| Instructor | `amara@learnsphere.demo` | `DemoPass123!` |
| Instructor | `daniel@learnsphere.demo` | `DemoPass123!` |
| Instructor | `mei@learnsphere.demo` | `DemoPass123!` |

> The seed block writes to `auth.users`, so run it from the SQL Editor (service role).
> To promote a user to admin: `update profiles set role = 'admin' where id = '<uuid>';`

---

## Payments

### Stripe

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`. The handler verifies the
signature against the **raw** body, then upserts into `payments` and `enrollments`.
Both writes are idempotent — a replayed event is a no-op, not a double enrolment.

### Paystack

Point the Paystack dashboard webhook at `https://<your-domain>/api/webhooks/paystack`.
The handler verifies `x-paystack-signature` with HMAC-SHA512 and a constant-time compare.

Pass `user_id` and `course_id` in the transaction metadata when initialising checkout.

---

## Architecture notes

**Why no custom Node server.** Every request that goes through your own API has to be
authorised twice — once at the route, once at the data. With RLS you authorise once, in the
database, where a forgotten route handler cannot bypass it. The three places this hurts
(webhooks, scheduled jobs, cross-tenant aggregation) are each solved with a route handler,
a Postgres function, or an Edge Function.

**`USING` vs `WITH CHECK`.** Every update policy in the migration has both. A policy with
only `USING` lets a user update a row so that it no longer matches the policy — they can
hand their record to someone else. This is the most common RLS bug in production.

**Progress is computed in the database.** The client only reports what was watched
(`lesson_progress`). A trigger recomputes `enrollments.progress_percent`, awards XP, and
issues the certificate at 100%. The client cannot fake completion.

**Storage paths are the security boundary.** Uploads go directly from the browser to
Storage, and the policy requires the object path to begin with the uploader's user id —
so a user cannot overwrite another user's file by guessing a path.

---

## Project structure

```
.
├── src/
│   ├── app/
│   │   ├── (auth)/                 # login, signup, shared auth layout + server actions
│   │   ├── admin/                  # admin console (is_admin gated)
│   │   ├── api/
│   │   │   ├── certificates/       # certificate download proxy
│   │   │   └── webhooks/           # stripe + paystack handlers
│   │   ├── auth/callback/          # OAuth / magic-link code exchange
│   │   ├── courses/                # catalogue + course detail
│   │   ├── dashboard/              # student dashboard
│   │   ├── instructor/             # instructor dashboard
│   │   ├── learn/[courseId]/       # course player
│   │   ├── globals.css             # design tokens, light + dark
│   │   ├── layout.tsx              # fonts, metadata, providers
│   │   └── page.tsx                # landing page
│   ├── components/
│   │   ├── ai/                     # AI tutor chat
│   │   ├── auth/                   # login / signup / OAuth forms
│   │   ├── course/                 # course card, course player
│   │   ├── dashboard/              # app shell (sidebar + topbar)
│   │   ├── marketing/              # header, footer, pricing, reveal, trusted-by
│   │   └── ui/                     # shadcn primitives
│   ├── hooks/                      # lesson progress, storage upload
│   ├── lib/                        # supabase clients, types, demo data, utils
│   └── middleware.ts               # session refresh + route guards
├── supabase/
│   ├── functions/
│   │   ├── ai-tutor-chat/          # RAG tutor (streaming)
│   │   ├── ai-course-outline-generator/
│   │   ├── embed-lessons/          # chunk + embed lesson content
│   │   └── generate-certificate/   # PDF via pdf-lib
│   ├── migrations/0001_init.sql    # the whole schema
│   └── config.toml
├── .env.example
└── README.md
```

---

## Deploy

**Vercel** (recommended for the frontend):

```bash
vercel --prod
```

Add every variable from `.env.example` in the Vercel project settings, and set
`NEXT_PUBLIC_SITE_URL` to your production domain. Then add
`https://<domain>/auth/callback` to **Supabase → Authentication → URL Configuration →
Redirect URLs**.

**Supabase** stays where it is — the frontend is stateless.

---

## Scripts

```bash
npm run dev        # local dev server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

---

## Licence

MIT.
