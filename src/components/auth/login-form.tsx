"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { signIn, signInWithMagicLink } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

type Mode = "password" | "magic";

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const urlError = params.get("error");

  const [mode, setMode] = React.useState<Mode>("password");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(
    urlError ? decodeURIComponent(urlError) : null,
  );
  const [message, setMessage] = React.useState<string | null>(null);

  async function handlePassword(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signIn(undefined, formData);
    if (result?.error) setError(result.error);
    setPending(false);
  }

  async function handleMagicLink(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signInWithMagicLink(undefined, formData);
    if (result?.error) setError(result.error);
    if (result?.message) setMessage(result.message);
    setPending(false);
  }

  return (
    <div>
      <h1 className="font-display text-[1.875rem] leading-tight tracking-tight">
        Welcome back
      </h1>
      <p className="mt-2 text-[0.875rem] text-muted-foreground">
        Sign in to pick up where you left off.
      </p>

      <div className="mt-7">
        <OAuthButtons />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
          or
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
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
        {message && (
          <motion.div
            key="message"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-2.5 text-[0.8125rem] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mode === "password" ? (
        <form action={handlePassword} className="space-y-4">
          <input type="hidden" name="next" value={next} />
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => { setMode("magic"); setError(null); }}
                className="text-[0.75rem] text-muted-foreground hover:text-foreground"
              >
                Use a magic link
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="pl-10"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>
      ) : (
        <form action={handleMagicLink} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="magic-email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                id="magic-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@company.com"
                className="pl-10"
              />
            </div>
            <p className="text-[0.75rem] text-muted-foreground">
              We&apos;ll email you a one-time link. No password needed.
            </p>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Send magic link
          </Button>

          <button
            type="button"
            onClick={() => { setMode("password"); setMessage(null); }}
            className="w-full text-center text-[0.75rem] text-muted-foreground hover:text-foreground"
          >
            Use a password instead
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-[0.8125rem] text-muted-foreground">
        New to LearnSphere?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create an account
        </Link>
      </p>

      <div className="mt-8 rounded-lg border border-border/70 bg-secondary/40 px-3.5 py-3">
        <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
          Demo account
        </p>
        <p className="mt-1 font-mono text-[0.75rem] text-foreground/80">
          student@learnsphere.demo · DemoPass123!
        </p>
      </div>
    </div>
  );
}

export function LoginFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-11 w-full" />
      <div className="skeleton h-11 w-full" />
      <div className="skeleton h-12 w-full" />
    </div>
  );
}
