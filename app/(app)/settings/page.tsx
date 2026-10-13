"use client";

import { motion } from "motion/react";
import { Bell, Palette, UserRound } from "lucide-react";
import { useState } from "react";
import { AppearancePicker } from "@/components/settings/appearance-picker";
import { NotificationList } from "@/components/settings/notification-list";
import { ProfileForm } from "@/components/settings/profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { SPRING_GESTURE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Section = "profile" | "notifications" | "appearance";

const sections: { id: Section; label: string; hint: string; icon: typeof UserRound }[] = [
  { id: "profile", label: "Perfil", hint: "Nome, contato e fuso", icon: UserRound },
  { id: "notifications", label: "Notificações", hint: "O que chega e quando", icon: Bell },
  { id: "appearance", label: "Aparência", hint: "Cor de destaque e tema", icon: Palette },
];

export default function SettingsPage() {
  const [section, setSection] = useState<Section>("profile");

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Ajustes do seu workspace, da sua conta e do visual do Frenly." />

      <div className="grid gap-4 lg:grid-cols-[236px_minmax(0,1fr)]">
        <nav aria-label="Seções de configuração" className="lg:sticky lg:top-2 lg:self-start">
          <ul className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
            {sections.map((item) => {
              const active = item.id === section;
              return (
                <li key={item.id} className="shrink-0 lg:shrink">
                  <button
                    type="button"
                    onClick={() => setSection(item.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "relative flex h-10 w-full items-center gap-2.5 rounded-full px-3.5 text-left transition-colors duration-200",
                      active ? "text-accent" : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="settings-pill"
                        className="absolute inset-0 rounded-full bg-accent-tint"
                        transition={SPRING_GESTURE}
                      />
                    ) : null}
                    <item.icon className="relative z-10 size-[18px]" aria-hidden />
                    <span className="relative z-10">
                      <span className="block text-[13px] font-medium">{item.label}</span>
                      <span className="hidden text-[11px] text-ink-faint lg:block">{item.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <Panel hoverable={false} className="min-w-0 p-6">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {section === "profile" ? (
              <>
                <SectionHeading
                  title="Perfil"
                  description="Essas informações aparecem para o time em cartões, comentários e relatórios."
                />
                <div className="mt-5">
                  <ProfileForm />
                </div>
              </>
            ) : null}

            {section === "notifications" ? (
              <>
                <SectionHeading
                  title="Notificações"
                  description="Escolha o que merece interromper o seu foco — e o que pode esperar."
                />
                <div className="mt-5">
                  <NotificationList />
                </div>
              </>
            ) : null}

            {section === "appearance" ? (
              <>
                <SectionHeading
                  title="Aparência"
                  description="O Frenly re-tinge toda a interface quando você troca a cor de destaque."
                />
                <div className="mt-5">
                  <AppearancePicker />
                </div>
              </>
            ) : null}
          </motion.div>
        </Panel>
      </div>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <header>
      <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
      <p className="mt-1 text-[12.5px] text-ink-soft">{description}</p>
    </header>
  );
}
