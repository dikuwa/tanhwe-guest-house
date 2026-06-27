import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type FormLabelWithIconProps = {
  icon: LucideIcon;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
};

export function FormLabelWithIcon({
  icon: Icon,
  children,
  htmlFor,
  className,
}: FormLabelWithIconProps) {
  return (
    <Label
      htmlFor={htmlFor}
      className={cn("flex items-center gap-1.5 text-sm font-medium", className)}
    >
      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      <span>{children}</span>
    </Label>
  );
}
