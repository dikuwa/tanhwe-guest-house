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

const sizes = {
  sm: {
    icon: 34,
    main: "text-sm",
    sub: "text-[9px]",
    tracking: "tracking-[.12em]",
    gap: "gap-2.5",
  },
  md: {
    icon: 44,
    main: "text-lg",
    sub: "text-[11px]",
    tracking: "tracking-[.14em]",
    gap: "gap-3",
  },
  lg: {
    icon: 56,
    main: "text-2xl",
    sub: "text-[13px]",
    tracking: "tracking-[.16em]",
    gap: "gap-3.5",
  },
} as const;

export function TanhweLogo({
  href,
  showIcon = true,
  size = "md",
  className,
  white = false,
}: LogoProps) {
  const s = sizes[size];

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
      <div className="leading-none">
        <p
          className={cn(
            "font-extrabold tracking-tight",
            white ? "text-white" : "text-primary",
            s.main
          )}
        >
          TANHWE
        </p>
        <p
          className={cn(
            "mt-px font-semibold",
            white ? "text-white/80" : "text-secondary",
            s.sub,
            s.tracking
          )}
        >
          GUEST HOUSE
        </p>
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
