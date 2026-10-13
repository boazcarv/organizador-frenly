"use client";

import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { CommandMenu } from "@/components/shell/command-menu";
import { Sidebar, SidebarContent } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { MemberDrawer } from "@/components/team/member-drawer";
import { TrackerMobileBar } from "@/components/dashboard/time-tracker";
import { PageTransition } from "@/components/motion/page-transition";
import { useUiStore } from "@/store/ui";

/**
 * The framed app window: a light, 28px-rounded surface floating over the deep
 * green canvas. Sidebar + topbar stay mounted; only the inner view transitions.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <div className="min-h-dvh bg-canvas p-0 sm:p-2.5 lg:p-4">
      <div className="mx-auto flex h-dvh w-full max-w-[1720px] overflow-hidden bg-surface-muted shadow-[var(--shadow-window)] sm:h-[calc(100dvh-1.25rem)] sm:rounded-[24px] lg:h-[calc(100dvh-2rem)] lg:rounded-[28px]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-surface-muted">
            <PageTransition className="mx-auto w-full max-w-[1560px] px-4 pt-5 pb-24 sm:px-6 sm:pb-24 lg:px-7 lg:pt-6 lg:pb-20">
              {children}
            </PageTransition>
          </div>
        </div>
      </div>

      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen} direction="left">
        <DrawerContent className="w-[268px] rounded-r-[24px] border-line bg-surface-muted p-0">
          <DrawerTitle className="sr-only">Menu de navegação</DrawerTitle>
          <DrawerDescription className="sr-only">
            Navegue entre dashboard, time, agenda, analytics, tarefas e configurações.
          </DrawerDescription>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </DrawerContent>
      </Drawer>

      <MemberDrawer />
      <TrackerMobileBar />
      <CommandMenu />
    </div>
  );
}
