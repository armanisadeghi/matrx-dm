"use client";

import { cn } from "@/lib/cn";
import { Search, X } from "lucide-react";
import { useRef, useState, useImperativeHandle, type Ref } from "react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  ref?: Ref<HTMLInputElement>;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "Search",
  className,
  ref,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Expose the internal input ref via the forwarded ref
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  function handleClear() {
    onChange("");
    inputRef.current?.focus();
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg bg-bg-input px-3 py-2",
        "transition-colors duration-[var(--duration-fast)]",
        focused && "ring-1 ring-accent/50",
        className
      )}
    >
      <Search
        size={16}
        strokeWidth={1.5}
        className="shrink-0 text-text-tertiary"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent text-sm text-text-primary",
          "placeholder:text-text-tertiary",
          "outline-none"
        )}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 rounded-full p-0.5 text-text-tertiary hover:text-text-primary"
          aria-label="Clear search"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
