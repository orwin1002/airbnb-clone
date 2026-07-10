import { Building2, Flame, Sparkles, TreePine, Waves, type LucideIcon } from "lucide-react";

export interface VibeOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const VIBE_OPTIONS: VibeOption[] = [
  { value: "Beachfront", label: "Beachfront", icon: Waves },
  { value: "Cabins", label: "Cabins", icon: TreePine },
  { value: "Trending", label: "Trending", icon: Flame },
  { value: "City", label: "City", icon: Building2 },
  { value: "Luxury", label: "Luxury", icon: Sparkles },
];

export const VIBE_VALUES = VIBE_OPTIONS.map((o) => o.value);
