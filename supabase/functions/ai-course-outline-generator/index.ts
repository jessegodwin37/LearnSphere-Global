// ============================================================================
// ai-course-outline-generator — drafts a full course outline for instructors
// POST { topic, level, audience?, durationHours?, category? }
// Returns a structured outline the instructor can edit before saving.
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

type Lesson = { title: string; duration_minutes: number; is_free_preview: boolean; summary: string };
type Module = { title: string; summary: string; lessons: Lesson[] };
type Outline = {
  title: string;
  subtitle: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  category: string;
  price_suggestion: number;
  learning_outcomes: string[];
  modules: Module[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Not authenticated" }, 401);

    // Only instructors and admins may generate outlines
    const { data: profile } = await userClient
      .from("profiles").select("role").eq("id", userData.user.id).single();
    if (!profile || (profile.role !== "instructor" && profile.role !== "admin")) {
      return json({ error: "Instructor role required" }, 403);
    }

    const body = await req.json();
    const topic: string = (body.topic ?? "").toString().trim();
    const level: string = body.level ?? "intermediate";
    const audience: string = body.audience ?? "working professionals";
    const durationHours: number = Number(body.durationHours ?? 8);
    const category: string = body.category ?? "Web Development";

    if (!topic) return json({ error: "topic is required" }, 400);
    if (topic.length > 300) return json({ error: "topic too long" }, 400);

    const moduleCount = Math.max(3, Math.min(8, Math.round(durationHours / 1.5)));
    const lessonsPerModule = 4;

    const systemPrompt = `You are a senior curriculum designer for LearnSphere Global, a premium online learning platform.

Design a course outline that a working professional would pay for. Rules:
- Every lesson title must name a concrete skill or artifact, not a vague theme. "Build an idempotent webhook handler" beats "Webhooks".
- The course must build something real by the end. State what in the description.
- No filler modules ("Introduction", "Conclusion", "Resources"). The first module must already teach something.
- Durations must be realistic: 6-25 minutes per lesson.
- Exactly one lesson per module is a free preview, and it must be the most compelling one.
- The description is 2-3 paragraphs of real prose, no marketing clichés, no "in today's fast-paced world".
- learning_outcomes are 4-6 specific, testable statements.

Return ONLY valid JSON matching this TypeScript type, no markdown fences:
{
  "title": string,
  "subtitle": string,          // one line, max 90 chars
  "description": string,       // 2-3 paragraphs separated by \\n\\n
  "level": "beginner" | "intermediate" | "advanced",
  "category": string,
  "price_suggestion": number,  // USD, realistic for the depth
  "learning_outcomes": string[],
  "modules": [
    { "title": string, "summary": string, "lessons": [
      { "title": string, "duration_minutes": number, "is_free_preview": boolean, "summary": string }
    ]}
  ]
}`;

    const userPrompt = `Topic: ${topic}
Level: ${level}
Target audience: ${audience}
Total video length: about ${durationHours} hours
Category: ${category}
Structure: ${moduleCount} modules, ${lessonsPerModule} lessons each.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      console.error(await res.text());
      return json({ error: "AI provider error" }, 502);
    }

    const completion = await res.json();
    const raw = completion.choices?.[0]?.message?.content ?? "{}";

    let outline: Outline;
    try {
      outline = JSON.parse(raw);
    } catch {
      return json({ error: "Model returned invalid JSON" }, 502);
    }

    // Normalise: clamp durations, guarantee exactly one free preview per module
    outline.modules = (outline.modules ?? []).map((m) => {
      const lessons = (m.lessons ?? []).map((l) => ({
        ...l,
        duration_minutes: Math.max(4, Math.min(30, Math.round(l.duration_minutes || 10))),
        is_free_preview: false,
      }));
      if (lessons.length > 0) lessons[0].is_free_preview = true;
      return { ...m, lessons };
    });

    const totalMinutes = outline.modules.reduce(
      (sum, m) => sum + m.lessons.reduce((s, l) => s + l.duration_minutes, 0), 0,
    );

    return json({
      outline,
      meta: {
        module_count: outline.modules.length,
        lesson_count: outline.modules.reduce((s, m) => s + m.lessons.length, 0),
        total_minutes: totalMinutes,
        generated_at: new Date().toISOString(),
      },
    });
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
