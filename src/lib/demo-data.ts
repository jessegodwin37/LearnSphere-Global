import type { CourseCatalogRow, CourseLevel } from "./database.types";

/**
 * Demo catalogue.
 *
 * These mirror the three courses seeded by supabase/migrations/0001_init.sql.
 * They are used as a fallback when NEXT_PUBLIC_SUPABASE_URL is not configured,
 * so the marketing site and dashboards render on a fresh clone. Once Supabase
 * is connected, every page reads live rows instead.
 */

export interface DemoLesson {
  id: string;
  title: string;
  duration: number; // seconds
  is_free_preview: boolean;
  content_text: string;
  video_url: string;
}

export interface DemoModule {
  id: string;
  title: string;
  summary: string;
  order_no: number;
  lessons: DemoLesson[];
}

export interface DemoCourse extends CourseCatalogRow {
  description: string;
  instructor_id: string;
  modules: DemoModule[];
  outcomes: string[];
  reviews: { name: string; rating: number; comment: string; date: string }[];
}

const V = (n: string) => `https://storage.googleapis.com/gtv-videos-bucket/sample/${n}`;

export const DEMO_COURSES: DemoCourse[] = [
  {
    id: "aaaaaaaa-0000-4000-8000-000000000001",
    instructor_id: "11111111-1111-4111-8111-111111111111",
    title: "Full-Stack TypeScript with Next.js 14 & Supabase",
    slug: "fullstack-typescript-nextjs-supabase",
    subtitle:
      "Ship a production SaaS from empty folder to deployed app — auth, database, payments and all.",
    description:
      "Most Next.js courses stop at a todo list. This one builds the thing you actually get paid for.\n\nOver 9 hours you will build \"Ledgerly\", a multi-tenant invoicing SaaS: server components that stream, row-level security that holds up under audit, Stripe subscriptions with webhooks that do not double-charge, and a deploy pipeline you can hand to a teammate.\n\nWe work in TypeScript end to end. Every file in the course is a file you will reuse. There is no custom Node server anywhere — Supabase is the backend, and you will learn exactly how far that gets you (further than you think) and where the seams are.",
    thumbnail_url:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&q=80",
    price: 89.99,
    level: "intermediate" as CourseLevel,
    category: "Web Development",
    language: "English",
    rating_avg: 4.9,
    rating_count: 1284,
    student_count: 18420,
    duration_minutes: 542,
    created_at: "2026-02-14T10:00:00Z",
    instructor_name: "Amara Okafor",
    instructor_avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    instructor_headline: "Staff Engineer · ex-Vercel · Next.js core contributor",
    module_count: 3,
    lesson_count: 11,
    outcomes: [
      "Model multi-tenant data so Row Level Security actually protects it",
      "Write RLS policies that survive a security review, including the USING vs WITH CHECK trap",
      "Choose correctly between server components, server actions and route handlers",
      "Take Stripe payments with idempotent webhooks that never double-charge",
      "Deploy with preview environments and a rollback plan that works at 2am",
    ],
    modules: [
      {
        id: "aaaaaaaa-0000-4000-8000-000000000101",
        title: "Foundations: App Router & Data Modelling",
        summary:
          "Set up the project, understand server vs client components, and model a multi-tenant schema that RLS can actually protect.",
        order_no: 1,
        lessons: [
          {
            id: "l1-1",
            title: "Why Supabase as your only backend",
            duration: 742,
            is_free_preview: true,
            video_url: V("ForBiggerBlazes.mp4"),
            content_text:
              "In this lesson we draw the boundary. A Supabase-only architecture means Postgres is your source of truth, Row Level Security is your authorisation layer, and Edge Functions are your escape hatch for anything that needs a secret.\n\nWe compare three shapes: a traditional Node API, a BFF on the server, and direct-to-database with RLS. The third is the one this course uses, and the reason is simple: every request that goes through your own API is a request you have to authorise twice. With RLS you authorise once, in the database, where it cannot be bypassed by a forgotten route handler.\n\nThe trade-off is real. You give up the ability to do arbitrary server-side orchestration on every read. We will show you the three places that hurts and how to solve each with a Postgres function, a view, or an Edge Function.",
          },
          {
            id: "l1-2",
            title: "Project setup and the folder that scales",
            duration: 1105,
            is_free_preview: false,
            video_url: V("ForBiggerEscapes.mp4"),
            content_text:
              "We scaffold with create-next-app, pin TypeScript strict mode, and lay out the app directory by feature rather than by file type. The rule: a route folder owns its components, its queries and its types.\n\nWe also generate database types with the Supabase CLI. This is not optional. Hand-written types drift within a week, and the drift is silent — you get a runtime undefined instead of a compile error.\n\nFinally we set up the three environment variables and explain why the anon key is safe to ship to the browser while the service role key is not.",
          },
          {
            id: "l1-3",
            title: "Modelling multi-tenant data",
            duration: 1288,
            is_free_preview: false,
            video_url: V("ForBiggerFun.mp4"),
            content_text:
              "Multi-tenancy in Postgres has three common shapes: separate databases, separate schemas, and a tenant_id column on every table. We use the third, because it is the only one that lets a single connection pool serve every tenant efficiently.\n\nThe cost is that every query must filter by tenant, and every policy must check it. We make that structural rather than a discipline problem: the tenant_id is never nullable, it is part of every composite index, and the RLS policy reads it from the JWT claim rather than from a query parameter the client could forge.",
          },
          {
            id: "l1-4",
            title: "Server Components, Client Components, and where the line is",
            duration: 964,
            is_free_preview: false,
            video_url: V("ForBiggerJoyrides.mp4"),
            content_text:
              "The App Router default is a server component, and that default is correct. A server component can query Postgres directly, streams its HTML as data arrives, and ships zero JavaScript to the browser.\n\nYou reach for a client component only when you need state, an effect, an event handler, or a browser API. The mistake is making a whole page a client component because one button needs onClick. Instead, push the boundary down.\n\nWe refactor a page that was 100% client-side into a server shell with two client islands, and measure the JavaScript payload drop from 214KB to 38KB.",
          },
        ],
      },
      {
        id: "aaaaaaaa-0000-4000-8000-000000000102",
        title: "Auth, RLS and the Server Boundary",
        summary:
          "Supabase Auth with email, OAuth and magic links. Then the part everyone gets wrong: writing policies that survive a pen test.",
        order_no: 2,
        lessons: [
          {
            id: "l2-1",
            title: "Supabase Auth: email, Google and magic links",
            duration: 1342,
            is_free_preview: false,
            video_url: V("ForBiggerMeltdowns.mp4"),
            content_text:
              "We wire three sign-in paths against one auth.users table. Email and password is the baseline. Google OAuth is a redirect flow that Supabase handles for you once the provider is configured. Magic links are the one that surprises people: they are a one-time token in a URL, and they break if your redirect allow-list is wrong.\n\nThe important detail is the callback route. Supabase sends the user back to /auth/callback with a code, and you exchange that code for a session cookie on the server. If you do this in a client component the cookie is set in the wrong context and the user appears logged out on refresh.",
          },
          {
            id: "l2-2",
            title: "Writing RLS policies that survive review",
            duration: 1610,
            is_free_preview: false,
            video_url: V("Sintel.mp4"),
            content_text:
              "RLS is not a feature you add at the end. It is the authorisation model, and it has to be designed with the schema.\n\nWe start with the four policies every table needs: select, insert, update, delete. Then we make them fast. A policy that calls a function per row will table-scan; a policy that reads auth.uid() directly and compares to an indexed column will not.\n\nThe subtle bug we spend real time on: using versus with check. using filters what you can see. with check validates what you can write. A policy with only using lets a user update a row so that it no longer matches the policy — they can hand their record to someone else. Every update policy in this course has both.",
          },
          {
            id: "l2-3",
            title: "Server actions, route handlers and the service role",
            duration: 1187,
            is_free_preview: false,
            video_url: V("TearsOfSteel.mp4"),
            content_text:
              "Three ways to run server code, three different trust levels.\n\nA server action runs in the request context of the logged-in user, so RLS applies. Use it for anything a user initiates.\n\nA route handler is a plain HTTP endpoint. It has no user context unless you add one, which makes it the right home for webhooks and the wrong home for user data.\n\nThe service role key bypasses RLS entirely. It belongs in exactly two places: a route handler that has already verified a webhook signature, and a scheduled job.",
          },
          {
            id: "l2-4",
            title: "Storage: uploads, signed URLs and image transforms",
            duration: 903,
            is_free_preview: false,
            video_url: V("VolkswagenGTIReview.mp4"),
            content_text:
              "Files are the part of a Supabase app people hack together. We do it properly.\n\nBuckets are either public or private. Public buckets serve through a CDN with no auth — right for course thumbnails, wrong for invoices. Private buckets require a signed URL, which expires, which means you generate it on the server at render time.\n\nWe implement a direct-to-storage upload: the browser gets a signed upload URL, PUTs the file straight to storage, and never routes a 200MB video through your server. Then we add the storage policy that makes it safe — the object path must begin with the uploader's user id.",
          },
        ],
      },
      {
        id: "aaaaaaaa-0000-4000-8000-000000000103",
        title: "Payments, Webhooks and Deployment",
        summary:
          "Stripe subscriptions, idempotent webhook handling, and a deploy that you can roll back at 2am.",
        order_no: 3,
        lessons: [
          {
            id: "l3-1",
            title: "Stripe subscriptions without the double charge",
            duration: 1455,
            is_free_preview: false,
            video_url: V("WeAreGoingOnBullrun.mp4"),
            content_text:
              "Checkout is easy. Keeping your database in sync with Stripe is the hard part, and the failure mode is charging someone twice.\n\nThe rule: Stripe is the source of truth for subscription state, your database is a cache. You never write \"this user is subscribed\" from the client. You write it from a webhook, and the webhook is idempotent because you store the event id and ignore repeats.\n\nWe build the checkout session, the webhook handler, and the reconciliation job that runs nightly and fixes any drift. Then we deliberately replay a webhook three times and watch the handler do the right thing.",
          },
          {
            id: "l3-2",
            title: "Idempotency, retries and the outbox pattern",
            duration: 1021,
            is_free_preview: false,
            video_url: V("WhatCarCanYouGetForAGrand.mp4"),
            content_text:
              "Every external call in your system will eventually be delivered twice, out of order, or not at all. This lesson is the toolkit for that reality.\n\nIdempotency keys make a write safe to repeat. An outbox table makes a side effect survive a crash between the database write and the external call. A retry with exponential backoff and a dead-letter row makes a failing integration visible instead of silent.\n\nWe implement all three in about 120 lines and then break the process mid-transaction to prove the outbox recovers.",
          },
          {
            id: "l3-3",
            title: "Deploying: preview, production and rollback",
            duration: 876,
            is_free_preview: false,
            video_url: V("BigBuckBunny.mp4"),
            content_text:
              "Deployment is a workflow, not a button.\n\nEvery pull request gets a preview deployment with its own database branch. That is the single highest-leverage thing you can do for review quality.\n\nProduction deploys run migrations first, then the app, and the migration must be backwards compatible with the previous app version for the window between the two. We show the expand-contract pattern that makes that true.\n\nFinally, rollback: you cannot un-run a migration, so the rollback plan is always a forward migration.",
          },
        ],
      },
    ],
    reviews: [
      {
        name: "Jesse Anomuoghar",
        rating: 5,
        comment:
          "The RLS section alone was worth the price. I had been shipping using-only policies for a year without realising the hole. The webhook idempotency lesson saved us from a real double-charge incident.",
        date: "2026-09-18T00:00:00Z",
      },
      {
        name: "Priya Raman",
        rating: 5,
        comment:
          "Finally a Next.js course that does not stop at a todo app. The multi-tenant modelling lesson changed how I design schemas.",
        date: "2026-08-02T00:00:00Z",
      },
      {
        name: "Tomas Berg",
        rating: 4,
        comment:
          "Excellent depth on the server boundary. I would have liked a little more on testing, but the deployment module is genuinely practical.",
        date: "2026-07-11T00:00:00Z",
      },
    ],
  },
  {
    id: "bbbbbbbb-0000-4000-8000-000000000001",
    instructor_id: "22222222-2222-4222-8222-222222222222",
    title: "Product Analytics with SQL & dbt",
    slug: "product-analytics-sql-dbt",
    subtitle:
      "Turn raw event logs into the four numbers your leadership team actually asks about.",
    description:
      "Analytics teams drown in dashboards nobody trusts. The cause is almost never the BI tool — it is the modelling underneath it.\n\nThis course builds a warehouse from raw event data to a tested, documented, version-controlled semantic layer using dbt. You will work with a realistic 4.2M-row event dataset from a subscription product and answer the questions that matter: activation, retention, expansion and churn.\n\nWe spend real time on the unglamorous parts that decide whether anyone believes your numbers: defining a metric once, testing it, and making the definition impossible to fork.",
    thumbnail_url:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
    price: 64.99,
    level: "intermediate" as CourseLevel,
    category: "Data Science",
    language: "English",
    rating_avg: 4.8,
    rating_count: 642,
    student_count: 9310,
    duration_minutes: 386,
    created_at: "2026-03-22T10:00:00Z",
    instructor_name: "Daniel Reyes",
    instructor_avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    instructor_headline: "Head of Analytics · ex-Shopify",
    module_count: 3,
    lesson_count: 9,
    outcomes: [
      "Model sessions and stitch anonymous identities to real users",
      "Build a three-layer dbt project that survives a source schema change",
      "Write the four tests that catch the bugs that make numbers wrong",
      "Define activation empirically instead of by intuition",
      "Build a revenue bridge that reconciles to billing to the cent",
    ],
    modules: [
      {
        id: "bbbbbbbb-0000-4000-8000-000000000101",
        title: "Event Data and the Warehouse",
        summary:
          "What a clean event stream looks like, why most of them are not, and how to model sessions and identities.",
        order_no: 1,
        lessons: [
          {
            id: "m1-1",
            title: "Anatomy of a trustworthy event stream",
            duration: 812,
            is_free_preview: true,
            video_url: V("ForBiggerBlazes.mp4"),
            content_text:
              "An event table has five columns that matter: who, what, when, where, and how it was identified. Most broken analytics starts with a missing or unreliable version of one of them.\n\nWe look at a real event stream and find the problems: duplicate events from client retries, clock skew between mobile and server timestamps, anonymous ids that never merge with a user id, and a properties blob that changed shape three times without a schema version.\n\nThen we fix each one at the staging layer, because fixing them downstream means every model has to remember the fix.",
          },
          {
            id: "m1-2",
            title: "Sessions, identity stitching and the merge problem",
            duration: 1240,
            is_free_preview: false,
            video_url: V("ForBiggerEscapes.mp4"),
            content_text:
              "A user who signs up on Tuesday was anonymous on Monday. If you cannot connect those two identities, your activation metric is wrong by however many people browse before they buy — which is most of them.\n\nWe build an identity map: a table of (anonymous_id, user_id, first_seen) that resolves to a canonical user. Then we rebuild sessions on top of it, with a 30-minute inactivity window and a hard cap at midnight so a session never spans two days.\n\nThe subtle part is the merge. When one person uses two devices, you get two anonymous ids pointing at one user. We handle it with a union-find style resolution in SQL.",
          },
          {
            id: "m1-3",
            title: "Reading a query plan before you optimise",
            duration: 967,
            is_free_preview: false,
            video_url: V("ForBiggerFun.mp4"),
            content_text:
              "Before you add an index, read the plan. EXPLAIN ANALYZE tells you where the time actually goes, and it is almost never where you guessed.\n\nWe take a 40-second dashboard query and walk the plan: a sequential scan on 4.2M rows, a hash join that spills to disk, and a sort that could have been avoided. Three changes later it runs in 1.8 seconds — and none of them was \"add an index\".\n\nThe lesson is a habit: measure, read the plan, change one thing, measure again.",
          },
        ],
      },
      {
        id: "bbbbbbbb-0000-4000-8000-000000000102",
        title: "dbt: Models, Tests and Documentation",
        summary:
          "Build a layered dbt project — staging, intermediate, marts — with tests that catch the bugs that make numbers wrong.",
        order_no: 2,
        lessons: [
          {
            id: "m2-1",
            title: "The three-layer dbt project",
            duration: 1088,
            is_free_preview: false,
            video_url: V("ForBiggerJoyrides.mp4"),
            content_text:
              "Staging, intermediate, marts. Three layers, one rule each.\n\nStaging models rename and cast — one model per source table, nothing else. They are the only place a raw column name appears. Intermediate models do the hard joins and are never exposed to a BI tool. Marts are wide, business-shaped, and are the only thing analysts query.\n\nThis layering is not bureaucracy. It is what lets you change a source column name in one file instead of forty.",
          },
          {
            id: "m2-2",
            title: "Tests that catch the bugs that make numbers wrong",
            duration: 1156,
            is_free_preview: false,
            video_url: V("ForBiggerMeltdowns.mp4"),
            content_text:
              "There are four tests that catch most real analytics bugs, and none of them is not_null.\n\nUniqueness on the grain. Referential integrity on every join key. Accepted values on every enum. And a row-count reconciliation between a model and its upstream, with a tolerance, so a fan-out join is caught the day it ships.\n\nWe write all four, then deliberately introduce a many-to-many join and watch the test fail with a message that names the offending key.",
          },
          {
            id: "m2-3",
            title: "Documentation as a contract",
            duration: 734,
            is_free_preview: false,
            video_url: V("Sintel.mp4"),
            content_text:
              "A metric definition that lives in a Slack thread is not a definition. It is a rumour.\n\nWe put every metric in the dbt project with a description, an owner, and a formula, and we generate the docs site from it. When someone asks \"how do we calculate activation\", the answer is a URL, not a person.\n\nThe contract part: a metric's definition changes only through a pull request, and the pull request shows the diff in the number.",
          },
        ],
      },
      {
        id: "bbbbbbbb-0000-4000-8000-000000000103",
        title: "The Four Metrics That Matter",
        summary:
          "Activation, retention, expansion and churn — defined once, tested, and shipped to a dashboard people trust.",
        order_no: 3,
        lessons: [
          {
            id: "m3-1",
            title: "Activation: the metric everyone defines differently",
            duration: 1290,
            is_free_preview: false,
            video_url: V("TearsOfSteel.mp4"),
            content_text:
              "Activation is the first moment a user gets real value. It is not signup, and it is not \"completed onboarding\".\n\nWe find the activation event empirically: for each candidate event, compare 30-day retention of users who did it in their first week against those who did not. The event with the largest gap is your activation moment. For our dataset it turns out to be creating a second project — not the first, which is the one the product team assumed.",
          },
          {
            id: "m3-2",
            title: "Retention curves and the cohort that lies",
            duration: 1345,
            is_free_preview: false,
            video_url: V("VolkswagenGTIReview.mp4"),
            content_text:
              "A retention curve that flattens is a product with a habit. A curve that goes to zero is a product people try once.\n\nWe build weekly cohorts and plot the curve, then look at the three ways this analysis lies: survivorship, seasonality, and definition drift. We correct for all three and show the corrected curve, which changes the read on the product entirely.",
          },
          {
            id: "m3-3",
            title: "Expansion, churn and the revenue bridge",
            duration: 1102,
            is_free_preview: false,
            video_url: V("WeAreGoingOnBullrun.mp4"),
            content_text:
              "Churn is a rate. Revenue churn is a different rate, and confusing them is how companies miss their number.\n\nWe build a revenue bridge: starting MRR, plus new, plus expansion, minus contraction, minus churn, equals ending MRR. Every line is a tested model. The bridge reconciles to the billing system to the cent, which is the only way finance will trust it.",
          },
        ],
      },
    ],
    reviews: [
      {
        name: "Jesse Anomuoghar",
        rating: 5,
        comment:
          "The identity stitching lesson fixed a bug we had lived with for eight months — our activation number was understated by about 30%. Daniel explains the why before the how, which is rare.",
        date: "2026-09-04T00:00:00Z",
      },
      {
        name: "Hannah Cole",
        rating: 5,
        comment:
          "I have taken three dbt courses. This is the only one that taught me how to make people trust the numbers.",
        date: "2026-08-19T00:00:00Z",
      },
    ],
  },
  {
    id: "cccccccc-0000-4000-8000-000000000001",
    instructor_id: "33333333-3333-4333-8333-333333333333",
    title: "Design Systems in Figma: From Tokens to Components",
    slug: "design-systems-figma-tokens-components",
    subtitle:
      "Build a system that survives contact with engineering — variables, tokens, and components that map 1:1 to code.",
    description:
      "Most design systems die at the handoff. The Figma file is beautiful, the components are named inconsistently, and six months later every team has forked their own button.\n\nThis course builds a system designed for the seam between design and code. You will start with a token architecture — primitive, semantic, component — and implement it with Figma variables so that dark mode is a mode switch rather than a second file. Then you build components with variants that map to real props, and you document them the way an engineer will actually read.\n\nWe work on a realistic product: a B2B analytics dashboard with 14 screens. By the end you will have a published library, a contribution model, and a versioning strategy that does not break every consumer on release.",
    thumbnail_url:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80",
    price: 49.99,
    level: "beginner" as CourseLevel,
    category: "Design",
    language: "English",
    rating_avg: 4.7,
    rating_count: 918,
    student_count: 12760,
    duration_minutes: 298,
    created_at: "2026-01-09T10:00:00Z",
    instructor_name: "Mei Lin",
    instructor_avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
    instructor_headline: "Design Systems Lead · ex-Stripe",
    module_count: 3,
    lesson_count: 9,
    outcomes: [
      "Build a three-layer token architecture that makes dark mode a mode switch",
      "Bind Figma variables correctly and audit the broken bindings",
      "Design variant sets that an engineer can read as a component API",
      "Document components as a contract, including accessibility requirements",
      "Version and govern a library without breaking every consumer",
    ],
    modules: [
      {
        id: "cccccccc-0000-4000-8000-000000000101",
        title: "Tokens: The Foundation Nobody Sees",
        summary:
          "Primitive, semantic and component tokens — and why the middle layer is the one that makes dark mode work.",
        order_no: 1,
        lessons: [
          {
            id: "d1-1",
            title: "Why three layers of tokens, not one",
            duration: 698,
            is_free_preview: true,
            video_url: V("ForBiggerBlazes.mp4"),
            content_text:
              "A single layer of tokens works until the day you need dark mode, or a brand refresh, or a density setting. Then you discover that every component references a raw hex value and you have 400 files to touch.\n\nThree layers fix this. Primitives are the raw palette: blue-500, gray-100, and they never appear in a component. Semantic tokens name intent: surface-default, text-muted, border-subtle. Component tokens are the narrow exceptions: button-primary-bg.\n\nComponents only ever reference semantic or component tokens. That single rule is what makes a theme switch a one-line change instead of a migration.",
          },
          {
            id: "d1-2",
            title: "Figma variables and the mode switch",
            duration: 1044,
            is_free_preview: false,
            video_url: V("ForBiggerEscapes.mp4"),
            content_text:
              "Figma variables are the implementation of the token layer, and modes are how you get light and dark from one component set.\n\nWe create a variable collection with two modes, bind every semantic token to a primitive per mode, and then switch a whole page by changing the frame's mode. No duplicate components, no second file.\n\nThe gotcha: a variable bound to a raw value instead of another variable breaks the chain. We show the audit that finds every broken binding in a file.",
          },
          {
            id: "d1-3",
            title: "Type, spacing and the scale that holds",
            duration: 812,
            is_free_preview: false,
            video_url: V("ForBiggerFun.mp4"),
            content_text:
              "A type scale is a ratio, not a list of sizes someone liked. We use a 1.25 modular scale for UI and a 1.333 for marketing, and we explain why they differ.\n\nSpacing is a 4px base with a restricted set of steps — 4, 8, 12, 16, 24, 32, 48, 64. Restriction is the point. A system with 30 spacing values is not a system, it is a suggestion.\n\nWe bind both to variables so a density mode can scale spacing without touching a single component.",
          },
        ],
      },
      {
        id: "cccccccc-0000-4000-8000-000000000102",
        title: "Components That Map to Code",
        summary:
          "Variants, properties and slots designed so an engineer can read the Figma and write the prop.",
        order_no: 2,
        lessons: [
          {
            id: "d2-1",
            title: "Variants that mirror props",
            duration: 1210,
            is_free_preview: false,
            video_url: V("ForBiggerJoyrides.mp4"),
            content_text:
              "The test for a good variant set: an engineer should be able to read the variant names and write the component API without asking you a question.\n\nWe build a Button with variant (primary, secondary, ghost, destructive), size (sm, md, lg), and state (default, hover, focus, disabled, loading). That is 60 combinations, which is too many to draw — so we use component properties to compose rather than enumerate.\n\nThe anti-pattern we spend time on: a variant for every content permutation. Content belongs in a slot, not a variant.",
          },
          {
            id: "d2-2",
            title: "Auto layout, slots and the responsive component",
            duration: 1088,
            is_free_preview: false,
            video_url: V("ForBiggerMeltdowns.mp4"),
            content_text:
              "A component that only works at one width is a picture, not a component.\n\nWe build with auto layout in both directions, use min/max width instead of fixed, and design the wrap behaviour explicitly. Then we test at 320, 768 and 1440 and fix what breaks.\n\nSlots are the mechanism for content the system does not own: an icon, a badge, a trailing action. We show how to make a slot that accepts a swap without letting the consumer break the padding.",
          },
          {
            id: "d2-3",
            title: "Documenting for the engineer who will build it",
            duration: 934,
            is_free_preview: false,
            video_url: V("Sintel.mp4"),
            content_text:
              "Documentation is not a description of what the component looks like. It is the contract: when to use it, when not to, what it accepts, and what it does at the edges.\n\nWe write a component page with four sections — anatomy, usage, props table, accessibility notes — and we keep it inside the Figma file so it cannot drift from the component.\n\nThe accessibility section is not optional. Focus order, contrast ratios, and the aria attributes the engineer must add are part of the design.",
          },
        ],
      },
      {
        id: "cccccccc-0000-4000-8000-000000000103",
        title: "Shipping and Governing the System",
        summary:
          "Publishing a library, versioning without breaking consumers, and a contribution model that scales.",
        order_no: 3,
        lessons: [
          {
            id: "d3-1",
            title: "Publishing a library people actually use",
            duration: 876,
            is_free_preview: false,
            video_url: V("TearsOfSteel.mp4"),
            content_text:
              "Publishing is a technical step. Adoption is a social one, and the social one is harder.\n\nWe publish the library, then do the three things that drive adoption: a 20-minute onboarding session per team, a \"system office hours\" slot, and a migration path for the components teams already built. Without the third, they will not switch — nobody rewrites working UI for elegance.",
          },
          {
            id: "d3-2",
            title: "Versioning without breaking everyone",
            duration: 1024,
            is_free_preview: false,
            video_url: V("VolkswagenGTIReview.mp4"),
            content_text:
              "Semantic versioning applies to design systems exactly as it does to code: patch for a fix, minor for an addition, major for a break.\n\nThe hard part is agreeing what counts as a break. Changing a component's default padding is a visual change but a breaking one for any layout that depended on it. We write the rule down and put it in the contribution guide, so the argument happens once.\n\nWe also show the deprecation flow: mark, warn, wait one major, remove.",
          },
          {
            id: "d3-3",
            title: "A contribution model that scales past you",
            duration: 790,
            is_free_preview: false,
            video_url: V("WeAreGoingOnBullrun.mp4"),
            content_text:
              "If every component needs your review, the system stops scaling at about four teams.\n\nWe set up a contribution model with three tiers: a bug fix anyone can ship, a new variant that needs one maintainer review, and a new component that needs a design review and an engineering review. Each tier has a template and a turnaround commitment.\n\nThe final piece is the health metric. We track adoption percentage, override count, and time-to-first-contribution, and we review them monthly.",
          },
        ],
      },
    ],
    reviews: [
      {
        name: "Jesse Anomuoghar",
        rating: 4,
        comment:
          "The three-layer token explanation finally made dark mode click for me. I would have liked more on the code side of tokens, but the governance module is genuinely the best I have seen.",
        date: "2026-09-27T00:00:00Z",
      },
      {
        name: "Sofia Marchetti",
        rating: 5,
        comment:
          "Mei is the first person to explain why my design system kept getting forked. The contribution model fixed it in a month.",
        date: "2026-08-30T00:00:00Z",
      },
    ],
  },
];

