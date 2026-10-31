import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CoursePlayer } from "@/components/course/course-player";
import { DEMO_COURSES, findDemoCourse } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Course player",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return DEMO_COURSES.flatMap((c) =>
    c.modules.flatMap((m) => m.lessons.map((l) => ({ courseId: c.slug, lessonId: l.id }))),
  );
}

export default function LearnPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const course = findDemoCourse(params.courseId);
  if (!course) notFound();

  const allLessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id })),
  );
  const lesson = allLessons.find((l) => l.id === params.lessonId);
  if (!lesson) notFound();

  return (
    <CoursePlayer
      course={course}
      lesson={lesson}
      allLessons={allLessons}
      modules={course.modules}
    />
  );
}
