"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle2, GraduationCap, BookOpen } from "lucide-react";
import { signUp } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    value: "student",
    label: "I want to learn",
    hint: "Take courses, earn certificates",
    icon: BookOpen,
  },
  {
    value: "instructor",
    label: "I want to teach",
    hint: "Publish courses, track students",
    icon: GraduationCap,
  },
] as const;

export function SignupForm() {
  const [role, setRole] = React.useState<"student" | "instructor">("student");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("role", role);
    const result = await signUp(undefined, formData);
    if (result?.error) setError(result.error);
    if (result?.message) setMessage(result.message);
    setPending(false);
  }

  if (message) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </span>
        <h1 className="mt-5 font-display text-2xl tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">{message}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[1.875rem] leading-tight tracking-tight">
        Create your account
      </h1>
      <p className="mt-2 text-[0.875rem] text-muted-foreground">
        Free to start. No card required.
      </p>

      <div className="mt-7">
        <OAuthButtons />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[0.6875rem] uppercase tracking-wider text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-2.5 text-[0.8125rem] text-destructive">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>I&apos;m here to</Label>
          <div className="grid grid-cols-2 gap-2.5">
            {ROLES.map((r) => {
              const active = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all duration-200",
                    active
                      ? "border-primary/40 bg-primary/[0.06] shadow-sm"
                      : "border-border/70 hover:border-border hover:bg-secondary/40",
                  )}
                >
                  <r.icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <p className="mt-2 text-[0.8125rem] font-medium leading-tight">{r.label}</p>
                  <p className="mt-0.5 text-[0.6875rem] leading-tight text-muted-foreground">
                    {r.hint}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="full_name"
              name="full_name"
              autoComplete="name"
              required
              placeholder="Ada Lovelace"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="pl-10"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>

        <p className="text-center text-[0.6875rem] leading-relaxed text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link href="#" className="underline hover:text-foreground">Terms</Link> and{" "}
          <Link href="#" className="underline hover:text-foreground">Privacy Policy</Link>.
        </p>
      </form>

      <p className="mt-6 text-center text-[0.8125rem] text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
