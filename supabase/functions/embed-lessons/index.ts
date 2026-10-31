// ============================================================================
// embed-lessons — chunks lesson content and stores pgvector embeddings
// Invoke after publishing a course, or on a schedule.
// POST { courseId }  — service-role or instructor of the course only.
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CHUNK_CHARS = 1200;
const OVERLAP_CHARS = 200;

function chunk(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= CHUNK_CHARS) return clean ? [clean] : [];
  const out: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + CHUNK_CHARS, clean.length);
    if (end < clean.length) {
      const lastStop = Math.max(
        clean.lastIndexOf(". ", end),
        clean.lastIndexOf("? ", end),
        clean.lastIndexOf("! ", end),
      );
      if (lastStop > start + CHUNK_CHARS * 0.5) end = lastStop + 1;
    }
    out.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = end - OVERLAP_CHARS;
  }
  return out.filter((c) => c.length > 40);
}

async function embedBatch(inputs: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: inputs }),
  });
  if (!res.ok) throw new Error(`embedding failed: ${await res.text()}`);
  const json = await res.json();
  return json.data.map((d: { embedding: number[] }) => d.embedding);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "Not authenticated" }, 401);

    const { courseId } = await req.json();
    if (!courseId) return json({ error: "courseId is required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Authorise: instructor of the course, or admin
    const { data: course } = await admin
      .from("courses").select("id, instructor_id").eq("id", courseId).single();
    if (!course) return json({ error: "Course not found" }, 404);

    const { data: profile } = await admin
      .from("profiles").select("role").eq("id", userData.user.id).single();
    const allowed = course.instructor_id === userData.user.id || profile?.role === "admin";
    if (!allowed) return json({ error: "Not authorised for this course" }, 403);

    // Load lessons with content
    const { data: lessons, error: lErr } = await admin
      .from("lessons")
      .select("id, title, content_text, modules!inner(course_id)")
      .eq("modules.course_id", courseId)
      .not("content_text", "is", null);
    if (lErr) return json({ error: lErr.message }, 500);

    // Clear previous embeddings for this course (idempotent re-index)
    await admin.from("lesson_embeddings").delete().eq("course_id", courseId);

    let inserted = 0;
    for (const lesson of lessons ?? []) {
      const pieces = chunk(`${lesson.title}. ${lesson.content_text}`);
      if (pieces.length === 0) continue;

      // Batch in groups of 16 to stay well inside rate limits
      for (let i = 0; i < pieces.length; i += 16) {
        const batch = pieces.slice(i, i + 16);
        const vectors = await embedBatch(batch);
        const rows = batch.map((text, idx) => ({
          lesson_id: lesson.id,
          course_id: courseId,
          chunk: text,
          embedding: vectors[idx],
        }));
        const { error } = await admin.from("lesson_embeddings").insert(rows);
        if (error) return json({ error: error.message }, 500);
        inserted += rows.length;
      }
    }

    return json({ ok: true, courseId, lessons: lessons?.length ?? 0, chunks: inserted });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
