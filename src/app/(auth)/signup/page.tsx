import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create a free LearnSphere Global account. Start with a free preview lesson on any course — no card required.",
  robots: { index: true, follow: true },
};

export default function SignupPage() {
  return <SignupForm />;
}
