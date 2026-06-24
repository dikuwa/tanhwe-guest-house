"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PREDEFINED_AMENITIES,
  AMENITY_CATEGORIES,
  getAmenityIcon,
  getAmenityLabel,
  suggestAmenityIcon,
} from "@/lib/amenity-icons";
import { cn } from "@/lib/utils";

type AmenitySelectorProps = {
  value: string[];
  onChange: (amenities: string[]) => void;
  id?: string;
};

export function AmenitySelector({ value, onChange, id }: AmenitySelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return PREDEFINED_AMENITIES;
    const q = search.toLowerCase();
    return PREDEFINED_AMENITIES.filter(
      (a) => a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );
  }, [search]);

  const selected = useMemo(
    () => PREDEFINED_AMENITIES.filter((a) => value.includes(a.key)),
    [value]
  );

  const grouped = useMemo(() => {
    const groups: Record<string, typeof PREDEFINED_AMENITIES> = {};
    for (const category of AMENITY_CATEGORIES) {
      const items = filtered.filter((a) => a.category === category);
      if (items.length) groups[category] = items;
    }
    return groups;
  }, [filtered]);

  const suggestedIconKey = useMemo(() => {
    const q = search.trim();
    if (!q) return null;
    return suggestAmenityIcon(q);
  }, [search]);

  function toggle(key: string) {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  }

  const categories = search.trim() ? ["All"] : Object.keys(grouped);

  return (
    <div id={id} className="space-y-3">
      {/* Selected amenities as chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((amenity) => {
            const Icon = getAmenityIcon(amenity.iconKey);
            return (
              <Badge key={amenity.key} variant="secondary" className="gap-1 pl-1.5 text-xs">
                <Icon className="size-3" />
                {amenity.label}
                <button
                  type="button"
                  onClick={() => toggle(amenity.key)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remove ${amenity.label}`}
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search amenities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 pl-8"
        />
      </div>

      {/* Grouped amenity grid */}
      <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border bg-white p-3">
        {categories.map((category) => {
          const items = category === "All" ? filtered : grouped[category] ?? [];
          if (!items.length) return null;

          return (
            <div key={category}>
              {!search.trim() && (
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {category}
                </p>
              )}
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {items.map((amenity) => {
                  const isSelected = value.includes(amenity.key);
                  const Icon = getAmenityIcon(amenity.iconKey);

                  return (
                    <button
                      key={amenity.key}
                      type="button"
                      onClick={() => toggle(amenity.key)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary-foreground/90"
                          : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", isSelected && "text-primary")} />
                      <span className="flex-1">{amenity.label}</span>
                      {isSelected && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-3 text-center text-sm text-muted-foreground">
            <p className="mb-3">No amenities match &ldquo;{search}&rdquo;</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const label = search.trim();
                  if (!label) return;
                  // Prevent obvious duplicates
                  const exists = value.some((v) => v.toLowerCase() === label.toLowerCase());
                  if (exists) return;
                  onChange([...value, label]);
                  setSearch("");
                }}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
              >
                {suggestedIconKey && (
                  <span className="inline-flex items-center justify-center text-muted-foreground">
                    {(() => {
                      const Icon = getAmenityIcon(suggestedIconKey);
                      return <Icon className="size-4 text-primary" />;
                    })()}
                  </span>
                )}
                <span>Add “{search}”</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
