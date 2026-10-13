import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-[420px] rounded-[24px] border border-line bg-surface p-8 text-center">
        <p className="label-section">Erro 404</p>
        <h1 className="mt-3 text-[22px] font-semibold tracking-tight text-ink">Página não encontrada</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          O endereço que você abriu não existe no Frenly.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-9 items-center rounded-full bg-[var(--accent)] px-4 text-[13px] font-semibold text-white"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </main>
  );
}
