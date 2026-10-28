import React from "react";
import logoIcon from "@/assets/logo-icon.png";
import logoFull from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export interface DrChemLogoProps {
  /** Size preset */
  size?: "sm" | "md" | "lg" | "xl";
  /** If true, renders the icon badge with text beside it */
  showText?: boolean;
  /** Subtitle to show below the title, e.g. 'Virtual Chemistry Lab' */
  subtitle?: string | React.ReactNode;
  /** Render full combined logo image */
  variant?: "badge" | "plain-icon" | "full";
  /** Optional custom class name */
  className?: string;
  /** Custom class name for icon box */
  iconClassName?: string;
  /** Custom class name for text */
  textClassName?: string;
}

const sizeMap = {
  sm: {
    box: "h-8 w-8 rounded-lg",
    img: "h-6 w-6",
    title: "text-sm font-bold",
    sub: "text-[9px]",
  },
  md: {
    box: "h-10 w-10 rounded-xl",
    img: "h-8 w-8",
    title: "text-base font-extrabold md:text-lg",
    sub: "text-[10px] md:text-xs",
  },
  lg: {
    box: "h-12 w-12 rounded-2xl",
    img: "h-10 w-10",
    title: "text-xl font-extrabold",
    sub: "text-xs",
  },
  xl: {
    box: "h-16 w-16 rounded-2xl",
    img: "h-14 w-14",
    title: "text-2xl font-black",
    sub: "text-sm",
  },
};

export function DrChemLogo({
  size = "md",
  showText = false,
  subtitle,
  variant = "badge",
  className,
  iconClassName,
  textClassName,
}: DrChemLogoProps) {
  const s = sizeMap[size];

  if (variant === "full") {
    return (
      <img
        src={logoFull}
        alt="Dr. Chem"
        className={cn("h-auto w-auto object-contain drop-shadow-sm", className)}
      />
    );
  }

  const iconElement =
    variant === "badge" ? (
      <div
        className={cn(
          "grid place-items-center bg-gradient-to-br from-cyan-500/15 via-teal-500/10 to-emerald-500/15 border border-cyan-500/25 shadow-sm shadow-cyan-500/10 backdrop-blur-sm transition-transform hover:scale-105",
          s.box,
          iconClassName,
        )}
      >
        <img
          src={logoIcon}
          alt="Dr. Chem Logo"
          className={cn("object-contain drop-shadow-sm", s.img)}
        />
      </div>
    ) : (
      <img
        src={logoIcon}
        alt="Dr. Chem Logo"
        className={cn("object-contain drop-shadow-sm", s.img, iconClassName)}
      />
    );

  if (!showText) {
    return iconElement;
  }

  return (
    <div className={cn("flex items-center gap-2.5 sm:gap-3", className)}>
      {iconElement}
      <div className={cn("leading-tight", textClassName)}>
        <div className={cn("tracking-tight text-foreground", s.title)}>Dr. Chem</div>
        {subtitle && <div className={cn("text-muted-foreground", s.sub)}>{subtitle}</div>}
      </div>
    </div>
  );
}

export default DrChemLogo;
