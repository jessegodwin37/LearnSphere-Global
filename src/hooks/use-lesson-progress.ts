"use client";

import * as React from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

/**
 * Lesson progress + gamification state.
 *
 * Writes go to `lesson_progress` (one row per user/lesson). The database
 * trigger `recalc_enrollment_progress` then recomputes
 * `enrollments.progress_percent`, awards XP, and issues a certificate at 100%.
 * That means the client never has to compute progress itself — it only reports
 * what was watched.
 *
 * When Supabase is not configured the hook falls back to local state so the
 * demo deployment still behaves correctly.
 */
export function useLessonProgress({
  courseId,
  courseSlug,
  totalLessons,
  initialCompleted = [],
}: {
  courseId: string;
  courseSlug: string;
  totalLessons: number;
  initialCompleted?: string[];
}) {
  const [completedIds, setCompletedIds] = React.useState<string[]>(initialCompleted);
  const [hydrated, setHydrated] = React.useState(false);

  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ---- Hydrate from the database -----------------------------------------
  React.useEffect(() => {
    if (!configured) {
      setHydrated(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setHydrated(true);
        return;
      }

      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .eq("completed", true);

      if (!cancelled && data) {
        setCompletedIds(data.map((r) => r.lesson_id));
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [configured, courseId]);

  const progressPercent = React.useMemo(() => {
    if (totalLessons === 0) return 0;
    return Math.min(100, (completedIds.length / totalLessons) * 100);
  }, [completedIds.length, totalLessons]);

  const isComplete = React.useCallback(
    (lessonId: string) => completedIds.includes(lessonId),
    [completedIds],
  );

  /** Mark a lesson complete. Optimistic, then persisted. */
  const markComplete = React.useCallback(
    async (lessonId: string) => {
      setCompletedIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));

      if (!configured) return;

      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("lesson_progress").upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id" },
      );
    },
    [configured, courseId],
  );

  /** Save the watch position without marking complete (called every 10s). */
  const saveWatchPosition = React.useCallback(
    async (lessonId: string, seconds: number) => {
      if (!configured) return;

      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("lesson_progress").upsert(
        {
          user_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          watched_seconds: seconds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_id", ignoreDuplicates: false },
      );

      // Keep the enrollment's resume pointer fresh.
      await supabase
        .from("enrollments")
        .update({ last_lesson_id: lessonId })
        .eq("user_id", user.id)
        .eq("course_id", courseId);
    },
    [configured, courseId],
  );

  return {
    completedIds,
    progressPercent,
    hydrated,
    markComplete,
    saveWatchPosition,
    isComplete,
    certificateReady: progressPercent >= 100,
    courseSlug,
  };
}
