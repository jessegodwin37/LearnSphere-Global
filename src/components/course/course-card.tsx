"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Users, Clock, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCount, formatDuration, formatPrice } from "@/lib/utils";
import type { CourseCatalogRow } from "@/lib/database.types";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function CourseCard({
  course,
  index = 0,
  className,
}: {
  course: CourseCatalogRow;
  index?: number;
  className?: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className={cn("group", className)}
    >
      <Link
        href={`/courses/${course.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-lift"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5">
              <PlayCircle className="h-10 w-10 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute left-3 top-3 flex gap-1.5">
            <Badge className="border-white/20 bg-black/55 text-white backdrop-blur-sm">
              {course.category}
            </Badge>
          </div>
          <div className="absolute bottom-3 right-3 translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[0.6875rem] font-semibold text-neutral-900 shadow-sm">
              <PlayCircle className="h-3.5 w-3.5" />
              Preview course
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="level">{LEVEL_LABEL[course.level] ?? course.level}</Badge>
            <span className="text-[0.6875rem] text-muted-foreground">{course.language}</span>
          </div>

          <h3 className="text-balance font-display text-[1.0625rem] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
            {course.title}
          </h3>

          {course.subtitle && (
            <p className="mt-1.5 line-clamp-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
              {course.subtitle}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {course.instructor_avatar && (
              <Image
                src={course.instructor_avatar}
                alt=""
                width={22}
                height={22}
                className="h-[22px] w-[22px] rounded-full object-cover ring-1 ring-border"
              />
            )}
            <span className="text-xs text-muted-foreground">{course.instructor_name}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">{course.rating_avg.toFixed(1)}</span>
              <span>({formatCount(course.rating_count)})</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {formatCount(course.student_count)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(course.duration_minutes)}
            </span>
          </div>

          <div className="mt-auto flex items-end justify-between pt-4">
            <div>
              <span className="font-display text-lg font-semibold tracking-tight text-foreground">
                {formatPrice(course.price)}
              </span>
              {course.price > 0 && (
                <span className="ml-2 text-xs text-muted-foreground line-through">
                  {formatPrice(Math.round(course.price * 2.4))}
                </span>
              )}
            </div>
            <span className="text-[0.6875rem] font-medium text-muted-foreground">
              {course.lesson_count} lessons
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
