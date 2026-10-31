"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";

export type AuthState = { error?: string; message?: string } | undefined;

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

function field(formData: FormData, key: string): string {
  return (formData.get(key) ?? "").toString().trim();
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email");
  const password = field(formData, "password");
  const next = field(formData, "next") || "/dashboard";

  if (!email || !password) return { error: "Email and password are required." };

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email");
  const password = field(formData, "password");
  const fullName = field(formData, "full_name");
  const role = field(formData, "role") === "instructor" ? "instructor" : "student";

  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) return { error: error.message };

  // Email confirmation enabled -> no session yet.
  if (data.user && !data.session) {
    return {
      message: `We sent a confirmation link to ${email}. Open it to finish setting up your account.`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInWithMagicLink(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = field(formData, "email");
  if (!email) return { error: "Enter your email address." };

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=/dashboard` },
  });

  if (error) return { error: error.message };
  return { message: `Check your inbox — we sent a sign-in link to ${email}.` };
}

export async function signInWithOAuth(formData: FormData): Promise<void> {
  const provider = field(formData, "provider");
  const safeProvider = provider === "github" ? "github" : "google";

  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: safeProvider,
    options: { redirectTo: `${siteUrl()}/auth/callback?next=/dashboard` },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`);
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
