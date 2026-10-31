import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  PlusCircle,
  Users,
  Star,
  TrendingUp,
  DollarSign,
  BookOpen,
  ArrowRight,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getShellUser } from "@/lib/session";
import { DEMO_COURSES } from "@/lib/demo-data";
import { formatCount, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Instructor dashboard",
  robots: { index: false, follow: false },
};

const STUDENTS = [
  { name: "Jesse Anomuoghar", course: "Full-Stack TypeScript", progress: 18, joined: "2 days ago" },
  { name: "Priya Raman", course: "Full-Stack TypeScript", progress: 74, joined: "1 week ago" },
  { name: "Tomas Berg", course: "Full-Stack TypeScript", progress: 100, joined: "3 weeks ago" },
  { name: "Hannah Cole", course: "Product Analytics", progress: 42, joined: "4 days ago" },
  { name: "Sofia Marchetti", course: "Design Systems", progress: 91, joined: "2 weeks ago" },
];

export default async function InstructorDashboard() {
  const user = await getShellUser();
  const myCourses = DEMO_COURSES.slice(0, 1);

  const revenue = 18420 * 89.99 * 0.7;
  const avgRating =
    myCourses.reduce((s, c) => s + c.rating_avg, 0) / Math.max(myCourses.length, 1);

  return (
    <AppShell
      user={{ ...user, role: "instructor" }}
      title="Instructor dashboard"
      subtitle="Your courses, students and revenue at a glance."
      actions={
        <Button size="sm" asChild>
          <Link href="/instructor/courses/new">
            <PlusCircle className="h-3.5 w-3.5" />
            New course
          </Link>
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Users, label: "Total students", value: formatCount(18420), hint: "+312 this month", tone: "text-primary" },
          { icon: DollarSign, label: "Net revenue", value: formatPrice(Math.round(revenue)), hint: "After 30% platform fee", tone: "text-emerald-500" },
          { icon: Star, label: "Average rating", value: avgRating.toFixed(2), hint: "Across 1,284 reviews", tone: "text-amber-500" },
          { icon: TrendingUp, label: "Completion rate", value: "68%", hint: "Platform average: 52%", tone: "text-sky-500" },
        ].map((s) => (
          <div key={s.label} className="card-sheen rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
              <s.icon className={`h-4 w-4 ${s.tone}`} />
            </div>
            <p className="mt-2.5 font-display text-2xl font-semibold tracking-tight">{s.value}</p>
            <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* My courses */}
          <div className="rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <h2 className="font-display text-base font-semibold tracking-tight">My courses</h2>
              <Link href="/instructor/courses" className="text-[0.75rem] font-medium text-muted-foreground hover:text-foreground">
                Manage all
              </Link>
            </div>

            <ul className="divide-y divide-border/70">
              {myCourses.map((c) => (
                <li key={c.id} className="flex items-center gap-4 p-4">
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {c.thumbnail_url && (
                      <Image src={c.thumbnail_url} alt="" fill sizes="80px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[0.8125rem] font-medium">{c.title}</p>
                      <Badge variant="success" className="shrink-0">Published</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.6875rem] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {formatCount(c.student_count)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {c.rating_avg.toFixed(1)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {c.lesson_count} lessons
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon-sm" asChild aria-label="Preview course">
                      <Link href={`/courses/${c.slug}`}>
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="More options">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-border/70 p-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/instructor/courses/new">
                  <PlusCircle className="h-4 w-4" />
                  Create a new course
                </Link>
              </Button>
            </div>
          </div>

          {/* Recent students */}
          <div className="rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <h2 className="font-display text-base font-semibold tracking-tight">Recent students</h2>
              <Link href="/instructor/students" className="text-[0.75rem] font-medium text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-border/70">
              {STUDENTS.map((s) => (
                <li key={s.name} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.625rem] font-semibold text-primary">
                    {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-medium">{s.name}</p>
                    <p className="truncate text-[0.625rem] text-muted-foreground">
                      {s.course} · joined {s.joined}
                    </p>
                  </div>
                  <div className="w-20 shrink-0">
                    <Progress value={s.progress} className="h-1" />
                    <p className="mt-1 text-right font-mono text-[0.5625rem] text-muted-foreground">
                      {s.progress}%
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="font-display text-base font-semibold tracking-tight">Revenue</h2>
            <p className="mt-1 text-[0.6875rem] text-muted-foreground">Last 6 months</p>
            <div className="mt-5 flex h-32 items-end gap-2">
              {[38, 52, 44, 68, 79, 92].map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                      style={{ height: `${v}%` }}
                    />
                  </div>
                  <span className="text-[0.5625rem] text-muted-foreground">
                    {["May", "Jun", "Jul", "Aug", "Sep", "Oct"][i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-border/70 pt-3">
              <span className="text-[0.6875rem] text-muted-foreground">This month</span>
              <span className="font-display text-lg font-semibold tracking-tight">
                {formatPrice(Math.round(revenue / 6))}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="font-display text-base font-semibold tracking-tight">Upload assets</h2>
            <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
              Thumbnails and lesson videos go straight to Supabase Storage — the browser
              uploads directly, never through the server.
            </p>
            <div className="mt-4 space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/instructor/courses/new">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Upload thumbnail
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/instructor/courses/new">
                  <BookOpen className="h-3.5 w-3.5" />
                  Upload lesson video
                </Link>
              </Button>
            </div>
            <p className="mt-3 rounded-md bg-secondary/50 px-2.5 py-2 font-mono text-[0.5625rem] leading-relaxed text-muted-foreground">
              course-thumbnails/{"{uid}"}/cover.webp
              <br />
              course-videos/{"{uid}"}/lesson-01.mp4
            </p>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-5">
            <h2 className="font-display text-base font-semibold tracking-tight">
              Generate an outline
            </h2>
            <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
              Describe a topic and the AI drafts a full module and lesson structure you
              can edit before publishing.
            </p>
            <Button size="sm" className="mt-3 w-full" asChild>
              <Link href="/instructor/courses/new">
                Try the generator
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
