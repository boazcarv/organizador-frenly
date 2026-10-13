import { Suspense } from "react";
import { AuthFallback } from "@/components/auth/auth-fallback";
import type { Metadata } from "next";
import { SetupForm } from "@/components/auth/setup-form";

export const metadata: Metadata = {
  title: "Criar workspace",
  description: "Crie a primeira conta do seu workspace do Frenly.",
};

export default function SetupPage() {
  return (
    <Suspense fallback={<AuthFallback title="Criar o workspace" subtitle="Verificando o workspace…" />}>
      <SetupForm />
    </Suspense>
  );
}
