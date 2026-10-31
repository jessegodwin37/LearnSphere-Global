"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Award,
  Settings,
  GraduationCap,
  Users,
  BarChart3,
  PlusCircle,
  Shield,
  Menu,
  Flame,
  Zap,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";
import type { UserRole } from "@/lib/database.types";

export interface ShellUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  xp_points: number;
  streak: number;
}

const NAV_BY_ROLE: Record<UserRole, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  student: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/courses", label: "My courses", icon: BookOpen },
    { href: "/dashboard/certificates", label: "Certificates", icon: Award },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  instructor: [
    { href: "/instructor", label: "Overview", icon: LayoutDashboard },
    { href: "/instructor/courses", label: "My courses", icon: BookOpen },
    { href: "/instructor/students", label: "Students", icon: Users },
    { href: "/instructor/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/dashboard", label: "Learner view", icon: GraduationCap },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/courses", label: "Courses", icon: BookOpen },
    { href: "/admin/payments", label: "Payments", icon: BarChart3 },
    { href: "/dashboard", label: "Learner view", icon: GraduationCap },
  ],
};

export function AppShell({
  user,
  children,
  title,
  subtitle,
  actions,
}: {
  user: ShellUser;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const nav = NAV_BY_ROLE[user.role] ?? NAV_BY_ROLE.student;

  React.useEffect(() => setMobileOpen(false), [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <span className="font-display text-[1.0625rem] tracking-tight">
          LearnSphere<span className="ml-1 text-muted-foreground">Global</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-0.5 px-3 py-2" aria-label="Dashboard">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8125rem] font-medium transition-colors",
                active
                  ? "bg-primary/[0.08] text-primary"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {user.role === "instructor" && (
          <div className="pt-3">
            <p className="px-3 pb-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Create
            </p>
            <Link
              href="/instructor/courses/new"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <PlusCircle className="h-4 w-4" />
              New course
            </Link>
          </div>
        )}

        {user.role === "admin" && (
          <div className="pt-3">
            <p className="px-3 pb-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Platform
            </p>
            <Link
              href="/admin"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              <Shield className="h-4 w-4" />
              Admin console
            </Link>
          </div>
        )}
      </nav>

      {/* Gamification strip */}
      <div className="mx-3 mb-3 rounded-xl border border-border/70 bg-secondary/40 p-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-medium text-muted-foreground">
            <Zap className="h-3 w-3 text-primary" />
            {user.xp_points.toLocaleString()} XP
          </span>
          <span className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-amber-600 dark:text-amber-400">
            <Flame className="h-3 w-3" />
            {user.streak}d
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${Math.min(100, (user.xp_points % 500) / 5)}%` }}
          />
        </div>
        <p className="mt-1.5 text-[0.625rem] text-muted-foreground">
          {500 - (user.xp_points % 500)} XP to next level
        </p>
      </div>

      <div className="border-t border-border/70 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <Avatar className="h-8 w-8">
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt="" />}
            <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-medium">
              {user.full_name ?? "Learner"}
            </p>
            <p className="truncate text-[0.625rem] capitalize text-muted-foreground">
              {user.role}
            </p>
          </div>
          <form action="/auth/signout" method="post">
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              aria-label="Sign out"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-border/70 bg-card/50 lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-[268px] border-r border-border/70 bg-card lg:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="lg:pl-[248px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[1.0625rem] font-semibold tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="truncate text-[0.75rem] text-muted-foreground">{subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {actions}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
