"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { timezones } from "@/lib/constants";
import { useProfile, useSaveProfile } from "@/lib/queries";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(3, "Informe o nome completo"),
  email: z.email("E-mail inválido"),
  role: z.string().min(2, "Informe o cargo"),
  timezone: z.string().min(1, "Escolha o fuso horário"),
  bio: z.string().max(240, "Máximo de 240 caracteres").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm() {
  const { data: profile, isPending } = useProfile();
  const saveProfile = useSaveProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", role: "", timezone: "America/Sao_Paulo", bio: "" },
  });

  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedBio = useWatch({ control: form.control, name: "bio" });
  const watchedTimezone = useWatch({ control: form.control, name: "timezone" });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        email: profile.email,
        role: profile.role,
        timezone: profile.timezone,
        bio: profile.bio,
      });
    }
  }, [profile, form]);

  if (isPending || !profile) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-3 w-56 rounded-full" />
          </div>
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-10 rounded-[12px]" />
        ))}
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await saveProfile.mutateAsync(values);
      toast.success("Perfil atualizado", { description: "Suas alterações já valem para o time." });
    } catch {
      toast.error("Não foi possível salvar", { description: "Verifique sua conexão e tente de novo." });
    }
  });

  const errors = form.formState.errors;
  const bio = watchedBio ?? "";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        <InitialsAvatar name={watchedName || profile.name} color={profile.color} size="2xl" status="online" />
        <div>
          <p className="text-[13.5px] font-semibold text-ink">Foto de perfil</p>
          <p className="mt-0.5 text-[12px] text-ink-soft">
            Usamos suas iniciais — sem uploads, sem requisições externas.
          </p>
          <button
            type="button"
            onClick={() => toast("Upload de foto ainda não disponível", {
              description: "Os avatares usam suas iniciais — funcionam sem nenhum serviço externo.",
            })}
            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[12px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
          >
            <Camera className="size-3.5" aria-hidden />
            Trocar imagem
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome completo" error={errors.name?.message}>
          <Input
            aria-invalid={Boolean(errors.name)}
            className={cn("h-10 rounded-[12px] border-line text-[13px]", errors.name && "border-danger")}
            {...form.register("name")}
          />
        </Field>

        <Field label="E-mail" error={errors.email?.message}>
          <Input
            type="email"
            aria-invalid={Boolean(errors.email)}
            className={cn("h-10 rounded-[12px] border-line text-[13px]", errors.email && "border-danger")}
            {...form.register("email")}
          />
        </Field>

        <Field label="Cargo" error={errors.role?.message}>
          <Input
            aria-invalid={Boolean(errors.role)}
            className={cn("h-10 rounded-[12px] border-line text-[13px]", errors.role && "border-danger")}
            {...form.register("role")}
          />
        </Field>

        <Field label="Fuso horário">
          <Select value={watchedTimezone} onValueChange={(value) => form.setValue("timezone", value)}>
            <SelectTrigger className="h-10 w-full rounded-[12px] border-line text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-[14px] border-line">
              {timezones.map((zone) => (
                <SelectItem key={zone.value} value={zone.value} className="text-[13px]">
                  {zone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Bio" error={errors.bio?.message} hint={`${bio.length}/240`}>
        <Textarea
          rows={3}
          placeholder="Como você trabalha, o que gosta de construir…"
          className="min-h-[88px] rounded-[12px] border-line text-[13px]"
          {...form.register("bio")}
        />
      </Field>

      <div className="flex items-center justify-end gap-2 border-t border-line-soft pt-5">
        <button
          type="button"
          onClick={() => form.reset()}
          className="inline-flex h-9 items-center rounded-full border border-line px-4 text-[13px] font-medium text-ink-soft transition-colors duration-200 hover:bg-surface-muted hover:text-ink"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saveProfile.isPending}
          className="inline-flex h-9 items-center rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-strong)] disabled:opacity-60"
        >
          {saveProfile.isPending ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-[12.5px] font-medium text-ink">{label}</Label>
        {hint ? <span className="text-[11px] tabular-nums text-ink-faint">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p className="text-[11.5px] text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
