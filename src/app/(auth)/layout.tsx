import Link from "next/link";
import { GraduationCap, Quote } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Form column */}
      <div className="relative flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-[1.05rem] w-[1.05rem]" />
            </span>
            <span className="font-display text-[1.0625rem] tracking-tight">
              LearnSphere<span className="ml-1 text-muted-foreground">Global</span>
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>

        <p className="text-center text-[0.6875rem] text-muted-foreground">
          © {new Date().getFullYear()} LearnSphere Global ·{" "}
          <Link href="#" className="hover:text-foreground">Privacy</Link> ·{" "}
          <Link href="#" className="hover:text-foreground">Terms</Link>
        </p>
      </div>

      {/* Editorial column */}
      <div className="relative hidden overflow-hidden border-l border-border/70 bg-secondary/30 lg:block">
        <div className="pointer-events-none absolute inset-0 gradient-wash" aria-hidden />
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" aria-hidden />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="max-w-md">
            <Quote className="h-7 w-7 text-primary/30" />
            <blockquote className="mt-5 font-display text-[1.75rem] leading-[1.28] tracking-tight text-foreground/90">
              The RLS section alone was worth the price. I had been shipping
              <span className="italic"> using</span>-only policies for a year without
              realising the hole.
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[0.6875rem] font-semibold text-primary">
                JA
              </span>
              <div>
                <p className="text-[0.8125rem] font-medium">Jesse Anomuoghar</p>
                <p className="text-[0.6875rem] text-muted-foreground">Founder & CEO</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 border-t border-border/70 pt-8">
            {[
              { v: "184K+", l: "Learners" },
              { v: "4.8/5", l: "Avg rating" },
              { v: "92%", l: "Finish rate" },
            ].map((s) => (
              <div key={s.l}>
                <p className="font-display text-xl font-semibold tracking-tight">{s.v}</p>
                <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
