import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { CourseCard } from "@/components/course/course-card";
import { Button } from "@/components/ui/button";
import { DEMO_COURSES } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "All courses",
  description:
    "Browse every LearnSphere Global course in engineering, data and design. Each one ends with a working artifact you built yourself.",
  alternates: { canonical: "/courses" },
};

const CATEGORIES = ["All", "Web Development", "Data Science", "Design"];

export default function CoursesPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const active = searchParams.category ?? "All";
  const courses =
    active === "All"
      ? DEMO_COURSES
      : DEMO_COURSES.filter((c) => c.category === active);

  return (
    <>
      <SiteHeader />
      <main className="container py-14 lg:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Catalogue</p>
          <h1 className="mt-3 text-balance font-display text-display-lg text-gradient">
            Every course, in full
          </h1>
          <p className="mt-4 text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">
            We publish slowly. Each course is written by a practitioner, reviewed by a
            second one, and rebuilt when the tooling changes underneath it.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = active === cat;
            return (
              <Button
                key={cat}
                asChild
                size="sm"
                variant={isActive ? "default" : "outline"}
                className="rounded-full"
              >
                <Link href={cat === "All" ? "/courses" : `/courses?category=${encodeURIComponent(cat)}`}>
                  {cat}
                </Link>
              </Button>
            );
          })}
          <span className="ml-auto text-[0.75rem] text-muted-foreground">
            {courses.length} {courses.length === 1 ? "course" : "courses"}
          </span>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>

        {courses.length === 0 && (
          <div className="mt-16 rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="text-sm text-muted-foreground">
              No courses in this category yet.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/courses">See all courses</Link>
            </Button>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
