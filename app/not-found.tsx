import { cn } from "@/lib/cn";
import { MessageCircle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        {/* Icon */}
        <div
          className={cn(
            "mb-6 flex h-20 w-20 items-center justify-center rounded-full",
            "bg-bg-tertiary/60"
          )}
        >
          <MessageCircle
            size={36}
            strokeWidth={1.5}
            className="text-text-tertiary"
          />
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold text-text-primary">
          Page not found
        </h1>

        {/* Description */}
        <p className="mt-2 text-sm leading-relaxed text-text-tertiary">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Action */}
        <Link
          href="/messages"
          className={cn(
            "mt-8 flex items-center justify-center gap-2 rounded-xl",
            "bg-accent px-6 py-3",
            "text-sm font-medium text-white",
            "transition-colors duration-[var(--duration-fast)]",
            "hover:bg-accent-hover active:scale-[0.98]",
            "active:transition-transform"
          )}
        >
          Go to Messages
        </Link>
      </div>
    </div>
  );
}
