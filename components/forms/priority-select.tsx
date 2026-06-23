"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Priority = "low" | "normal" | "high" | "urgent";

const priorityMeta: Record<Priority, { label: string; dot: string }> = {
  low: { label: "Low", dot: "bg-blue-400" },
  normal: { label: "Normal", dot: "bg-neutral-400" },
  high: { label: "High", dot: "bg-amber-500" },
  urgent: { label: "Urgent", dot: "bg-red-500" },
};

const priorities = Object.entries(priorityMeta) as [Priority, typeof priorityMeta[Priority]][];

type PrioritySelectProps = {
  value: Priority | string;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function PrioritySelect({
  value,
  onValueChange,
  disabled,
  className,
  id,
}: PrioritySelectProps) {
  const current = priorityMeta[value as Priority];

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={cn("h-9 w-full", className)}>
        <SelectValue placeholder="Select priority">
          {current && (
            <span className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", current.dot)} />
              {current.label}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {priorities.map(([key, meta]) => (
          <SelectItem key={key} value={key}>
            <span className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", meta.dot)} />
              {meta.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
