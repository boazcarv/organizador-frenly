"use client";

import { useState } from "react";
import { Crown, KeyRound, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { useAccounts, useCreateAccount, useDeleteAccount, useProfile, useUpdateAccount } from "@/lib/queries";
import type { Account } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Who can sign in.
 *
 * There is no public sign-up: the owner creates the login and hands over the
 * password. That is the right shape for a two-person workspace — one fewer
 * surface to defend, and no e-mail delivery to configure before the second
 * person can get in.
 */
export function AccountsPanel() {
  const { data: accounts, isPending } = useAccounts();
  // The profile endpoint answers "who am I?" from the session cookie, which is
  // what decides which row gets the "você" badge.
  const { data: profile } = useProfile();
  const currentId = profile?.id;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [passwordFor, setPasswordFor] = useState<Account | null>(null);

  if (isPending || !accounts) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-[72px] rounded-[14px]" />
        ))}
      </div>
    );
  }

  const me = accounts.find((account) => account.id === currentId);
  const isOwner = me?.isOwner ?? accounts.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-ink-soft">
          {accounts.length === 1
            ? "Você é a única pessoa com acesso."
            : `${accounts.length} pessoas com acesso ao workspace.`}
        </p>
        {isOwner ? (
          <Button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="h-9 shrink-0 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--accent-strong)]"
          >
            <UserPlus className="size-4" aria-hidden />
            Adicionar pessoa
          </Button>
        ) : null}
      </div>

      <ul className="divide-y divide-line-soft rounded-[14px] border border-line">
        {accounts.map((account) => (
          <AccountRow
            key={account.id}
            account={account}
            isSelf={account.id === currentId}
            canManage={isOwner || account.id === currentId}
            onChangePassword={() => setPasswordFor(account)}
          />
        ))}
      </ul>

      {isOwner ? (
        <p className="text-[11.5px] leading-relaxed text-ink-faint">
          Crie a conta da outra pessoa aqui e entregue a senha por um canal privado. Ela pode
          trocá-la depois em Perfil.
        </p>
      ) : null}

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <PasswordDialog
        account={passwordFor}
        isSelf={passwordFor?.id === currentId}
        onClose={() => setPasswordFor(null)}
      />
    </div>
  );
}

