import {
  Compass,
  Database,
  Globe,
  Layers,
  Megaphone,
  Palette,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { pastelClasses } from "@/lib/format";
import type { PastelKey, ProjectIcon } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons: Record<ProjectIcon, LucideIcon> = {
  layers: Layers,
  megaphone: Megaphone,
  palette: Palette,
  smartphone: Smartphone,
  globe: Globe,
  database: Database,
  sparkles: Sparkles,
  compass: Compass,
};

const sizes = {
  sm: "size-7 rounded-[10px] [&_svg]:size-3.5",
  md: "size-9 rounded-[12px] [&_svg]:size-4",
  lg: "size-11 rounded-[14px] [&_svg]:size-5",
} as const;

/** Project avatar: pastel tile + geometric line icon. */
export function ProjectIconTile({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: ProjectIcon;
  color: PastelKey;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const Icon = icons[icon];
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center", sizes[size], pastelClasses[color], className)}
    >
      <Icon strokeWidth={1.9} />
    </span>
  );
}

export function projectIconFor(icon: ProjectIcon): LucideIcon {
  return icons[icon];
}
