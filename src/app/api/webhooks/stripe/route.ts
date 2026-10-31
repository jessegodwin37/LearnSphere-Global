import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceSupabase } from "@/lib/supabase-server";

/**
 * Stripe webhook.
 *
 * Stripe is the source of truth for payment state; our database is a cache.
 * The handler is idempotent: `payments` has a unique (provider, provider_ref)
 * constraint, so a replayed event is a no-op rather than a double enrolment.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe is not configured on this deployment" },
      { status: 503 },
    );
  }

  const stripe = new Stripe(secret, { apiVersion: "2026-10-28.endive" as any });
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  // The raw body is required for signature verification — never parse first.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("stripe signature verification failed:", (err as Error).message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const userId = session.metadata?.user_id ?? session.client_reference_id;
        const courseId = session.metadata?.course_id;

        if (!userId || !courseId) {
          console.warn("stripe: session missing user_id/course_id metadata", session.id);
          break;
        }

        const amount = (session.amount_total ?? 0) / 100;

        // Idempotent insert — a replay hits the unique constraint and is ignored.
        const { error: payErr } = await supabase.from("payments").upsert(
          {
            user_id: userId,
            course_id: courseId,
            provider: "stripe",
            provider_ref: session.payment_intent?.toString() ?? session.id,
            amount,
            currency: (session.currency ?? "usd").toUpperCase(),
            status: "succeeded",
            raw_event: event as unknown as Record<string, unknown>,
          },
          { onConflict: "provider,provider_ref", ignoreDuplicates: true },
        );

        if (payErr) {
          console.error("stripe: payment insert failed", payErr.message);
          return NextResponse.json({ error: payErr.message }, { status: 500 });
        }

        // Grant access. Unique (user_id, course_id) makes this safe to repeat.
        const { error: enrErr } = await supabase.from("enrollments").upsert(
          { user_id: userId, course_id: courseId },
          { onConflict: "user_id,course_id", ignoreDuplicates: true },
        );

        if (enrErr) {
          console.error("stripe: enrollment failed", enrErr.message);
          return NextResponse.json({ error: enrErr.message }, { status: 500 });
        }

        // Bump the public student counter.
        await supabase.rpc("increment_student_count", { p_course_id: courseId }).then(
          () => {},
          () => {},
        );

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const ref = charge.payment_intent?.toString();

        if (ref) {
          await supabase
            .from("payments")
            .update({ status: "refunded" })
            .eq("provider", "stripe")
            .eq("provider_ref", ref);
        }
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
