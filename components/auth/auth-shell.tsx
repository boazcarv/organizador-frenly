import Link from "next/link";

/**
 * The frame shared by the login and first-run screens: the same green canvas
 * and floating light window the product itself uses, so the door and the room
 * feel like the same building.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
      <main className="w-full max-w-[420px] rounded-[28px] border border-line bg-surface p-7 shadow-[var(--shadow-pop)] sm:p-8">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-[13px] bg-accent-tint text-accent">
            <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
              <path
                d="M5 18.5V10a5 5 0 0 1 5-5h9"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <path
                d="M5 13.5h7.5"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                opacity=".5"
              />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Frenly</span>
        </div>

        <h1 className="mt-6 text-[24px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{subtitle}</p>

        <div className="mt-6">{children}</div>

        {footer ? <div className="mt-6 border-t border-line-soft pt-5">{footer}</div> : null}
      </main>

      <p className="sr-only">
        <Link href="/login">Frenly</Link>
      </p>
    </div>
  );
}
