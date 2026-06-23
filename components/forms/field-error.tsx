import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function FieldError({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className={cn(
        "mt-1 flex items-center gap-1 text-xs text-destructive",
        className
      )}
    >
      <AlertCircle className="size-3 shrink-0" />
      {children}
    </p>
  );
}
