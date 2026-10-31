import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  PlayCircle,
  Check,
  Star,
  Zap,
  ShieldCheck,
  BrainCircuit,
  Award,
  Users,
  TrendingUp,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";
import { TrustedBy } from "@/components/marketing/trusted-by";
import { PricingSection } from "@/components/marketing/pricing-section";
import { DEMO_COURSES, TRUSTED_BY } from "@/lib/demo-data";
import { formatCount } from "@/lib/utils";

export const metadata: Metadata = {
  title: "LearnSphere Global — Learn the skills that actually ship",
  description:
    "World-class courses in engineering, data and design, taught by practitioners who have shipped at scale. Build real systems with an AI tutor grounded in your course material.",
  alternates: { canonical: "/" },
};

const STATS = [
  { value: "184K+", label: "Learners worldwide" },
  { value: "4.8/5", label: "Average course rating" },
  { value: "92%", label: "Complete their first course" },
  { value: "38", label: "Countries represented" },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "An AI tutor that read the course",
    body: "Every lesson is embedded and indexed. Ask a question and the tutor answers from your actual course material, with citations — not from the open internet.",
  },
  {
    icon: Zap,
    title: "Progress that survives a refresh",
    body: "Your position in every lesson is saved as you watch. Close the tab, switch devices, come back in a week — you resume exactly where you stopped.",
  },
  {
    icon: Award,
    title: "Certificates that mean something",
    body: "Finish a course and a verifiable certificate is generated automatically, with a number anyone can check. No forms, no waiting.",
  },
  {
    icon: ShieldCheck,
    title: "Built on real engineering",
    body: "Row-level security, idempotent payments, tested data models. The platform is built the way the courses teach you to build.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Pick a course that builds something",
    body: "No theory-only curricula. Every course ends with a working artifact — a deployed app, a tested data model, a published design system.",
  },
  {
    n: "02",
    title: "Learn with a tutor that knows the material",
    body: "Stuck at 2am? The AI tutor answers from the lesson you are on, cites the source, and gives a worked example instead of a definition.",
  },
  {
    n: "03",
    title: "Finish, and get proof",
    body: "Hit 100% and your certificate is issued automatically. Add it to LinkedIn in one click, or share the verification link.",
  },
];

