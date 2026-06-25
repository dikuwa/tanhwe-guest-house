"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Check,
  X,
  PackageCheck,
  Sparkles,
  Bath,
  Coffee,
  Car,
  Accessibility,
  Presentation,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PREDEFINED_AMENITIES,
  AMENITY_CATEGORIES,
  getAmenityIcon,
  suggestAmenityIcon,
} from "@/lib/amenity-icons";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Essentials: PackageCheck,
  Comfort: Sparkles,
  Bathroom: Bath,
  "Food & drink": Coffee,
  "Parking & security": Car,
  Accessibility: Accessibility,
  "Business & conference": Presentation,
  "Family features": Users,
};

type RoomAmenitiesSelectorProps = {
  value: string[];
  onChange: (amenities: string[]) => void;
  id?: string;
};

export function RoomAmenitiesSelector({
  value,
  onChange,
  id,
}: RoomAmenitiesSelectorProps) {
  const [search, setSearch] = useState("");

  const predefinedKeys = useMemo(
    () => new Set(PREDEFINED_AMENITIES.map((a) => a.key)),
    [],
  );

  const customAmenities = useMemo(
    () => value.filter((k) => !predefinedKeys.has(k)),
    [value, predefinedKeys],
  );

  const allPredefinedKeys = useMemo(
    () => PREDEFINED_AMENITIES.map((a) => a.key),
    [],
  );

  const [openCategories, setOpenCategories] = useState<Set<string>>(() => {
    const selectedCategories = new Set<string>();
    for (const a of PREDEFINED_AMENITIES) {
      if (value.includes(a.key)) selectedCategories.add(a.category);
    }
    if (selectedCategories.size > 0) return selectedCategories;
    return new Set([AMENITY_CATEGORIES[0]]);
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return PREDEFINED_AMENITIES;
    const q = search.toLowerCase();
    return PREDEFINED_AMENITIES.filter(
      (a) => a.label.toLowerCase().includes(q) || a.category.toLowerCase().includes(q),
    );
  }, [search]);

  useEffect(() => {
    if (search.trim()) {
      const matched = new Set(filtered.map((a) => a.category));
      if (matched.size > 0) setOpenCategories(matched);
    }
  }, [search, filtered]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof PREDEFINED_AMENITIES> = {};
    for (const category of AMENITY_CATEGORIES) {
      const items = filtered.filter((a) => a.category === category);
      if (items.length) groups[category] = items;
    }
    return groups;
  }, [filtered]);

  const selectedPredefinedCount = value.filter((k) =>
    predefinedKeys.has(k),
  ).length;
  const totalPredefinedCount = PREDEFINED_AMENITIES.length;
  const allSelected = selectedPredefinedCount === totalPredefinedCount;

  const hasSearchResults = Object.keys(grouped).length > 0;

  const toggleCategory = useCallback((category: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (key: string) => {
      if (value.includes(key)) {
        onChange(value.filter((k) => k !== key));
      } else {
        onChange([...value, key]);
      }
    },
    [value, onChange],
  );

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onChange(value.filter((k) => !predefinedKeys.has(k)));
    } else {
      const existing = new Set(value);
      for (const k of allPredefinedKeys) existing.add(k);
      onChange(Array.from(existing));
    }
  }, [allSelected, value, onChange, predefinedKeys, allPredefinedKeys]);

  const toggleCategoryAll = useCallback(
    (category: string) => {
      const categoryKeys = PREDEFINED_AMENITIES.filter(
        (a) => a.category === category,
      ).map((a) => a.key);
      const allInCategorySelected = categoryKeys.every((k) => value.includes(k));
      const existing = new Set(value);
      if (allInCategorySelected) {
        for (const k of categoryKeys) existing.delete(k);
      } else {
        for (const k of categoryKeys) existing.add(k);
      }
      onChange(Array.from(existing));
    },
    [value, onChange],
  );

  const removeCustom = useCallback(
    (key: string) => {
      onChange(value.filter((k) => k !== key));
    },
    [value, onChange],
  );

  const addCustom = useCallback(() => {
    const label = search.trim();
    if (!label) return;
    const exists = value.some((v) => v.toLowerCase() === label.toLowerCase());
    if (exists) return;
    onChange([...value, label]);
    setSearch("");
  }, [search, value, onChange]);

  const totalSelected = value.length;

  return (
    <div id={id} className="space-y-4">
      {/* Custom amenities */}
      {customAmenities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customAmenities.map((key) => (
            <Badge key={key} variant="secondary" className="gap-1 pl-1.5 text-xs">
              {key}
              <button
                type="button"
                onClick={() => removeCustom(key)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remove ${key}`}
              >
                <X className="size-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search + Select All */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search amenities"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
            aria-label="Search amenities"
          />
        </div>
        <button
          type="button"
          onClick={handleSelectAll}
          className="shrink-0 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          {allSelected ? "Clear All" : "Select All"}
        </button>
      </div>

      {/* Accordion groups */}
      <div className="space-y-1">
        {AMENITY_CATEGORIES.map((category) => {
          const items = grouped[category];
          if (!items) return null;

          const categoryKeys = PREDEFINED_AMENITIES.filter(
            (a) => a.category === category,
          ).map((a) => a.key);
          const selectedInCategory = value.filter((k) =>
            categoryKeys.includes(k),
          );
          const allInCategorySelected =
            selectedInCategory.length === categoryKeys.length;
          const CatIcon = CATEGORY_ICONS[category] ?? Sparkles;
          const isOpen = openCategories.has(category);

          return (
            <div
              key={category}
              className="overflow-hidden rounded-lg border border-neutral-200"
            >
              <h3>
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  <CatIcon className="size-4 shrink-0 text-neutral-400" />
                  <span className="flex-1">{category}</span>
                  {selectedInCategory.length > 0 && (
                    <span className="text-xs font-medium text-primary">
                      {selectedInCategory.length} selected
                    </span>
                  )}
                  <span className="text-xs text-neutral-400">
                    {categoryKeys.length} items
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategoryAll(category);
                    }}
                    className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    {allInCategorySelected ? "Clear" : "All"}
                  </button>
                  <ChevronDown
                    className={cn(
                      "size-4 text-neutral-400 transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
              </h3>
              {isOpen && (
                <div className="border-t border-neutral-100 p-3" role="region">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((amenity) => {
                      const isSelected = value.includes(amenity.key);
                      const Icon = getAmenityIcon(amenity.iconKey);
                      return (
                        <button
                          key={amenity.key}
                          type="button"
                          onClick={() => toggle(amenity.key)}
                          className={cn(
                            "flex min-h-[44px] items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5 text-neutral-800"
                              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4 shrink-0",
                              isSelected ? "text-primary" : "text-neutral-400",
                            )}
                          />
                          <span className="flex-1 leading-tight">
                            {amenity.label}
                          </span>
                          {isSelected && (
                            <Check className="size-3.5 shrink-0 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state for search */}
        {!hasSearchResults && search.trim() && (
          <div className="rounded-lg border border-neutral-200 py-6 text-center">
            <p className="text-sm text-neutral-500">
              No amenities match &ldquo;{search}&rdquo;
            </p>
            <button
              type="button"
              onClick={addCustom}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
            >
              {(() => {
                const iconKey = suggestAmenityIcon(search.trim());
                if (!iconKey) return null;
                const Icon = getAmenityIcon(iconKey);
                return <Icon className="size-4 text-neutral-400" />;
              })()}
              Add &ldquo;{search.trim()}&rdquo;
            </button>
          </div>
        )}
      </div>

      {/* Selection summary */}
      <p className="text-xs text-neutral-400">
        {totalSelected > 0
          ? `${totalSelected} amenit${totalSelected === 1 ? "y" : "ies"} selected`
          : "No amenities selected"}
      </p>
    </div>
  );
}
