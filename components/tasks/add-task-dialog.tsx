"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays } from "date-fns";
import { CalendarIcon, ListPlus } from "lucide-react";
import { useEffect } from "react";
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
import { APP_TODAY } from "@/lib/constants";
import { formatShortDate } from "@/lib/format";
import { useCreateTask } from "@/lib/queries";
import type { Member, Project, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(3, "Descreva a tarefa com pelo menos 3 caracteres").max(90, "Título muito longo"),
  projectId: z.string().min(1, "Escolha um projeto"),
  assignee: z.string().min(1, "Escolha um responsável"),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["backlog", "progress", "review", "done"]),
  dueAt: z.string().min(1, "Defina uma data limite"),
  notes: z.string().max(240, "Máximo de 240 caracteres").optional(),
});

type FormValues = z.infer<typeof schema>;

/** Today + 3 days, formatted for <input type="date">. */
const defaultDueDate = addDays(APP_TODAY, 3).toISOString().slice(0, 10);

const columnLabels: Record<TaskStatus, string> = {
  backlog: "Backlog",
  progress: "Em progresso",
  review: "Revisão",
  done: "Concluído",
};

/**
 * Creates a task through the API. There is no optimistic insert here on
 * purpose: the mutation refreshes the task list and the board reconciles
 * itself, so the card that appears is the one the server actually stored.
 */
export function AddTaskDialog({
  open,
  status,
  onOpenChange,
  projects,
  members,
}: {
  open: boolean;
  status: TaskStatus;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  members: Member[];
}) {
  const createTask = useCreateTask();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      projectId: projects[0]?.id ?? "",
      assignee: members[0]?.name ?? "",
      priority: "medium",
      status,
      dueAt: defaultDueDate,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) form.setValue("status", status);
  }, [open, status, form]);

  const values = useWatch({ control: form.control }) as Partial<FormValues>;

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const created = await createTask.mutateAsync({
        title: data.title,
        projectId: data.projectId,
        status: data.status,
        priority: data.priority,
        assignee: data.assignee,
        dueAt: new Date(`${data.dueAt}T12:00:00`).toISOString(),
      });
      toast.success("Tarefa criada", {
        description: `${created.title} · ${columnLabels[created.status]}`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Não foi possível salvar", {
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
      });
    }
  });

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 rounded-[22px] border-line bg-surface p-6">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-[17px] font-semibold tracking-tight text-ink">Nova tarefa</DialogTitle>
          <DialogDescription className="text-[12.5px] text-ink-soft">
            Ela entra direto na coluna escolhida — arraste depois se precisar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-[12.5px] font-medium text-ink">
              Título
            </Label>
            <Input
              id="task-title"
              placeholder="Ex.: Revisar empty states do checkout"
              aria-invalid={Boolean(errors.title)}
              className={cn("h-10 rounded-[12px] border-line text-[13px]", errors.title && "border-danger")}
              {...form.register("title")}
            />
            {errors.title ? (
              <p className="text-[11.5px] text-danger" role="alert">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Projeto">
              <Select value={values.projectId ?? ""} onValueChange={(value) => form.setValue("projectId", value)}>
                <SelectTrigger className="h-10 w-full rounded-[12px] border-line text-[13px]">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="rounded-[14px] border-line">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="text-[13px]">
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Responsável">
              <Select value={values.assignee ?? ""} onValueChange={(value) => form.setValue("assignee", value)}>
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

            <Field label="Prioridade">
              <Select
                value={values.priority ?? "medium"}
                onValueChange={(value) => form.setValue("priority", value as FormValues["priority"])}
              >
                <SelectTrigger className="h-10 w-full rounded-[12px] border-line text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[14px] border-line">
                  <SelectItem value="high" className="text-[13px]">
                    Alta
                  </SelectItem>
                  <SelectItem value="medium" className="text-[13px]">
                    Média
                  </SelectItem>
                  <SelectItem value="low" className="text-[13px]">
                    Baixa
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Data limite">
              <div className="relative">
                <CalendarIcon
                  className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-faint"
                  aria-hidden
                />
                <Input
                  type="date"
                  aria-label="Data limite"
                  className="h-10 rounded-[12px] border-line pl-9 text-[13px]"
                  {...form.register("dueAt")}
                />
              </div>
              <p className="mt-1 text-[11px] text-ink-faint">
                {formatShortDate(values.dueAt || defaultDueDate)}
              </p>
            </Field>
          </div>

          <Field label="Notas (opcional)">
            <Textarea
              rows={3}
              placeholder="Contexto, links, critérios de aceite…"
              className="min-h-[76px] rounded-[12px] border-line text-[13px]"
              {...form.register("notes")}
            />
          </Field>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-faint">
              <ListPlus className="size-3.5" aria-hidden />
              Entra em {columnLabels[values.status ?? status]}
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
                disabled={createTask.isPending}
                className="h-9 rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--accent-strong)]"
              >
                {createTask.isPending ? "Criando…" : "Criar tarefa"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12.5px] font-medium text-ink">{label}</Label>
      {children}
    </div>
  );
}
