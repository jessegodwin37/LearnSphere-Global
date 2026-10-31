import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  BookOpen,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getShellUser } from "@/lib/session";
import { DEMO_COURSES } from "@/lib/demo-data";
import { formatCount, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin console",
  robots: { index: false, follow: false },
};

const USERS = [
  { name: "Jesse Anomuoghar", email: "student@learnsphere.demo", role: "student", xp: 340, joined: "2026-10-28" },
  { name: "Amara Okafor", email: "amara@learnsphere.demo", role: "instructor", xp: 12400, joined: "2026-02-01" },
  { name: "Daniel Reyes", email: "daniel@learnsphere.demo", role: "instructor", xp: 9800, joined: "2026-03-10" },
  { name: "Mei Lin", email: "mei@learnsphere.demo", role: "instructor", xp: 7600, joined: "2026-01-05" },
  { name: "Priya Raman", email: "priya@example.com", role: "student", xp: 1820, joined: "2026-09-14" },
  { name: "Tomas Berg", email: "tomas@example.com", role: "student", xp: 2410, joined: "2026-08-22" },
];

const ROLE_STYLE: Record<string, "default" | "secondary" | "warning"> = {
  admin: "warning",
  instructor: "default",
  student: "secondary",
};

export default async function AdminDashboard() {
  const user = await getShellUser();

  const gmv = DEMO_COURSES.reduce((s, c) => s + c.price * c.student_count, 0);

  return (
    <AppShell
      user={{ ...user, role: "admin" }}
      title="Admin console"
      subtitle="Platform health, users and revenue. Access is gated by is_admin()."
      actions={
        <Badge variant="warning" className="hidden sm:inline-flex">
          <ShieldCheck className="h-3 w-3" />
          Admin
        </Badge>
      }
    >
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Users, label: "Total users", value: "40,491", hint: "+1,204 this week", tone: "text-primary" },
          { icon: BookOpen, label: "Published courses", value: String(DEMO_COURSES.length), hint: "2 in review", tone: "text-sky-500" },
          { icon: DollarSign, label: "Platform GMV", value: formatPrice(Math.round(gmv)), hint: "30% take rate", tone: "text-emerald-500" },
          { icon: TrendingUp, label: "Active streaks", value: "8,912", hint: "22% of learners", tone: "text-amber-500" },
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Users table */}
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
            <h2 className="font-display text-base font-semibold tracking-tight">Users</h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
              <input
                placeholder="Search users…"
                className="h-8 w-48 rounded-md border border-input bg-background pl-8 pr-2.5 text-[0.75rem] placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/70 bg-secondary/30">
                  {["User", "Role", "XP", "Joined", ""].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-5 py-2.5 text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {USERS.map((u) => (
                  <tr key={u.email} className="transition-colors hover:bg-secondary/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.5625rem] font-semibold text-primary">
                          {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[0.8125rem] font-medium">{u.name}</p>
                          <p className="truncate text-[0.625rem] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={ROLE_STYLE[u.role] ?? "secondary"} className="capitalize">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[0.75rem] text-muted-foreground">
                      {u.xp.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-[0.75rem] text-muted-foreground">
                      {u.joined}
                    </td>
                    <td className="px-3 py-3">
                      <Button variant="ghost" size="icon-sm" aria-label="Row actions">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-border/70 px-5 py-3">
            <p className="text-[0.6875rem] text-muted-foreground">
              Showing 6 of 40,491 users
            </p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="font-display text-base font-semibold tracking-tight">Courses</h2>
            <ul className="mt-3 space-y-3">
              {DEMO_COURSES.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/courses/${c.slug}`}
                      className="line-clamp-2 text-[0.75rem] font-medium leading-snug hover:text-primary"
                    >
                      {c.title}
                    </Link>
                    <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
                      {c.instructor_name} · {formatCount(c.student_count)} students
                    </p>
                  </div>
                  <Badge variant="success" className="shrink-0">Live</Badge>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
            <h2 className="font-display text-base font-semibold tracking-tight">Payments</h2>
            <p className="mt-1 text-[0.6875rem] text-muted-foreground">
              Stripe and Paystack webhooks write to the payments table.
            </p>
            <ul className="mt-3 space-y-2">
              {[
                { ref: "pi_3Qx…8f2", amount: 89.99, provider: "Stripe", status: "succeeded" },
                { ref: "psk_9Lm…4a1", amount: 64.99, provider: "Paystack", status: "succeeded" },
                { ref: "pi_3Qw…1c9", amount: 49.99, provider: "Stripe", status: "succeeded" },
              ].map((p) => (
                <li key={p.ref} className="flex items-center justify-between gap-2 text-[0.6875rem]">
                  <span className="font-mono text-muted-foreground">{p.ref}</span>
                  <span className="text-muted-foreground">{p.provider}</span>
                  <span className="font-medium">{formatPrice(p.amount)}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
              <Link href="/admin/payments">View all payments</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <h2 className="font-display text-base font-semibold tracking-tight">
                Access control
              </h2>
            </div>
            <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
              This route is protected twice: middleware checks the profile role, and every
              query is additionally filtered by the <code className="rounded bg-background px-1 py-0.5 font-mono text-[0.625rem]">is_admin()</code> RLS
              policy. A forged client claim cannot get past the database.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
