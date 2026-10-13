"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays } from "date-fns";
import { CalendarIcon, FolderPlus } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { APP_TODAY, projectStatusOptions, projectTypes } from "@/lib/constants";
import { formatShortDate } from "@/lib/format";
import { useCreateProject, useMembers } from "@/lib/queries";
import type { PastelKey, ProjectIcon } from "@/lib/types";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(3, "Dê um nome com 3 caracteres ou mais").max(70, "Nome muito longo"),
  type: z.string().min(2, "Escolha o tipo do projeto"),
  owner: z.string().min(1, "Escolha um responsável"),
  status: z.enum(["active", "waiting", "pending", "completed"]),
  dueAt: z.string().min(1, "Defina um prazo"),
  progress: z.string().regex(/^\d{1,3}$/, "Entre 0 e 100").refine((value) => Number(value) <= 100, "Entre 0 e 100"),
  notes: z.string().max(240, "Máximo de 240 caracteres").optional(),
});

type FormValues = z.infer<typeof schema>;

const defaultDueDate = addDays(APP_TODAY, 30).toISOString().slice(0, 10);

/**
 * Deterministic palette cycling for new projects: pure, so render stays
 * predictable, and it still gives the dashboard a varied look over time.
 */
let projectPaletteCursor = 0;
function nextPalette(): { color: PastelKey; icon: ProjectIcon } {
  const index = projectPaletteCursor % 5;
  projectPaletteCursor += 1;
  return { color: swatches[index], icon: icons[index % icons.length] };
}

const swatches: PastelKey[] = ["sage", "peach", "blue", "lilac", "sand"];
const swatchHex: Record<PastelKey, string> = {
  peach: "#F6D9C8",
  blue: "#CFE3F5",
  sage: "#D8EADF",
  sand: "#EFE3CB",
  lilac: "#E0D6F5",
};
const icons: ProjectIcon[] = ["layers", "palette", "megaphone", "smartphone", "globe", "sparkles"];

/**
 * Real project creation: POSTs to /api/projects, which persists to the server
 * store, and the dashboard (stat cards, list, ring) updates from the same query.
 */
export function NewProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createProject = useCreateProject();
  const { data: members = [] } = useMembers();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "Design",
      owner: members[0]?.name ?? "",
      status: "active",
      dueAt: defaultDueDate,
      progress: "0",
      notes: "",
    },
  });

  const values = useWatch({ control: form.control }) as Partial<FormValues>;

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const created = await createProject.mutateAsync({
        name: data.name.trim(),
        type: data.type,
        owner: data.owner || members[0]?.name || "Time",
        status: data.status,
        dueAt: new Date(`${data.dueAt}T12:00:00`).toISOString(),
        progress: Number(data.progress) || 0,
        ...nextPalette(),
      });
      toast.success("Projeto criado", {
        description: `${created.name} · ${created.type} · prazo ${formatShortDate(created.dueAt)}`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Não foi possível criar o projeto", {
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    }
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 rounded-[22px] border-line bg-surface p-6">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-[17px] font-semibold tracking-tight text-ink">Novo projeto</DialogTitle>
          <DialogDescription className="text-[12.5px] text-ink-soft">
            Ele aparece na hora no dashboard, na lista de projetos e nas contagens do topo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name" className="text-[12.5px] font-medium text-ink">
              Nome do projeto
            </Label>
            <Input
              id="project-name"
              placeholder="Ex.: Portal do Cliente 2.0"
              aria-invalid={Boolean(errors.name)}
              className={cn("h-10 rounded-[12px] border-line text-[13px]", errors.name && "border-danger")}
              {...form.register("name")}
            />
            {errors.name ? (
              <p className="text-[11.5px] text-danger" role="alert">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select value={values.type ?? "Design"} onValueChange={(value) => form.setValue("type", value)}>
                <SelectTrigger className="h-10 w-full rounded-[12px] border-line text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[14px] border-line">
                  {projectTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-[13px]">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Responsável">
              <Select value={values.owner ?? ""} onValueChange={(value) => form.setValue("owner", value)}>
                <SelectTrigger className="h-10 w-full rounded-[12px] border-line text-[13px]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="rounded-[14px] border-line">
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.name} className="text-[13px]">
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Status">
              <Select
                value={values.status ?? "active"}
                onValueChange={(value) => form.setValue("status", value as FormValues["status"])}
              >
                <SelectTrigger className="h-10 w-full rounded-[12px] border-line text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[14px] border-line">
                  {projectStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-[13px]">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Prazo">
              <div className="relative">
                <CalendarIcon
                  className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-faint"
                  aria-hidden
                />
                <Input
                  type="date"
                  aria-label="Prazo"
                  className="h-10 rounded-[12px] border-line pl-9 text-[13px]"
                  {...form.register("dueAt")}
                />
              </div>
            </Field>

            <Field label="Progresso inicial (%)" error={errors.progress?.message}>
              <Input
                type="number"
                min={0}
                max={100}
                className="h-10 rounded-[12px] border-line text-[13px] tabular-nums"
                {...form.register("progress")}
              />
            </Field>

            <Field label="Cor">
              <div className="flex h-10 items-center gap-2">
                {swatches.map((key) => (
                  <span
                    key={key}
                    aria-hidden
                    className="size-6 rounded-full ring-2 ring-transparent"
                    style={{ backgroundColor: swatchHex[key] }}
                  />
                ))}
                <span className="text-[11px] text-ink-faint">definida ao criar</span>
              </div>
            </Field>
          </div>

          <Field label="Descrição (opcional)">
            <Textarea
              rows={3}
              placeholder="Objetivo, escopo, o que conta como pronto…"
              className="min-h-[76px] rounded-[12px] border-line text-[13px]"
              {...form.register("notes")}
            />
          </Field>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-faint">
              <FolderPlus className="size-3.5" aria-hidden />
              Salvo no workspace
            </span>
            <div className="flex items-center gap-2">
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
                disabled={createProject.isPending}
                className="h-9 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--accent-strong)]"
              >
                {createProject.isPending ? "Criando…" : "Criar projeto"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12.5px] font-medium text-ink">{label}</Label>
      {children}
      {error ? (
        <p className="text-[11.5px] text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
