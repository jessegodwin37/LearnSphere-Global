"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Circle,
  PlayCircle,
  Award,
  Download,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Flame,
  Zap,
  ListVideo,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AiTutorChat } from "@/components/ai/ai-tutor-chat";
import { useLessonProgress } from "@/hooks/use-lesson-progress";
import { cn, formatClock } from "@/lib/utils";
import type { DemoCourse, DemoLesson, DemoModule } from "@/lib/demo-data";

type LessonWithModule = DemoLesson & { moduleTitle: string; moduleId: string };

export function CoursePlayer({
  course,
  lesson,
  allLessons,
  modules,
}: {
  course: DemoCourse;
  lesson: LessonWithModule;
  allLessons: LessonWithModule[];
  modules: DemoModule[];
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [tutorOpen, setTutorOpen] = React.useState(true);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [certLoading, setCertLoading] = React.useState(false);

  const {
    completedIds,
    progressPercent,
    markComplete,
    saveWatchPosition,
    isComplete,
    certificateReady,
  } = useLessonProgress({
    courseId: course.id,
    courseSlug: course.slug,
    totalLessons: allLessons.length,
    initialCompleted: ["l1-1", "l1-2"],
  });

  const index = allLessons.findIndex((l) => l.id === lesson.id);
  const prev = index > 0 ? allLessons[index - 1] : null;
  const next = index < allLessons.length - 1 ? allLessons[index + 1] : null;

  // ---- Progress save: every 10s while playing -----------------------------
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const interval = window.setInterval(() => {
      if (!video.paused && video.currentTime > 0) {
        saveWatchPosition(lesson.id, Math.floor(video.currentTime));
      }
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [lesson.id, saveWatchPosition]);

  // ---- Auto-complete at 95% watched --------------------------------------
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (video.duration > 0 && video.currentTime / video.duration >= 0.95) {
        if (!isComplete(lesson.id)) {
          markComplete(lesson.id);
          toast.success("Lesson complete", {
            description: "+50 XP · progress saved",
          });
        }
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [lesson.id, markComplete, isComplete]);

  async function downloadCertificate() {
    setCertLoading(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not generate certificate");
      window.open(data.url, "_blank", "noopener");
      toast.success("Certificate ready", { description: data.certificateNo });
    } catch (err) {
      toast.error("Certificate unavailable", {
        description: (err as Error).message,
      });
    } finally {
      setCertLoading(false);
    }
  }

  const lessonList = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/70 px-4 py-3.5">
        <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
          Course content
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Progress value={progressPercent} className="flex-1" />
          <span className="font-mono text-[0.6875rem] text-muted-foreground">
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {modules.map((mod) => (
          <div key={mod.id}>
            <div className="sticky top-0 z-10 border-b border-border/70 bg-card/95 px-4 py-2.5 backdrop-blur">
              <p className="text-[0.75rem] font-semibold">
                <span className="mr-1.5 font-mono text-[0.625rem] text-muted-foreground">
                  {String(mod.order_no).padStart(2, "0")}
                </span>
                {mod.title}
              </p>
            </div>
            <ul>
              {mod.lessons.map((l) => {
                const active = l.id === lesson.id;
                const done = completedIds.includes(l.id);
                return (
                  <li key={l.id}>
                    <Link
                      href={`/learn/${course.slug}/${l.id}`}
                      className={cn(
                        "flex items-start gap-2.5 border-b border-border/40 px-4 py-2.5 text-[0.75rem] transition-colors",
                        active
                          ? "bg-primary/[0.07] text-primary"
                          : "text-foreground/75 hover:bg-secondary/50",
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : active ? (
                        <PlayCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      ) : l.is_free_preview ? (
                        <PlayCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                      )}
                      <span className="min-w-0 flex-1 leading-snug">{l.title}</span>
                      <span className="shrink-0 font-mono text-[0.625rem] text-muted-foreground">
                        {Math.round(l.duration / 60)}m
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {certificateReady && (
        <div className="border-t border-border/70 bg-emerald-500/[0.06] p-4">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <p className="text-[0.75rem] font-semibold">Course complete</p>
          </div>
          <p className="mt-1 text-[0.6875rem] text-muted-foreground">
            Your certificate is ready to download.
          </p>
          <Button
            size="sm"
            className="mt-2.5 w-full"
            onClick={downloadCertificate}
            disabled={certLoading}
          >
            {certLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Download certificate
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <Button variant="ghost" size="icon-sm" asChild aria-label="Back to dashboard">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-medium">{course.title}</p>
            <p className="truncate text-[0.625rem] text-muted-foreground">
              {lesson.moduleTitle} · Lesson {index + 1} of {allLessons.length}
            </p>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" />
              {completedIds.length * 50} XP
            </span>
            <span className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-amber-600 dark:text-amber-400">
              <Flame className="h-3 w-3" />
              6d
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle course content"
          >
            <ListVideo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTutorOpen((v) => !v)}
            aria-label={tutorOpen ? "Hide AI tutor" : "Show AI tutor"}
            className="hidden xl:inline-flex"
          >
            {tutorOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Curriculum sidebar (desktop) */}
        <aside className="hidden w-[300px] shrink-0 border-r border-border/70 bg-card/40 lg:block">
          {lessonList}
        </aside>

        {/* Mobile curriculum drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              />
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="fixed inset-y-0 left-0 z-50 w-[300px] border-r border-border/70 bg-card lg:hidden"
              >
                {lessonList}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:py-7">
              {/* Video */}
              <div className="overflow-hidden rounded-xl border border-border/70 bg-black shadow-lift">
                <video
                  ref={videoRef}
                  key={lesson.id}
                  controls
                  playsInline
                  poster={course.thumbnail_url ?? undefined}
                  className="aspect-video w-full"
                  preload="metadata"
                >
                  <source src={lesson.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Lesson header */}
              <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="level">{lesson.moduleTitle}</Badge>
                    {lesson.is_free_preview && <Badge variant="success">Free preview</Badge>}
                    {isComplete(lesson.id) && (
                      <Badge variant="success">
                        <Check className="h-2.5 w-2.5" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <h1 className="mt-2 text-balance font-display text-xl font-semibold tracking-tight sm:text-2xl">
                    {lesson.title}
                  </h1>
                  <p className="mt-1 text-[0.75rem] text-muted-foreground">
                    {formatClock(lesson.duration)} · {course.instructor_name}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant={isComplete(lesson.id) ? "outline" : "default"}
                  onClick={() => {
                    if (!isComplete(lesson.id)) {
                      markComplete(lesson.id);
                      toast.success("Lesson complete", { description: "+50 XP" });
                    }
                  }}
                  disabled={isComplete(lesson.id)}
                >
                  <Check className="h-3.5 w-3.5" />
                  {isComplete(lesson.id) ? "Completed" : "Mark complete"}
                </Button>
              </div>

              {/* Lesson notes */}
              <div className="mt-6 rounded-xl border border-border/70 bg-card p-5 shadow-soft">
                <h2 className="font-display text-base font-semibold tracking-tight">
                  Lesson notes
                </h2>
                <div className="lesson-prose mt-3">
                  {lesson.content_text.split("\n\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>

              {/* Prev / next */}
              <div className="mt-6 flex items-center justify-between gap-3">
                {prev ? (
                  <Button variant="outline" asChild>
                    <Link href={`/learn/${course.slug}/${prev.id}`}>
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">{prev.title}</span>
                      <span className="sm:hidden">Previous</span>
                    </Link>
                  </Button>
                ) : (
                  <span />
                )}
                {next ? (
                  <Button asChild>
                    <Link href={`/learn/${course.slug}/${next.id}`}>
                      <span className="hidden sm:inline">{next.title}</span>
                      <span className="sm:hidden">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button onClick={downloadCertificate} disabled={certLoading}>
                    {certLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Award className="h-4 w-4" />
                    )}
                    Get certificate
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI tutor panel */}
        <AnimatePresence>
          {tutorOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="hidden shrink-0 overflow-hidden border-l border-border/70 bg-card/40 xl:block"
            >
              <div className="h-full w-[360px]">
                <AiTutorChat
                  courseId={course.id}
                  courseTitle={course.title}
                  lessonId={lesson.id}
                  lessonTitle={lesson.title}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile AI tutor FAB */}
      <div className="fixed bottom-5 right-5 z-30 xl:hidden">
        <Button
          size="lg"
          className="h-12 rounded-full px-5 shadow-lift"
          onClick={() => setTutorOpen(true)}
        >
          <Zap className="h-4 w-4" />
          Ask AI tutor
        </Button>
      </div>

      {/* Mobile tutor sheet */}
      <AnimatePresence>
        {tutorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 xl:hidden"
            onClick={() => setTutorOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-x-0 bottom-0 h-[78vh] overflow-hidden rounded-t-2xl border-t border-border bg-card"
            >
              <AiTutorChat
                courseId={course.id}
                courseTitle={course.title}
                lessonId={lesson.id}
                lessonTitle={lesson.title}
                onClose={() => setTutorOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
