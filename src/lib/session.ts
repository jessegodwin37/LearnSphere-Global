import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { DEMO_STUDENT } from "@/lib/demo-data";
import type { ShellUser } from "@/components/dashboard/app-shell";
import type { UserRole } from "@/lib/database.types";

/**
 * Resolves the current user for a dashboard route.
 *
 * When Supabase is not configured (fresh clone / demo deploy) this returns the
 * demo student so every screen renders. When it IS configured, an
 * unauthenticated visitor is redirected to /login by middleware, and this
 * function returns their real profile row.
 */
export async function getShellUser(): Promise<ShellUser> {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!configured) {
    return {
      id: DEMO_STUDENT.id,
      full_name: DEMO_STUDENT.full_name,
      avatar_url: DEMO_STUDENT.avatar_url,
      role: DEMO_STUDENT.role,
      xp_points: DEMO_STUDENT.xp_points,
      streak: DEMO_STUDENT.streak,
    };
  }

  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, xp_points, streak")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    full_name: profile?.full_name ?? user.email?.split("@")[0] ?? "Learner",
    avatar_url: profile?.avatar_url ?? null,
    role: (profile?.role as UserRole) ?? "student",
    xp_points: profile?.xp_points ?? 0,
    streak: profile?.streak ?? 0,
  };
}