export const DEMO_STUDENT = {
  id: "44444444-4444-4444-8444-444444444444",
  full_name: "Jesse Anomuoghar",
  role: "student" as const,
  avatar_url: null,
  headline: "Founder & CEO",
  xp_points: 340,
  streak: 6,
  last_active_date: new Date().toISOString().slice(0, 10),
};

export interface DemoEnrollment {
  courseId: string;
  progress: number;
  completedLessons: string[];
  lastLessonId: string | null;
}

export const DEMO_ENROLLMENTS: DemoEnrollment[] = [
  {
    courseId: DEMO_COURSES[0].id,
    progress: 18,
    completedLessons: ["l1-1", "l1-2"],
    lastLessonId: "l1-2",
  },
  {
    courseId: DEMO_COURSES[1].id,
    progress: 0,
    completedLessons: [],
    lastLessonId: null,
  },
];

export const TRUSTED_BY = [
  "Vercel",
  "Stripe",
  "Linear",
  "Notion",
  "Figma",
  "Shopify",
  "Datadog",
  "Ramp",
];

export function findDemoCourse(slugOrId: string): DemoCourse | undefined {
  return DEMO_COURSES.find((c) => c.slug === slugOrId || c.id === slugOrId);
}

export function demoLessonCount(course: DemoCourse): number {
  return course.modules.reduce((n, m) => n + m.lessons.length, 0);
}
