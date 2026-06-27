import { cn } from "@/lib/utils";

type FormRowProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Shared grid row for aligned dashboard form fields.
 * Wraps children in a responsive grid with consistent gap.
 * Each child should be a `<div className="space-y-1.5">` field wrapper.
 */
export function FormRow({ children, className }: FormRowProps) {
  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-end",
        className
      )}
    >
      {children}
    </div>
  );
}
