import type { AccentKey } from "./types";

export interface AccentOption {
  key: AccentKey;
  label: string;
  /** swatch gradient (soft → strong) */
  swatch: [string, string];
  light: { accent: string; strong: string; soft: string; tint: string };
  dark: { accent: string; strong: string; soft: string; tint: string };
}

export const accents: AccentOption[] = [
  {
    key: "green",
    label: "Verde",
    swatch: ["#5ABE8A", "#12663C"],
    light: { accent: "#12663C", strong: "#0C4E2C", soft: "#5ABE8A", tint: "#E8F3EC" },
    dark: { accent: "#2F8F5F", strong: "#1D6B44", soft: "#6FD0A0", tint: "rgba(90,190,138,.14)" },
  },
  {
    key: "ocean",
    label: "Azul",
    swatch: ["#7FB0E5", "#1E4EA2"],
    light: { accent: "#1E4EA2", strong: "#0C3066", soft: "#7FB0E5", tint: "#E8EEFA" },
    dark: { accent: "#3F74C8", strong: "#2A5499", soft: "#8DB9EE", tint: "rgba(127,176,229,.14)" },
  },
  {
    key: "plum",
    label: "Roxo",
    swatch: ["#B294E4", "#6D3BBF"],
    light: { accent: "#6D3BBF", strong: "#4C2790", soft: "#B294E4", tint: "#F0EAFB" },
    dark: { accent: "#8F5FD8", strong: "#6D3BBF", soft: "#BDA1EC", tint: "rgba(178,148,228,.14)" },
  },
  {
    key: "rose",
    label: "Rosé",
    swatch: ["#E894A9", "#C2395C"],
    light: { accent: "#C2395C", strong: "#93253F", soft: "#E894A9", tint: "#FBEAEE" },
    dark: { accent: "#D95B7C", strong: "#B03E5D", soft: "#EF9DB1", tint: "rgba(232,148,169,.14)" },
  },
  {
    key: "amber",
    label: "Âmbar",
    swatch: ["#E6BD76", "#B5761A"],
    light: { accent: "#B5761A", strong: "#8A5810", soft: "#E6BD76", tint: "#FAF0DE" },
    dark: { accent: "#D0921F", strong: "#A9700F", soft: "#ECC78B", tint: "rgba(230,189,118,.14)" },
  },
];

export const accentKeys = accents.map((accent) => accent.key);

export function isAccentKey(value: unknown): value is AccentKey {
  return typeof value === "string" && accentKeys.includes(value as AccentKey);
}
