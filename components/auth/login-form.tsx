"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { useSetupState } from "@/lib/queries";
import { cn } from "@/lib/utils";

const fieldClass = "h-10 rounded-[12px] border-line text-[13px]";

export function LoginForm() {
  const router = useRouter();
  const client = useQueryClient();
  const params = useSearchParams();
  const { data: setup, isPending: checkingSetup } = useSetupState();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // A brand-new workspace has nobody to log in as: send them to first-run setup.
  useEffect(() => {
    if (setup?.needsSetup) router.replace("/setup");
  }, [setup?.needsSetup, router]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.login({ email, password });
      // Whatever the browser cached while signed out belongs to no session.
      client.clear();
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Não foi possível entrar agora");
      setBusy(false);
    }
  };

  if (checkingSetup || setup?.needsSetup) {
    return (
      <AuthShell title="Entrando" subtitle="Verificando o estado do workspace…">
        <div className="flex h-24 items-center justify-center text-ink-faint">
          <Loader2 className="size-5 animate-spin" aria-hidden />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Entrar no Frenly"
      subtitle="Use a conta que você criou na primeira execução. As sessões valem por 30 dias."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[12.5px] font-medium text-ink-soft">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="voce@empresa.com"
            className={fieldClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[12.5px] font-medium text-ink-soft">
            Senha
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className={fieldClass}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-[12px] bg-danger-soft px-3 py-2 text-[12.5px] font-medium text-danger"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className={cn(
            "inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-[13.5px] font-semibold text-white",
            "transition-colors duration-200 hover:bg-[var(--accent-strong)] disabled:opacity-60",
          )}
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </AuthShell>
  );
}
