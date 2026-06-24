import {
  Wifi,
  Coffee,
  Bath,
  ShowerHead,
  Flame,
  Snowflake,
  Fan,
  Car,
  ShieldCheck,
  Tv,
  LampDesk,
  PanelsTopLeft,
  PackageCheck,
  Sparkles,
  ConciergeBell,
  Refrigerator,
  Microwave,
  Sun,
  Trees,
  Presentation,
  Users,
  CigaretteOff,
  Accessibility,
  BatteryCharging,
  Cctv,
  DoorOpen,
  WashingMachine,
  BedSingle,
  BedDouble,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AmenityDef = {
  key: string;
  label: string;
  iconKey: string;
  category: string;
};

export const AMENITY_CATEGORIES = [
  "Essentials",
  "Comfort",
  "Bathroom",
  "Food & drink",
  "Parking & security",
  "Accessibility",
  "Business & conference",
  "Family features",
] as const;

export const PREDEFINED_AMENITIES: AmenityDef[] = [
  // Essentials
  { key: "wifi", label: "Free Wi-Fi", iconKey: "wifi", category: "Essentials" },
  { key: "breakfast", label: "Breakfast included", iconKey: "coffee", category: "Essentials" },
  { key: "housekeeping", label: "Daily housekeeping", iconKey: "sparkles", category: "Essentials" },
  { key: "non-smoking", label: "Non-smoking room", iconKey: "cigarette-off", category: "Essentials" },
  { key: "mosquito-net", label: "Mosquito net", iconKey: "panels-top-left", category: "Essentials" },
  { key: "private-entrance", label: "Private entrance", iconKey: "door-open", category: "Essentials" },

  // Comfort
  { key: "ac", label: "Air conditioning", iconKey: "snowflake", category: "Comfort" },
  { key: "fan", label: "Fan", iconKey: "fan", category: "Comfort" },
  { key: "tv", label: "Television", iconKey: "tv", category: "Comfort" },
  { key: "desk", label: "Desk/workspace", iconKey: "lamp-desk", category: "Comfort" },
  { key: "wardrobe", label: "Wardrobe/closet", iconKey: "panels-top-left", category: "Comfort" },
  { key: "balcony", label: "Balcony/patio", iconKey: "sun", category: "Comfort" },
  { key: "garden-access", label: "Garden access", iconKey: "trees", category: "Comfort" },
  { key: "backup-power", label: "Backup power", iconKey: "battery-charging", category: "Comfort" },

  // Bathroom
  { key: "private-bathroom", label: "Private bathroom", iconKey: "bath", category: "Bathroom" },
  { key: "shower", label: "Shower", iconKey: "shower-head", category: "Bathroom" },
  { key: "hot-water", label: "Hot water", iconKey: "flame", category: "Bathroom" },
  { key: "towels", label: "Towels provided", iconKey: "bath", category: "Bathroom" },
  { key: "toiletries", label: "Toiletries", iconKey: "package-check", category: "Bathroom" },

  // Food & drink
  { key: "tea-coffee", label: "Tea and coffee facilities", iconKey: "coffee", category: "Food & drink" },
  { key: "mini-fridge", label: "Mini fridge", iconKey: "refrigerator", category: "Food & drink" },
  { key: "microwave", label: "Microwave", iconKey: "microwave", category: "Food & drink" },
  { key: "room-service", label: "Room service", iconKey: "concierge-bell", category: "Food & drink" },
  { key: "laundry", label: "Laundry service", iconKey: "washing-machine", category: "Food & drink" },

  // Parking & security
  { key: "free-parking", label: "Free parking", iconKey: "car", category: "Parking & security" },
  { key: "secure-parking", label: "Secure parking", iconKey: "shield-check", category: "Parking & security" },
  { key: "cctv", label: "Security/CCTV", iconKey: "cctv", category: "Parking & security" },

  // Accessibility
  { key: "wheelchair", label: "Wheelchair access", iconKey: "accessibility", category: "Accessibility" },

  // Business & conference
  { key: "conference", label: "Conference facilities", iconKey: "presentation", category: "Business & conference" },

  // Family features
  { key: "family-friendly", label: "Family friendly", iconKey: "users", category: "Family features" },
  { key: "extra-bed", label: "Extra bed available", iconKey: "bed-single", category: "Family features" },
  { key: "twin-beds", label: "Twin beds", iconKey: "bed-double", category: "Family features" },
];

/**
 * Map of iconKey → LucideIcon for safe runtime resolution.
 * Only icons that exist in the installed Lucide package are included.
 */
export const amenityIconMap: Record<string, LucideIcon> = {
  wifi: Wifi,
  coffee: Coffee,
  bath: Bath,
  "shower-head": ShowerHead,
  flame: Flame,
  snowflake: Snowflake,
  fan: Fan,
  car: Car,
  "shield-check": ShieldCheck,
  tv: Tv,
  "lamp-desk": LampDesk,
  "panels-top-left": PanelsTopLeft,
  "package-check": PackageCheck,
  sparkles: Sparkles,
  "concierge-bell": ConciergeBell,
  refrigerator: Refrigerator,
  microwave: Microwave,
  sun: Sun,
  trees: Trees,
  presentation: Presentation,
  users: Users,
  "cigarette-off": CigaretteOff,
  accessibility: Accessibility,
  "battery-charging": BatteryCharging,
  cctv: Cctv,
  "door-open": DoorOpen,
  "washing-machine": WashingMachine,
  "bed-single": BedSingle,
  "bed-double": BedDouble,
};

/** Resolve a LucideIcon from an iconKey, with a fallback */
export function getAmenityIcon(iconKey: string | null | undefined): LucideIcon {
  if (iconKey && amenityIconMap[iconKey]) return amenityIconMap[iconKey];
  return Sparkles; // fallback icon
}

/** Get a human-readable label for a predefined amenity key */
export function getAmenityLabel(key: string): string {
  return PREDEFINED_AMENITIES.find((a) => a.key === key)?.label ?? key;
}

/** Suggest an icon key for a free-text amenity label using a safe mapping. */
export function suggestAmenityIcon(label: string): string | null {
  if (!label) return null;
  const s = label.toLowerCase();
  const mapping: [string[], string][] = [
    [["wifi", "wi-fi", "internet"], "wifi"],
    [["breakfast", "coffee", "tea"], "coffee"],
    [["bath", "bathroom", "ensuite", "toilet"], "bath"],
    [["shower"], "shower-head"],
    [["parking", "car", "park"], "car"],
    [["secure", "security", "safe", "cctv"], "shield-check"],
    [["ac", "air", "air conditioning", "cool"], "snowflake"],
    [["tv", "television", "telly"], "tv"],
    [["conference", "meeting", "presentation"], "presentation"],
    [["laundry", "washing", "washer"], "washing-machine"],
    [["accessible", "accessibility", "wheelchair"], "accessibility"],
    [["non-smoking", "nonsmoking", "non smoking", "no smoking"], "cigarette-off"],
    [["fridge", "refrigerator"], "refrigerator"],
  ];

  for (const [keys, icon] of mapping) {
    for (const k of keys) {
      if (s.includes(k)) return icon;
    }
  }

  return null;
}
