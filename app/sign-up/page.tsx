"use client";

import { Suspense } from "react";
import SignUpForm from "@/components/signup/signup-form";

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