function AccountRow({
  account,
  isSelf,
  canManage,
  onChangePassword,
}: {
  account: Account;
  isSelf: boolean;
  canManage: boolean;
  onChangePassword: () => void;
}) {
  const removeAccount = useDeleteAccount();

  return (
    <li className="flex items-center gap-3 p-3.5">
      <InitialsAvatar name={account.name} color={account.color} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13.5px] font-semibold text-ink">{account.name}</p>
          {account.isOwner ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-tint px-2 py-0.5 text-[10.5px] font-medium text-accent">
              <Crown className="size-3" aria-hidden />
              Dono
            </span>
          ) : null}
          {isSelf ? (
            <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10.5px] text-ink-faint">
              você
            </span>
          ) : null}
        </div>
        <p className="truncate text-[11.5px] text-ink-faint">
          {account.email}
          {account.role ? ` · ${account.role}` : ""}
        </p>
      </div>

      {canManage ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onChangePassword}
            title="Trocar senha"
            aria-label={`Trocar a senha de ${account.name}`}
            className="inline-flex size-8 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
          >
            <KeyRound className="size-4" aria-hidden />
          </button>

          {!isSelf ? (
            <button
              type="button"
              disabled={removeAccount.isPending}
              onClick={() => {
                if (!window.confirm(`Remover o acesso de ${account.name}?`)) return;
                removeAccount.mutate(account.id, {
                  onSuccess: () => toast.success("Acesso removido", { description: account.name }),
                  onError: (error) =>
                    toast.error("Não foi possível remover", {
                      description: error instanceof ApiError ? error.message : undefined,
                    }),
                });
              }}
              title="Remover acesso"
              aria-label={`Remover o acesso de ${account.name}`}
              className="inline-flex size-8 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:bg-danger-soft hover:text-danger disabled:opacity-50"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

const fieldClass = "h-10 rounded-[12px] border-line bg-surface text-[13px]";

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createAccount = useCreateAccount();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("");
    setPassword("");
    setError(null);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    createAccount.mutate(
      { name, email, password, role: role || undefined },
      {
        onSuccess: (result) => {
          toast.success("Acesso criado", {
            description: `${result.user.name} já pode entrar com ${result.user.email}.`,
          });
          reset();
          onOpenChange(false);
        },
        onError: (problem) =>
          setError(problem instanceof ApiError ? problem.message : "Não foi possível criar o acesso"),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-[420px] gap-0 rounded-[20px] border-line bg-surface p-5">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-[16px] font-semibold tracking-tight text-ink">
            Adicionar pessoa
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-ink-soft">
            Cria um login de verdade. Combine a senha com a pessoa por um canal privado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="account-name" className="text-[12.5px] font-medium text-ink">
              Nome
            </Label>
            <Input
              id="account-name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Como ela aparece no time"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-email" className="text-[12.5px] font-medium text-ink">
              E-mail
            </Label>
            <Input
              id="account-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="pessoa@empresa.com"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-role" className="text-[12.5px] font-medium text-ink">
              Papel <span className="font-normal text-ink-faint">(opcional)</span>
            </Label>
            <Input
              id="account-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="CEO, Design, Engenharia…"
              className={fieldClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-password" className="text-[12.5px] font-medium text-ink">
              Senha inicial
            </Label>
            <Input
              id="account-password"
              type="text"
              required
              minLength={8}
              autoComplete="off"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 8 caracteres"
              className={fieldClass}
            />
            <p className="text-[11.5px] text-ink-faint">
              Fica visível de propósito: você precisa poder copiar e enviar.
            </p>
          </div>

          {error ? (
            <p role="alert" className="rounded-[12px] bg-danger-soft px-3 py-2 text-[12.5px] font-medium text-danger">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-full border-line px-4 text-[13px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createAccount.isPending}
              className="h-9 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--accent-strong)]"
            >
              {createAccount.isPending ? "Criando…" : "Criar acesso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({
  account,
  isSelf,
  onClose,
}: {
  account: Account | null;
  isSelf: boolean;
  onClose: () => void;
}) {
  const updateAccount = useUpdateAccount();
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!account) return null;

  const close = () => {
    setPassword("");
    setCurrentPassword("");
    setError(null);
    onClose();
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    updateAccount.mutate(
      { id: account.id, patch: isSelf ? { password, currentPassword } : { password } },
      {
        onSuccess: () => {
          toast.success("Senha atualizada", { description: account.name });
          close();
        },
        onError: (problem) =>
          setError(problem instanceof ApiError ? problem.message : "Não foi possível trocar a senha"),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent className="max-w-[420px] gap-0 rounded-[20px] border-line bg-surface p-5">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-[16px] font-semibold tracking-tight text-ink">
            Trocar senha
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-ink-soft">
            {isSelf
              ? "Confirme a senha atual antes de definir a nova."
              : `Definindo uma nova senha para ${account.name}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {isSelf ? (
            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-[12.5px] font-medium text-ink">
                Senha atual
              </Label>
              <Input
                id="current-password"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={fieldClass}
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-[12.5px] font-medium text-ink">
              Nova senha
            </Label>
            <Input
              id="new-password"
              type={isSelf ? "password" : "text"}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 8 caracteres"
              className={fieldClass}
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-[12px] bg-danger-soft px-3 py-2 text-[12.5px] font-medium text-danger">
              {error}
            </p>
          ) : null}

          <div className={cn("flex items-center justify-end gap-2 pt-1")}>
            <Button
              type="button"
              variant="outline"
              onClick={close}
              className="h-9 rounded-full border-line px-4 text-[13px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateAccount.isPending}
              className="h-9 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--accent-strong)]"
            >
              {updateAccount.isPending ? "Salvando…" : "Salvar senha"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
