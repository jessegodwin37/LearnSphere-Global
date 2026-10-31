import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServiceSupabase } from "@/lib/supabase-server";

/**
 * Paystack webhook.
 *
 * Paystack signs the raw body with HMAC-SHA512 using your secret key and sends
 * the digest in `x-paystack-signature`. We verify before touching the database.
 *
 * Paystack retries failed deliveries, so the handler is idempotent via the
 * unique (provider, provider_ref) constraint on `payments`.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PaystackEvent {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number; // kobo / pesewas — smallest unit
    currency: string;
    status: string;
    customer?: { email?: string };
    metadata?: {
      user_id?: string;
      course_id?: string;
      custom_fields?: { variable_name: string; value: string }[];
    };
  };
}

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    return NextResponse.json(
      { error: "Paystack is not configured on this deployment" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing x-paystack-signature" }, { status: 400 });
  }

  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

  // Constant-time comparison to avoid a timing oracle.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    console.error("paystack: signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: PaystackEvent;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event !== "charge.success") {
    return NextResponse.json({ received: true, ignored: payload.event });
  }

  const { data } = payload;

  // Metadata can arrive either as a flat object or as custom_fields.
  const customFields = data.metadata?.custom_fields ?? [];
  const findField = (name: string) =>
    customFields.find((f) => f.variable_name === name)?.value;

  const userId = data.metadata?.user_id ?? findField("user_id");
  const courseId = data.metadata?.course_id ?? findField("course_id");

  if (!userId || !courseId) {
    console.warn("paystack: missing user_id/course_id metadata", data.reference);
    return NextResponse.json({ received: true, warning: "missing metadata" });
  }

  const supabase = createServiceSupabase();

  // Paystack amounts are in the smallest currency unit (kobo, pesewas, cents).
  const amount = data.amount / 100;

  const { error: payErr } = await supabase.from("payments").upsert(
    {
      user_id: userId,
      course_id: courseId,
      provider: "paystack",
      provider_ref: data.reference,
      amount,
      currency: data.currency.toUpperCase(),
      status: data.status === "success" ? "succeeded" : "failed",
      raw_event: payload as unknown as Record<string, unknown>,
    },
    { onConflict: "provider,provider_ref", ignoreDuplicates: true },
  );

  if (payErr) {
    console.error("paystack: payment insert failed", payErr.message);
    return NextResponse.json({ error: payErr.message }, { status: 500 });
  }

  if (data.status === "success") {
    const { error: enrErr } = await supabase.from("enrollments").upsert(
      { user_id: userId, course_id: courseId },
      { onConflict: "user_id,course_id", ignoreDuplicates: true },
    );

    if (enrErr) {
      console.error("paystack: enrollment failed", enrErr.message);
      return NextResponse.json({ error: enrErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
