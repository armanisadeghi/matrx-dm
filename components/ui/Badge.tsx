import { cn } from "@/lib/cn";

type BadgeProps = {
  count: number;
  className?: string;
};

export function Badge({ count, className }: BadgeProps) {
  if (count <= 0) return null;

  const display = count > 99 ? "" : String(count);
  const isDot = count > 99;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-accent font-semibold text-white animate-spring-scale",
        isDot
          ? "h-2.5 w-2.5"
          : count < 10
            ? "h-5 w-5 text-[10px]"
            : "h-5 min-w-5 px-1 text-[10px]",
        className
      )}
      aria-label={`${count} unread`}
    >
      {display}
    </span>
  );
}
