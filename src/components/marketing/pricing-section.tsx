"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    blurb: "Enough to know whether this is for you.",
    features: [
      "Free preview lesson on every course",
      "Full course catalogue access",
      "Community Q&A",
      "Progress tracking on free lessons",
    ],
    cta: "Start free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    blurb: "Everything, including the AI tutor.",
    features: [
      "All courses, unlimited",
      "AI tutor grounded in every lesson",
      "Verifiable certificates",
      "Downloadable lesson resources",
      "Offline-friendly lesson notes",
      "Priority Q&A from instructors",
    ],
    cta: "Go Pro",
    href: "/signup?plan=pro",
    highlight: true,
  },
  {
    name: "Teams",
    price: "$24",
    period: "per seat / month",
    blurb: "For engineering and data teams of 5+.",
    features: [
      "Everything in Pro",
      "Admin dashboard with seat management",
      "Team progress and completion reporting",
      "Private cohort channels",
      "Invoice billing",
      "SSO on annual plans",
    ],
    cta: "Talk to us",
    href: "/signup?plan=teams",
    highlight: false,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = React.useState(false);

  return (
    <section id="pricing" className="container py-20 lg:py-28">
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Pricing</p>
          <h2 className="mt-3 text-balance font-display text-display-md text-gradient">
            One price. Every course.
          </h2>
          <p className="mt-4 text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">
            No per-course upsells, no expiring access. Cancel whenever — your certificates
            stay yours.
          </p>

          <div className="mt-7 inline-flex items-center gap-1 rounded-full border border-border/80 bg-secondary/50 p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[0.75rem] font-medium transition-colors",
                !annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[0.75rem] font-medium transition-colors",
                annual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              Annual
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[0.625rem] font-semibold text-emerald-600 dark:text-emerald-400">
                −20%
              </span>
            </button>
          </div>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan, i) => {
          const monthly = Number(plan.price.replace("$", ""));
          const shown =
            annual && monthly > 0 ? `$${Math.round(monthly * 0.8)}` : plan.price;

          return (
            <Reveal key={plan.name} delay={i * 0.07}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-7 transition-all duration-300",
                  plan.highlight
                    ? "border-primary/30 bg-card shadow-glow"
                    : "border-border/70 bg-card shadow-soft hover:shadow-lift",
                )}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-2.5 left-7">
                    <Sparkles className="h-3 w-3" />
                    Most popular
                  </Badge>
                )}

                <h3 className="font-display text-lg font-semibold tracking-tight">{plan.name}</h3>
                <p className="mt-1 text-[0.8125rem] text-muted-foreground">{plan.blurb}</p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-semibold tracking-tight">
                    {shown}
                  </span>
                  <span className="text-[0.75rem] text-muted-foreground">
                    {annual && monthly > 0 ? "per month, billed yearly" : plan.period}
                  </span>
                </div>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[0.8125rem] text-foreground/80">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={plan.highlight ? "default" : "outline"}
                  className="mt-7 w-full"
                  size="lg"
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            </Reveal>
          );
        })}
      </div>

      <p className="mt-8 text-center text-[0.75rem] text-muted-foreground">
        Prices in USD. Pay with card via Stripe, or with Paystack in NGN, GHS, ZAR and KES.
      </p>
    </section>
  );
}
