import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm, LoginFormSkeleton } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to LearnSphere Global to continue your courses.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
