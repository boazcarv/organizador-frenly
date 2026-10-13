import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Frenly — Projetos, tempo e time em um só lugar",
    template: "%s · Frenly",
  },
  description:
    "Frenly é o workspace de gestão de projetos e horas: quadros, cronômetro, agenda e analytics do time em um só lugar.",
  applicationName: "Frenly",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#06361E" },
    { media: "(prefers-color-scheme: dark)", color: "#04170F" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      data-accent="green"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-dvh font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
