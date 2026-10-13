"use client";

import { Bell, Mail, Timer } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useNotifications, useToggleNotification } from "@/lib/queries";

const icons = {
  "notif-digest": Mail,
  "notif-mentions": Bell,
  "notif-tracker": Timer,
} as const;

export function NotificationList() {
  const { data, isPending } = useNotifications();
  const toggle = useToggleNotification();

  if (isPending || !data) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-[86px] animate-pulse rounded-[16px] border border-line bg-surface-muted" />
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((item) => {
        const Icon = icons[item.id as keyof typeof icons] ?? Bell;
        return (
          <li
            key={item.id}
            className="flex items-start gap-3.5 rounded-[16px] border border-line bg-surface p-4 transition-colors duration-200 hover:bg-surface-muted/60"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent">
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{item.description}</p>
            </div>
            <Switch
              checked={item.enabled}
              aria-label={`${item.enabled ? "Desativar" : "Ativar"} ${item.title}`}
              onCheckedChange={(checked) =>
                toggle.mutate(
                  { id: item.id, enabled: checked },
                  {
                    onSuccess: () =>
                      toast.success(checked ? "Notificação ativada" : "Notificação desativada", {
                        description: item.title,
                      }),
                  },
                )
              }
              className="mt-0.5 data-[state=checked]:bg-[var(--accent)]"
            />
          </li>
        );
      })}
    </ul>
  );
}
