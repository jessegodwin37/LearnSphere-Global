// ============================================================================
// generate-certificate — renders a PDF certificate, uploads it, returns a URL
// POST { certificateId }  (or { courseId } to look it up for the caller)
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    const userId = userData.user.id;

    const { certificateId, courseId } = await req.json();
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // ---- 1. Load the certificate (must belong to the caller) ----------------
    let query = admin.from("certificates").select("*").eq("user_id", userId);
    query = certificateId ? query.eq("id", certificateId) : query.eq("course_id", courseId);
    const { data: cert, error: certErr } = await query.maybeSingle();

    if (certErr) return json({ error: certErr.message }, 500);
    if (!cert) return json({ error: "Certificate not found for this user" }, 404);

    // Already rendered? Return the existing asset.
    if (cert.pdf_url) return json({ url: cert.pdf_url, certificateNo: cert.certificate_no });

    // ---- 2. Verify the enrollment is genuinely complete --------------------
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("progress_percent, completed")
      .eq("user_id", userId)
      .eq("course_id", cert.course_id)
      .maybeSingle();

    if (!enrollment || enrollment.progress_percent < 100) {
      return json({ error: "Course not completed yet" }, 403);
    }

    // ---- 3. Render the PDF ------------------------------------------------
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();

    const serif = await pdf.embedFont(StandardFonts.TimesRoman);
    const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
    const sans = await pdf.embedFont(StandardFonts.Helvetica);

    const ink = rgb(0.09, 0.09, 0.11);
    const muted = rgb(0.42, 0.44, 0.5);
    const accent = rgb(0.35, 0.28, 0.85);

    // Background wash
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.99, 0.99, 1) });

    // Border frame
    page.drawRectangle({
      x: 28, y: 28, width: width - 56, height: height - 56,
      borderColor: rgb(0.88, 0.88, 0.93), borderWidth: 1,
    });
    page.drawRectangle({
      x: 36, y: 36, width: width - 72, height: height - 72,
      borderColor: accent, borderWidth: 0.6, opacity: 0.35,
    });

    const center = (text: string, font: typeof serif, size: number, y: number, color = ink) => {
      const w = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: (width - w) / 2, y, size, font, color });
    };

    center("LEARNSPHERE GLOBAL", sans, 11, height - 92, accent);
    center("CERTIFICATE OF COMPLETION", serifBold, 30, height - 150, ink);

    page.drawLine({
      start: { x: width / 2 - 60, y: height - 172 },
      end: { x: width / 2 + 60, y: height - 172 },
      thickness: 1.2, color: accent,
    });

    center("This certifies that", sans, 11, height - 214, muted);
    center(cert.recipient_name, serifBold, 34, height - 262, ink);
    center("has successfully completed the course", sans, 11, height - 292, muted);

    // Wrap the course title if long
    const titleSize = 20;
    const maxW = width - 200;
    const words = cert.course_title.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (serif.widthOfTextAtSize(test, titleSize) > maxW && line) {
        lines.push(line); line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => center(l, serif, titleSize, height - 330 - i * 26, ink));

    // Footer: certificate number + issue date
    const issued = new Date(cert.issued_at).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    page.drawText(`Certificate No. ${cert.certificate_no}`, {
      x: 72, y: 78, size: 9, font: sans, color: muted,
    });
    page.drawText(`Issued ${issued}`, { x: 72, y: 64, size: 9, font: sans, color: muted });

    const verifyW = sans.widthOfTextAtSize("Verify at learnsphere.global/verify", 9);
    page.drawText("Verify at learnsphere.global/verify", {
      x: width - 72 - verifyW, y: 78, size: 9, font: sans, color: muted,
    });

    // Signature line
    page.drawLine({
      start: { x: width - 260, y: 120 }, end: { x: width - 90, y: 120 },
      thickness: 0.8, color: rgb(0.75, 0.75, 0.8),
    });
    page.drawText("LearnSphere Academic Office", {
      x: width - 250, y: 104, size: 9, font: sans, color: muted,
    });

    const bytes = await pdf.save();

    // ---- 4. Upload to the certificates bucket ------------------------------
    const path = `${userId}/${cert.certificate_no}.pdf`;
    const { error: upErr } = await admin.storage
      .from("certificates")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });

    if (upErr) return json({ error: `upload failed: ${upErr.message}` }, 500);

    const { data: pub } = admin.storage.from("certificates").getPublicUrl(path);
    const url = pub.publicUrl;

    // ---- 5. Persist the URL ------------------------------------------------
    await admin.from("certificates").update({ pdf_url: url }).eq("id", cert.id);

    return json({ url, certificateNo: cert.certificate_no });
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
