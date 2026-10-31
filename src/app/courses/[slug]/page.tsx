import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Star,
  Users,
  Clock,
  Globe,
  PlayCircle,
  Check,
  Lock,
  ChevronDown,
  Award,
  Infinity as InfinityIcon,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/course/course-card";
import { DEMO_COURSES, findDemoCourse } from "@/lib/demo-data";
import { formatCount, formatDuration, formatPrice, relativeTime } from "@/lib/utils";

export function generateStaticParams() {
  return DEMO_COURSES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const course = findDemoCourse(params.slug);
  if (!course) return { title: "Course not found" };

  return {
    title: course.title,
    description: course.subtitle ?? course.description.slice(0, 155),
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: {
      title: course.title,
      description: course.subtitle ?? undefined,
      images: course.thumbnail_url ? [{ url: course.thumbnail_url }] : undefined,
      type: "article",
    },
  };
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = findDemoCourse(params.slug);
  if (!course) notFound();

  const totalLessons = course.modules.reduce((n, m) => n + m.lessons.length, 0);
  const related = DEMO_COURSES.filter((c) => c.id !== course.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: "LearnSphere Global",
      sameAs: "https://learnsphere.global",
    },
    offers: {
      "@type": "Offer",
      price: course.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: course.rating_avg,
      reviewCount: course.rating_count,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <main>
        {/* ------------------------------------------------------------- HERO */}
        <section className="relative overflow-hidden border-b border-border/70 bg-secondary/25">
          <div className="pointer-events-none absolute inset-0 gradient-wash" aria-hidden />
          <div className="container relative py-12 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <nav className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground">
                  <Link href="/courses" className="hover:text-foreground">Courses</Link>
                  <span>/</span>
                  <Link
                    href={`/courses?category=${encodeURIComponent(course.category)}`}
                    className="hover:text-foreground"
                  >
                    {course.category}
                  </Link>
                </nav>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="level">{LEVEL_LABEL[course.level]}</Badge>
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge variant="success">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Bestseller
                  </Badge>
                </div>

                <h1 className="mt-4 text-balance font-display text-display-lg text-gradient">
                  {course.title}
                </h1>
                {course.subtitle && (
                  <p className="mt-3 max-w-2xl text-pretty text-[1.0625rem] leading-relaxed text-muted-foreground">
                    {course.subtitle}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-foreground">
                      {course.rating_avg.toFixed(1)}
                    </span>
                    <span>({formatCount(course.rating_count)} ratings)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {formatCount(course.student_count)} students
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(course.duration_minutes)} of video
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    {course.language}
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  {course.instructor_avatar && (
                    <Image
                      src={course.instructor_avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
                    />
                  )}
                  <div>
                    <p className="text-[0.8125rem] font-medium">{course.instructor_name}</p>
                    <p className="text-[0.6875rem] text-muted-foreground">
                      {course.instructor_headline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Purchase card */}
              <aside className="lg:-mb-24">
                <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lift">
                  <div className="relative aspect-video bg-muted">
                    {course.thumbnail_url && (
                      <Image
                        src={course.thumbnail_url}
                        alt=""
                        fill
                        sizes="360px"
                        className="object-cover"
                        priority
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform hover:scale-105">
                        <PlayCircle className="h-7 w-7 text-neutral-900" />
                      </span>
                    </div>
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[0.6875rem] font-medium text-white backdrop-blur">
                      Free preview available
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-3xl font-semibold tracking-tight">
                        {formatPrice(course.price)}
                      </span>
                      {course.price > 0 && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(Math.round(course.price * 2.4))}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[0.6875rem] font-medium text-rose-500">
                      One-time payment · lifetime access
                    </p>

                    <div className="mt-4 space-y-2">
                      <Button size="lg" className="w-full" asChild>
                        <Link href={`/learn/${course.slug}`}>Enrol now</Link>
                      </Button>
                      <Button size="lg" variant="outline" className="w-full" asChild>
                        <Link href={`/learn/${course.slug}?preview=1`}>
                          <PlayCircle className="h-4 w-4" />
                          Watch free preview
                        </Link>
                      </Button>
                    </div>

                    <ul className="mt-5 space-y-2.5 border-t border-border/70 pt-4">
                      {[
                        { icon: Clock, text: `${formatDuration(course.duration_minutes)} of on-demand video` },
                        { icon: PlayCircle, text: `${totalLessons} lessons across ${course.modules.length} modules` },
                        { icon: InfinityIcon, text: "Full lifetime access" },
                        { icon: Smartphone, text: "Watch on desktop, tablet or mobile" },
                        { icon: Award, text: "Verifiable certificate of completion" },
                        { icon: ShieldCheck, text: "30-day money-back guarantee" },
                      ].map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-start gap-2.5 text-[0.8125rem] text-foreground/80">
                          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ BODY */}
        <section className="container py-14 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              {/* Outcomes */}
              <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  What you&apos;ll be able to do
                </h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {course.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-2.5 text-[0.875rem] leading-relaxed text-foreground/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Description */}
              <div className="mt-10">
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  About this course
                </h2>
                <div className="lesson-prose mt-4">
                  {course.description.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              {/* Curriculum */}
              <div className="mt-12">
                <div className="flex items-end justify-between">
                  <h2 className="font-display text-xl font-semibold tracking-tight">
                    Curriculum
                  </h2>
                  <p className="text-[0.75rem] text-muted-foreground">
                    {course.modules.length} modules · {totalLessons} lessons ·{" "}
                    {formatDuration(course.duration_minutes)}
                  </p>
                </div>

                <div className="mt-5 divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card">
                  {course.modules.map((mod, mi) => {
                    const modMinutes = Math.round(
                      mod.lessons.reduce((s, l) => s + l.duration, 0) / 60,
                    );
                    return (
                      <details key={mod.id} open={mi === 0} className="group">
                        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/40">
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[0.875rem] font-medium">
                              <span className="mr-2 font-mono text-[0.6875rem] text-muted-foreground">
                                {String(mod.order_no).padStart(2, "0")}
                              </span>
                              {mod.title}
                            </p>
                            <p className="mt-0.5 line-clamp-1 text-[0.75rem] text-muted-foreground">
                              {mod.summary}
                            </p>
                          </div>
                          <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
                            {mod.lessons.length} lessons · {modMinutes}m
                          </span>
                        </summary>

                        <ul className="border-t border-border/70 bg-secondary/20">
                          {mod.lessons.map((lesson) => (
                            <li
                              key={lesson.id}
                              className="flex items-center gap-3 px-5 py-2.5 pl-12 text-[0.8125rem]"
                            >
                              {lesson.is_free_preview ? (
                                <PlayCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                              )}
                              <span className="min-w-0 flex-1 truncate text-foreground/80">
                                {lesson.title}
                              </span>
                              {lesson.is_free_preview && (
                                <Badge variant="default" className="shrink-0 text-[0.625rem]">
                                  Preview
                                </Badge>
                              )}
                              <span className="shrink-0 font-mono text-[0.6875rem] text-muted-foreground">
                                {Math.round(lesson.duration / 60)}m
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    );
                  })}
                </div>
              </div>

              {/* Instructor */}
              <div className="mt-12">
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Your instructor
                </h2>
                <div className="mt-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
                  <div className="flex items-start gap-4">
                    {course.instructor_avatar && (
                      <Image
                        src={course.instructor_avatar}
                        alt={course.instructor_name ?? ""}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-full object-cover ring-1 ring-border"
                      />
                    )}
                    <div>
                      <p className="font-display text-lg font-semibold tracking-tight">
                        {course.instructor_name}
                      </p>
                      <p className="text-[0.8125rem] text-muted-foreground">
                        {course.instructor_headline}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {course.rating_avg.toFixed(1)} instructor rating
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatCount(course.student_count)} students
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews */}
              <div className="mt-12">
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Student reviews
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {course.reviews.map((r) => (
                    <div
                      key={r.name + r.date}
                      className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[0.625rem] font-semibold text-primary">
                          {r.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </span>
                        <div>
                          <p className="text-[0.8125rem] font-medium">{r.name}</p>
                          <p className="text-[0.625rem] text-muted-foreground">
                            {relativeTime(r.date)}
                          </p>
                        </div>
                        <div className="ml-auto flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={
                                i < r.rating
                                  ? "h-3 w-3 fill-amber-400 text-amber-400"
                                  : "h-3 w-3 text-border"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-[0.8125rem] leading-relaxed text-foreground/80">
                        {r.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky sidebar spacer on desktop */}
            <div className="hidden lg:block" />
          </div>
        </section>

        {/* ----------------------------------------------------------- RELATED */}
        <section className="border-t border-border/70 bg-secondary/25">
          <div className="container py-16">
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Students also take
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {related.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
