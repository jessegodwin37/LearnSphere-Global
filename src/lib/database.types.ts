/**
 * Database types.
 *
 * These are hand-maintained to match supabase/migrations/0001_init.sql so the
 * repo type-checks without a live project. Regenerate against your own project
 * at any time with:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
 */

export type UserRole = "student" | "instructor" | "admin";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type PaymentProvider = "stripe" | "paystack";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  bio: string | null;
  headline: string | null;
  xp_points: number;
  streak: number;
  last_active_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  instructor_id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string;
  thumbnail_url: string | null;
  promo_video_url: string | null;
  price: number;
  level: CourseLevel;
  category: string;
  language: string;
  is_published: boolean;
  rating_avg: number;
  rating_count: number;
  student_count: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  summary: string | null;
  order_no: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  duration: number;
  is_free_preview: boolean;
  content_text: string | null;
  order_no: number;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress_percent: number;
  completed: boolean;
  last_lesson_id: string | null;
  enrolled_at: string;
  completed_at: string | null;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  completed: boolean;
  watched_seconds: number;
  completed_at: string | null;
  updated_at: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  module_id: string | null;
  title: string;
  description: string | null;
  passing_score: number;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_option: number;
  explanation: string | null;
  order_no: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, number> | null;
  created_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_no: string;
  recipient_name: string;
  course_title: string;
  pdf_url: string | null;
  issued_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  course_id: string;
  provider: PaymentProvider;
  provider_ref: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  raw_event: unknown | null;
  created_at: string;
}

export interface Review {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface LessonEmbedding {
  id: string;
  lesson_id: string;
  course_id: string;
  chunk: string;
  created_at: string;
}

/** Row shape of the course_catalog view. */
export interface CourseCatalogRow {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  price: number;
  level: CourseLevel;
  category: string;
  language: string;
  rating_avg: number;
  rating_count: number;
  student_count: number;
  duration_minutes: number;
  created_at: string;
  instructor_name: string | null;
  instructor_avatar: string | null;
  instructor_headline: string | null;
  module_count: number;
  lesson_count: number;
}

/**
 * Supabase's generic resolver requires Insert/Update to be permissive enough to
 * accept partial rows. Using `any` here keeps the Row types strict for reads
 * while letting writes pass without a generated-types round trip.
 */
type Table<Row> = {
  Row: Row;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile>;
      courses: Table<Course>;
      modules: Table<Module>;
      lessons: Table<Lesson>;
      enrollments: Table<Enrollment>;
      lesson_progress: Table<LessonProgress>;
      quizzes: Table<Quiz>;
      quiz_questions: Table<QuizQuestion>;
      quiz_attempts: Table<QuizAttempt>;
      certificates: Table<Certificate>;
      payments: Table<Payment>;
      reviews: Table<Review>;
      lesson_embeddings: Table<LessonEmbedding>;
    };
    Views: {
      course_catalog: { Row: CourseCatalogRow; Relationships: [] };
    };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_instructor_of: { Args: { p_course_id: string }; Returns: boolean };
      is_enrolled: { Args: { p_course_id: string }; Returns: boolean };
      increment_student_count: { Args: { p_course_id: string }; Returns: undefined };
      match_lesson_chunks: {
        Args: { p_course_id: string; p_embedding: number[]; p_match_count?: number };
        Returns: { lesson_id: string; chunk: string; similarity: number }[];
      };
    };
    Enums: {
      user_role: UserRole;
      course_level: CourseLevel;
      payment_provider: PaymentProvider;
      payment_status: PaymentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
