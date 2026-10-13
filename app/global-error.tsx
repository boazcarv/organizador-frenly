"use client";

/**
 * Last line of defence: if the root layout itself throws, Next renders this
 * instead of a blank document. It ships its own <html>/<body> and inline styles
 * on purpose — no CSS, font or store dependency, so it can always paint.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#06361E",
          color: "#EAF2EE",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#FFFFFF",
            color: "#0A1512",
            borderRadius: 24,
            padding: 28,
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: "#9AA6A1" }}>
            Frenly
          </p>
          <h1 style={{ margin: "12px 0 8px", fontSize: 19, fontWeight: 600 }}>Algo saiu do trilho</h1>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#6B7A74" }}>
            Não conseguimos carregar o workspace. {error.message || "Erro inesperado"}.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 18,
              height: 38,
              padding: "0 18px",
              border: 0,
              borderRadius: 999,
              background: "#12663C",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
