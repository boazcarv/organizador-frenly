import { AuthShell } from "./auth-shell";

/**
 * Server-rendered placeholder for the access screens.
 *
 * The forms are client components (they read the workspace state and post
 * credentials), and a `Suspense` boundary around them would otherwise render
 * nothing on the server — the very first thing a new visitor sees would be a
 * blank canvas until the JavaScript arrived. This paints the frame immediately.
 */
export function AuthFallback({ title = "Frenly", subtitle = "Carregando…" }: { title?: string; subtitle?: string }) {
  return (
    <AuthShell title={title} subtitle={subtitle}>
      <div className="flex h-[168px] items-center justify-center" role="status" aria-label="Carregando">
        <span className="size-5 animate-spin rounded-full border-2 border-line border-t-[var(--accent)]" />
      </div>
    </AuthShell>
  );
}
