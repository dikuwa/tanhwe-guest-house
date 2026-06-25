import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  white?: boolean;
};

const sizes = {
  sm: { width: 120, main: "text-sm", sub: "text-[9px]" },
  md: { width: 150, main: "text-lg", sub: "text-[11px]" },
  lg: { width: 190, main: "text-2xl", sub: "text-[13px]" },
} as const;

export function TanhweLogo({
  href,
  showIcon = true,
  size = "md",
  className,
  white = false,
}: LogoProps) {
  const s = sizes[size];

  const content = showIcon ? (
    <div className={cn("flex items-center", className)}>
      <Image
        src={white ? "/tanhwe-logo-white.svg" : "/tanhwe-logo.svg"}
        alt="Tanhwe Guest House"
        width={s.width}
        height={Math.round(s.width * (67.61 / 189.78))}
        className="shrink-0"
        priority
      />
    </div>
  ) : (
    <div className={cn("leading-none", className)}>
      <p className={cn("font-extrabold tracking-tight", white ? "text-white" : "text-primary", s.main)}>
        TANHWE
      </p>
      <p className={cn("mt-px font-semibold", white ? "text-white/80" : "text-secondary", s.sub, "tracking-[.14em]")}>
        GUEST HOUSE
      </p>
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
