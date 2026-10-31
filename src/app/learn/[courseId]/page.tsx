import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoursePlayer } from "@/components/course/course-player";
import { DEMO_COURSES, findDemoCourse } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Course player",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return DEMO_COURSES.map((c) => ({ courseId: c.slug }));
}

/** Entry point: opens the first lesson of the course. */
export default function LearnEntryPage({ params }: { params: { courseId: string } }) {
  const course = findDemoCourse(params.courseId);
  if (!course) notFound();

  const first = course.modules[0]?.lessons[0];
  if (!first) notFound();

  const allLessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id })),
  );

  return (
    <CoursePlayer
      course={course}
      lesson={allLessons[0]}
      allLessons={allLessons}
      modules={course.modules}
    />
  );
}
