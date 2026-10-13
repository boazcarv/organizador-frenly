import { Suspense } from "react";
import { AuthFallback } from "@/components/auth/auth-fallback";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse o workspace do Frenly.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback title="Entrar no Frenly" subtitle="Carregando o Frenly…" />}>
      <LoginForm />
    </Suspense>
  );
}
