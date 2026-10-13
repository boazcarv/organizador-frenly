"use client";

import { useRouter } from "next/navigation";
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
const MIN_PASSWORD_LENGTH = 8;

/**
 * First run: creates the owner account.
 *
 * Whoever completes this becomes the owner, which is why the endpoint behind it
 * refuses to run once an account exists.
 */
export function SetupForm() {
  const router = useRouter();
  const client = useQueryClient();
  const { data: setup, isPending } = useSetupState();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (setup && !setup.needsSetup) router.replace("/login");
  }, [setup, router]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.setup({ name, email, password });
      // Drop the pre-login cache so the shell mounts against the new session.
      client.clear();
      router.replace("/dashboard");
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Não foi possível criar a conta");
      setBusy(false);
    }
  };

  if (isPending || (setup && !setup.needsSetup)) {
    return (
      <AuthShell title="Preparando" subtitle="Um instante…">
        <div className="flex h-24 items-center justify-center text-ink-faint">
          <Loader2 className="size-5 animate-spin" aria-hidden />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Criar o workspace"
      subtitle="Esta é a primeira execução, então ainda não existe ninguém para entrar. Esta conta será a do dono do workspace."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[12.5px] font-medium text-ink-soft">
            Seu nome
          </Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Como você quer aparecer"
            className={fieldClass}
          />
        </div>

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
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={`Pelo menos ${MIN_PASSWORD_LENGTH} caracteres`}
            className={fieldClass}
          />
          <p className="text-[11.5px] text-ink-faint">
            Guarde-a com um gerenciador de senhas: não há recuperação por e-mail configurada.
          </p>
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
          {busy ? "Criando…" : "Criar workspace"}
        </button>
      </form>
    </AuthShell>
  );
}
