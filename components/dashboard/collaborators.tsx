"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { StatusChip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

const inviteSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  role: z.enum(["Designer", "Engenharia", "Produto", "Outro"], { message: "Escolha um papel" }),
});

type InviteValues = z.infer<typeof inviteSchema>;

/** Team roster + invite flow (react-hook-form + zod, same as Settings). */
export function Collaborators({ members, onOpenMember }: { members: Member[]; onOpenMember: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "Produto" },
  });

  const role = useWatch({ control: form.control, name: "role" });

  const onSubmit = form.handleSubmit((values) => {
    // No mail is sent: there is no transactional e-mail configured, and
    // pretending otherwise would leave someone waiting for a link. Access is
    // created for real in Settings → Acessos.
    toast("Acesso é criado em Settings", {
      description: `Vá em Settings → Acessos e crie o login de ${values.email}.`,
    });
    form.reset();
    setOpen(false);
  });

  return (
    <Panel className="flex h-full flex-col" padded={false}>
      <div className="p-5 pb-3">
        <PanelHeader
          title="Colaboradores do time"
          hint={`${members.filter((member) => member.online).length} de ${members.length} online agora`}
          action={
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-line px-2.5 text-[12px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
            >
              <UserPlus className="size-3.5" aria-hidden />
              Adicionar
            </button>
          }
        />
      </div>

      <ul className="flex-1 space-y-0.5 px-3 pb-3">
        {members.map((member, index) => (
          <motion.li
            key={member.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.045, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={() => onOpenMember(member.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[14px] px-2 py-2.5 text-left transition-colors duration-200",
                "hover:bg-surface-muted",
              )}
            >
              <InitialsAvatar
                name={member.name}
                color={member.color}
                size="md"
                status={member.online ? "online" : member.status === "busy" ? "away" : "offline"}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{member.name}</span>
                <span className="block truncate text-[11.5px] text-ink-faint">{member.role}</span>
              </span>
              <StatusChip status={member.status} />
            </button>
          </motion.li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[420px] gap-0 rounded-[20px] border-line bg-surface p-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-[16px] font-semibold tracking-tight text-ink">
              Adicionar colaborador
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-ink-soft">
              O acesso é criado por você em Settings → Acessos; nenhum e-mail é enviado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email" className="text-[12.5px] font-medium text-ink">
                E-mail
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="pessoa@empresa.com"
                autoComplete="email"
                aria-invalid={Boolean(form.formState.errors.email)}
                className={cn(
                  "h-10 rounded-[12px] border-line bg-surface text-[13px]",
                  form.formState.errors.email && "border-danger",
                )}
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-[11.5px] text-danger" role="alert">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12.5px] font-medium text-ink">Papel</Label>
              <Select
                value={role}
                onValueChange={(value) => form.setValue("role", value as InviteValues["role"])}
              >
                <SelectTrigger className="h-10 w-full rounded-[12px] border-line bg-surface text-[13px]">
                  <SelectValue placeholder="Escolha um papel" />
                </SelectTrigger>
                <SelectContent className="rounded-[14px] border-line">
                  {["Designer", "Engenharia", "Produto", "Outro"].map((role) => (
                    <SelectItem key={role} value={role} className="text-[13px]">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="h-9 rounded-full border-line px-4 text-[13px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-9 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--accent-strong)]"
              >
                Enviar convite
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
