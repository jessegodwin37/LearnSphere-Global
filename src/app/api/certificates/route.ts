import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * Certificate download.
 *
 * Verifies the caller owns a completed enrollment, then invokes the
 * `generate-certificate` Edge Function which renders the PDF, uploads it to the
 * `certificates` bucket and returns a public URL.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { courseId } = await request.json();
  if (!courseId) {
    return NextResponse.json({ error: "courseId is required" }, { status: 400 });
  }

  // Gate on real progress, not on a client claim.
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("progress_percent, completed")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!enrollment || enrollment.progress_percent < 100) {
    return NextResponse.json(
      { error: "Finish the course to unlock your certificate" },
      { status: 403 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${supabaseUrl}/functions/v1/generate-certificate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${session?.access_token ?? anonKey}`,
    },
    body: JSON.stringify({ courseId }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data.error ?? "Certificate generation failed" },
      { status: res.status },
    );
  }

  return NextResponse.json({ url: data.url, certificateNo: data.certificateNo });
}
