import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** Link href — omit to render as a plain div */
  href?: string;
  /** Show the icon image alongside the wordmark (default: true) */
  showIcon?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Extra class names */
  className?: string;
  /** Use white-on-transparent version for dark/coloured backgrounds */
  white?: boolean;
};

const iconSizes = {
  sm: { icon: 28, font: "text-base", gap: "gap-2" },
  md: { icon: 36, font: "text-lg", gap: "gap-2.5" },
  lg: { icon: 44, font: "text-2xl", gap: "gap-3" },
} as const;

export function TanhweLogo({
  href,
  showIcon = true,
  size = "md",
  className,
  white = false,
}: LogoProps) {
  const s = iconSizes[size];

  const content = (
    <div className={cn("flex items-center", s.gap, className)}>
      {showIcon && (
        <Image
          src={white ? "/tanhwe white.webp" : "/tanhwe-icon.webp"}
          alt=""
          width={s.icon}
          height={s.icon}
          className="shrink-0"
          aria-hidden="true"
        />
      )}
      <div className="flex items-baseline gap-1.5 leading-none">
        <span
          className={cn(
            "font-extrabold tracking-tight",
            white ? "text-white" : "text-primary",
            s.font
          )}
        >
          TANHWE
        </span>
        <span
          className={cn(
            "font-semibold tracking-wide",
            white ? "text-white/70" : "text-muted-foreground",
            size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm"
          )}
        >
          GUEST HOUSE
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0 hover:opacity-85 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
