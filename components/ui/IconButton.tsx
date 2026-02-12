import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import type { ComponentPropsWithRef } from "react";

type IconButtonVariant = "ghost" | "subtle" | "solid";
type IconButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<IconButtonVariant, string> = {
  ghost: "hover:bg-bg-tertiary/50 active:bg-bg-tertiary",
  subtle: "bg-bg-secondary hover:bg-bg-tertiary active:bg-bg-elevated",
  solid: "bg-accent text-white hover:bg-accent-hover active:opacity-90",
};

const sizeStyles: Record<IconButtonSize, { button: string; icon: number }> = {
  sm: { button: "h-8 w-8", icon: 16 },
  md: { button: "h-10 w-10", icon: 20 },
  lg: { button: "h-12 w-12", icon: 24 },
};

type IconButtonProps = ComponentPropsWithRef<"button"> & {
  icon: LucideIcon;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  label: string;
};

export function IconButton({
  icon: Icon,
  variant = "ghost",
  size = "md",
  label,
  className,
  ref,
  ...props
}: IconButtonProps) {
  const s = sizeStyles[size];

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "min-h-[44px] min-w-[44px]",
        "cursor-pointer transition-colors duration-[var(--duration-fast)]",
        "text-text-secondary hover:text-text-primary",
        "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-40",
        variantStyles[variant],
        s.button,
        className
      )}
      {...props}
    >
      <Icon size={s.icon} strokeWidth={1.5} />
    </button>
  );
}