export default function HomePage() {
  const courses = DEMO_COURSES;

  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* ---------------------------------------------------------------- HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 gradient-wash" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] grid-lines opacity-[0.55]" aria-hidden />

          <div className="container relative pb-16 pt-16 sm:pt-24 lg:pb-24 lg:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <Link
                  href="#ai-tutor"
                  className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-3.5 py-1.5 text-[0.75rem] font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  New — AI tutor grounded in every lesson
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Reveal>

              <Reveal delay={0.06}>
                <h1 className="mt-7 text-balance font-display text-display-xl text-gradient">
                  Learn the skills that
                  <br className="hidden sm:block" />{" "}
                  <span className="italic text-gradient-primary">actually ship</span>
                </h1>
              </Reveal>

              <Reveal delay={0.12}>
                <p className="mx-auto mt-6 max-w-xl text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
                  Courses in engineering, data and design — taught by people who have
                  shipped at scale. You build a real system, not a todo list, and an AI
                  tutor is with you the whole way.
                </p>
              </Reveal>

              <Reveal delay={0.18}>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button size="xl" asChild className="w-full sm:w-auto">
                    <Link href="/signup">
                      Start learning free
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/courses">
                      <PlayCircle className="h-4 w-4" />
                      Browse courses
                    </Link>
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={0.24}>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.75rem] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    No credit card required
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Free preview on every course
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Certificate on completion
                  </span>
                </div>
              </Reveal>
            </div>

            {/* Product preview */}
            <Reveal delay={0.3} className="mt-16">
              <div className="relative mx-auto max-w-5xl">
                <div className="absolute -inset-x-8 -top-6 bottom-0 rounded-[2rem] bg-gradient-to-b from-primary/12 to-transparent blur-2xl" aria-hidden />
                <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lift">
                  <div className="flex items-center gap-2 border-b border-border/70 bg-secondary/40 px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                    </div>
                    <div className="mx-auto flex items-center gap-1.5 rounded-md bg-background/80 px-3 py-1 text-[0.6875rem] text-muted-foreground">
                      <ShieldCheck className="h-3 w-3 text-emerald-500" />
                      learnsphere.global/dashboard
                    </div>
                  </div>
                  <div className="grid gap-0 md:grid-cols-[1.15fr_1fr]">
                    <div className="border-b border-border/70 p-6 md:border-b-0 md:border-r">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="eyebrow">Continue learning</p>
                          <h3 className="mt-1.5 font-display text-lg font-semibold tracking-tight">
                            Full-Stack TypeScript with Next.js 14
                          </h3>
                        </div>
                        <Badge variant="success">18%</Badge>
                      </div>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full w-[18%] rounded-full bg-primary" />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Lesson 3 of 11 · Server Components, Client Components
                      </p>

                      <div className="mt-6 grid grid-cols-3 gap-3">
                        {[
                          { icon: Zap, label: "XP", value: "340" },
                          { icon: TrendingUp, label: "Streak", value: "6 days" },
                          { icon: Award, label: "Certs", value: "0" },
                        ].map(({ icon: Icon, label, value }) => (
                          <div key={label} className="rounded-xl border border-border/70 bg-secondary/30 p-3">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                            <p className="mt-2 font-display text-base font-semibold tracking-tight">{value}</p>
                            <p className="text-[0.625rem] uppercase tracking-wider text-muted-foreground">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                          <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                        </span>
                        <p className="text-[0.8125rem] font-semibold">AI Tutor</p>
                        <Badge variant="outline" className="ml-auto text-[0.625rem]">Grounded</Badge>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-[0.75rem] leading-relaxed text-primary-foreground">
                          Why does my RLS policy let users update rows they shouldn&apos;t?
                        </div>
                        <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md border border-border/70 bg-secondary/40 px-3.5 py-2.5 text-[0.75rem] leading-relaxed text-foreground/85">
                          You likely have a <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.7rem]">USING</code> clause
                          without <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.7rem]">WITH CHECK</code>.{" "}
                          <span className="text-primary">[Source 2]</span> — USING filters what is visible; WITH CHECK validates the new row.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ------------------------------------------------------------ TRUSTED */}
        <TrustedBy brands={TRUSTED_BY} />

        {/* -------------------------------------------------------------- STATS */}
        <section className="border-y border-border/70 bg-secondary/25">
          <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.05}>
                <div className="text-center md:text-left">
                  <p className="font-display text-3xl font-semibold tracking-tight text-foreground">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[0.75rem] text-muted-foreground">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------ COURSES */}
        <section id="courses" className="container py-20 lg:py-28">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-xl">
                <p className="eyebrow">The catalogue</p>
                <h2 className="mt-3 text-balance font-display text-display-md text-gradient">
                  Three courses. Each one ends with something you built.
                </h2>
                <p className="mt-4 text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">
                  We publish slowly and deliberately. Every course is written by a
                  practitioner, reviewed by a second one, and rebuilt when the tooling
                  changes.
                </p>
              </div>
              <Button variant="outline" asChild className="shrink-0">
                <Link href="/courses">
                  All courses
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------------- FEATURES */}
        <section id="ai-tutor" className="border-y border-border/70 bg-secondary/25">
          <div className="container py-20 lg:py-28">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="eyebrow">Why it works</p>
                <h2 className="mt-3 text-balance font-display text-display-md text-gradient">
                  Built for the moment you get stuck
                </h2>
                <p className="mt-4 text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">
                  Most people who abandon a course do it in the first hour, alone, on one
                  confusing sentence. Everything here is designed around that moment.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.06}>
                  <div className="card-sheen group h-full rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                      <f.icon className="h-[1.15rem] w-[1.15rem]" />
                    </span>
                    <h3 className="mt-4 font-display text-[1.0625rem] font-semibold tracking-tight">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- HOW IT WORKS */}
        <section id="how-it-works" className="container py-20 lg:py-28">
          <Reveal>
            <div className="max-w-xl">
              <p className="eyebrow">How it works</p>
              <h2 className="mt-3 text-balance font-display text-display-md text-gradient">
                Three steps, no ceremony
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className="relative">
                  <span className="font-mono text-[0.6875rem] font-medium tracking-widest text-primary">
                    {s.n}
                  </span>
                  <div className="mt-3 h-px w-full bg-gradient-to-r from-primary/40 to-transparent" />
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------------- INSTRUCTORS */}
        <section id="instructors" className="border-y border-border/70 bg-secondary/25">
          <div className="container py-20 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <Reveal>
                <div>
                  <p className="eyebrow">The instructors</p>
                  <h2 className="mt-3 text-balance font-display text-display-md text-gradient">
                    Taught by people who did the job
                  </h2>
                  <p className="mt-4 text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">
                    Not professional course-sellers. Every instructor is a working or
                    recently-working practitioner, and every course is reviewed by a
                    second practitioner before it goes live.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      "Average 11 years of hands-on experience",
                      "Courses rebuilt when the tooling changes",
                      "Direct Q&A access in every course",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[0.875rem] text-foreground/80">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-7">
                    <Link href="/instructor">
                      Teach on LearnSphere
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="grid gap-4 sm:grid-cols-2">
                  {courses.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
                    >
                      <div className="flex items-center gap-3">
                        {c.instructor_avatar && (
                          <Image
                            src={c.instructor_avatar}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-[0.8125rem] font-semibold">{c.instructor_name}</p>
                          <p className="truncate text-[0.6875rem] text-muted-foreground">
                            {c.instructor_headline}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-3 text-[0.6875rem] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {c.rating_avg.toFixed(1)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatCount(c.student_count)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- PRICING */}
        <PricingSection />

        {/* ---------------------------------------------------------------- CTA */}
        <section className="container pb-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/[0.09] via-card to-card px-6 py-16 text-center shadow-soft sm:px-12">
              <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" aria-hidden />
              <div className="relative">
                <Badge variant="default" className="mb-5">
                  <Sparkles className="h-3 w-3" />
                  Start today
                </Badge>
                <h2 className="mx-auto max-w-2xl text-balance font-display text-display-lg text-gradient">
                  The best time to build the thing was last year.
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">
                  The second best time is now. Start with a free preview lesson — no
                  account, no card, no email.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button size="xl" asChild>
                    <Link href="/signup">
                      Create a free account
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="xl" variant="outline" asChild>
                    <Link href="/courses">See the catalogue</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
