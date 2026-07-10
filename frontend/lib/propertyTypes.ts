import { Building2, Home, KeyRound, Palmtree, type LucideIcon } from "lucide-react";

export interface PropertyTypeOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const PROPERTY_TYPE_OPTIONS: PropertyTypeOption[] = [
  { value: "Apartment", label: "Apartment", icon: Building2 },
  { value: "Villa", label: "Villa", icon: Palmtree },
  { value: "Entire home", label: "Entire home", icon: Home },
  { value: "Private room", label: "Private room", icon: KeyRound },
];

export const PROPERTY_TYPE_VALUES = PROPERTY_TYPE_OPTIONS.map((o) => o.value);
