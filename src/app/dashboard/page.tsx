import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Flame,
  Zap,
  Award,
  BookOpen,
  Clock,
  TrendingUp,
  PlayCircle,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getShellUser } from "@/lib/session";
import { DEMO_COURSES, DEMO_ENROLLMENTS } from "@/lib/demo-data";
import { formatDuration, formatCount } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

const WEEK = [
  { day: "Mon", minutes: 42 },
  { day: "Tue", minutes: 68 },
  { day: "Wed", minutes: 0 },
  { day: "Thu", minutes: 95 },
  { day: "Fri", minutes: 54 },
  { day: "Sat", minutes: 120 },
  { day: "Sun", minutes: 30 },
];

export default async function DashboardPage() {
  const user = await getShellUser();

  const enrolled = DEMO_ENROLLMENTS.map((e) => ({
    ...e,
    course: DEMO_COURSES.find((c) => c.id === e.courseId)!,
  })).filter((e) => e.course);

  const inProgress = enrolled.filter((e) => e.progress < 100);
  const completed = enrolled.filter((e) => e.progress >= 100);
  const totalMinutes = WEEK.reduce((s, d) => s + d.minutes, 0);
  const maxMinutes = Math.max(...WEEK.map((d) => d.minutes), 1);

  const nextLesson = (() => {
    const first = inProgress[0];
    if (!first) return null;
    for (const mod of first.course.modules) {
      for (const lesson of mod.lessons) {
        if (!first.completedLessons.includes(lesson.id)) {
          return { course: first.course, module: mod, lesson };
        }
      }
    }
    return null;
  })();

  return (
    <AppShell
      user={user}
      title={`Welcome back, ${user.full_name?.split(" ")[0] ?? "learner"}`}
      subtitle="You're 2 lessons from your next milestone."
      actions={
        <Button size="sm" asChild className="hidden sm:inline-flex">
          <Link href="/courses">
            Browse courses
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      }
    >
      {/* Stat row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: Zap,
            label: "Total XP",
            value: user.xp_points.toLocaleString(),
            hint: `${500 - (user.xp_points % 500)} to next level`,
            tone: "text-primary",
          },
          {
            icon: Flame,
            label: "Current streak",
            value: `${user.streak} days`,
            hint: "Personal best: 12 days",
            tone: "text-amber-500",
          },
          {
            icon: BookOpen,
            label: "Courses in progress",
            value: String(inProgress.length),
            hint: `${completed.length} completed`,
            tone: "text-sky-500",
          },
          {
            icon: Clock,
            label: "This week",
            value: formatDuration(totalMinutes),
            hint: "Across 6 sessions",
            tone: "text-emerald-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="card-sheen rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
              <s.icon className={`h-4 w-4 ${s.tone}`} />
            </div>
            <p className="mt-2.5 font-display text-2xl font-semibold tracking-tight">
              {s.value}
            </p>
            <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Continue learning */}
        <div className="space-y-6">
          {nextLesson && (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
              <div className="relative aspect-[21/9] bg-muted">
                {nextLesson.course.thumbnail_url && (
                  <Image
                    src={nextLesson.course.thumbnail_url}
                    alt=""
                    fill
                    sizes="(max-width: 1280px) 100vw, 60vw"
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <Badge className="mb-2 border-white/20 bg-white/15 text-white backdrop-blur">
                    Continue where you left off
                  </Badge>
                  <h2 className="text-balance font-display text-lg font-semibold tracking-tight text-white sm:text-xl">
                    {nextLesson.lesson.title}
                  </h2>
                  <p className="mt-1 text-[0.75rem] text-white/70">
                    {nextLesson.course.title} · {nextLesson.module.title}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button size="sm" asChild>
                      <Link href={`/learn/${nextLesson.course.slug}?lesson=${nextLesson.lesson.id}`}>
                        <PlayCircle className="h-3.5 w-3.5" />
                        Resume lesson
                      </Link>
                    </Button>
                    <span className="text-[0.6875rem] text-white/60">
                      {Math.round(nextLesson.lesson.duration / 60)} min left
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold tracking-tight">
                My courses
              </h2>
              <Link
                href="/dashboard/courses"
                className="text-[0.75rem] font-medium text-muted-foreground hover:text-foreground"
              >
                View all
              </Link>
            </div>

            <div className="mt-3 space-y-3">
              {enrolled.map((e) => {
                const totalLessons = e.course.modules.reduce(
                  (n, m) => n + m.lessons.length,
                  0,
                );
                return (
                  <Link
                    key={e.courseId}
                    href={`/learn/${e.course.slug}`}
                    className="group flex gap-4 rounded-2xl border border-border/70 bg-card p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <div className="relative h-[68px] w-[104px] shrink-0 overflow-hidden rounded-lg bg-muted">
                      {e.course.thumbnail_url && (
                        <Image
                          src={e.course.thumbnail_url}
                          alt=""
                          fill
                          sizes="104px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-1 text-[0.875rem] font-medium transition-colors group-hover:text-primary">
                          {e.course.title}
                        </h3>
                        <span className="shrink-0 font-mono text-[0.6875rem] text-muted-foreground">
                          {Math.round(e.progress)}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                        {e.completedLessons.length} of {totalLessons} lessons ·{" "}
                        {e.course.instructor_name}
                      </p>
                      <Progress value={e.progress} className="mt-2.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          {/* Weekly activity */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold tracking-tight">
                This week
              </h2>
              <span className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                +18%
              </span>
            </div>
            <div className="mt-5 flex h-28 items-end gap-2">
              {WEEK.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-primary/85 transition-all duration-500 hover:bg-primary"
                      style={{ height: `${Math.max(4, (d.minutes / maxMinutes) * 100)}%` }}
                      title={`${d.minutes} min`}
                    />
                  </div>
                  <span className="text-[0.5625rem] text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[0.6875rem] text-muted-foreground">
              {formatDuration(totalMinutes)} studied · best day Saturday
            </p>
          </div>

          {/* Daily goal */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold tracking-tight">
                Daily goal
              </h2>
            </div>
            <p className="mt-1 text-[0.6875rem] text-muted-foreground">
              30 minutes a day keeps the streak alive
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-secondary" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                    strokeLinecap="round"
                    className="stroke-primary"
                    strokeDasharray={`${(30 / 30) * 97.4} 97.4`}
                  />
                </svg>
                <span className="absolute font-display text-sm font-semibold">30</span>
              </div>
              <div>
                <p className="text-[0.8125rem] font-medium">Goal met</p>
                <p className="text-[0.6875rem] text-muted-foreground">
                  30 of 30 minutes today
                </p>
              </div>
            </div>
          </div>

          {/* Certificates */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold tracking-tight">
                Certificates
              </h2>
            </div>
            {completed.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-center">
                <p className="text-[0.75rem] text-muted-foreground">
                  Finish a course to earn your first certificate.
                </p>
                <Button variant="outline" size="sm" asChild className="mt-3">
                  <Link href="/courses">Find a course</Link>
                </Button>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {completed.map((e) => (
                  <li key={e.courseId} className="flex items-center gap-2 text-[0.75rem]">
                    <Award className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="truncate">{e.course.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recommended */}
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="font-display text-base font-semibold tracking-tight">
              Recommended next
            </h2>
            <div className="mt-3 space-y-3">
              {DEMO_COURSES.filter((c) => !enrolled.some((e) => e.courseId === c.id))
                .slice(0, 2)
                .map((c) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.slug}`}
                    className="group flex gap-3"
                  >
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {c.thumbnail_url && (
                        <Image src={c.thumbnail_url} alt="" fill sizes="64px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[0.75rem] font-medium leading-snug transition-colors group-hover:text-primary">
                        {c.title}
                      </p>
                      <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
                        {formatCount(c.student_count)} students
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
