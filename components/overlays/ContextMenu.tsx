"use client";

import { cn } from "@/lib/cn";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

export type ContextMenuItem = {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

export type ContextMenuSection = {
  items: ContextMenuItem[];
};

type ContextMenuProps = {
  sections: ContextMenuSection[];
  position: { x: number; y: number } | null;
  onClose: () => void;
};

// ── Hook ────────────────────────────────────────────────────────────────────

export function useContextMenu<T = unknown>() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [target, setTarget] = useState<T | null>(null);

  function open(e: React.MouseEvent, data?: T) {
    e.preventDefault();
    e.stopPropagation();
    setPosition({ x: e.clientX, y: e.clientY });
    setTarget(data ?? null);
  }

  function close() {
    setPosition(null);
    setTarget(null);
  }

  return { position, target, open, close };
}

// ── Component ───────────────────────────────────────────────────────────────

export function ContextMenu({ sections, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);

  const allItems = sections.flatMap((s) => s.items);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!position) return;

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((prev) => {
          const next = prev + 1;
          return next >= allItems.length ? 0 : next;
        });
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? allItems.length - 1 : next;
        });
      }

      if (e.key === "Enter" && focusIndex >= 0) {
        e.preventDefault();
        const item = allItems[focusIndex];
        if (item && !item.disabled) {
          item.onClick();
          onClose();
        }
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [position, onClose, allItems, focusIndex]);

  useEffect(() => {
    if (!position || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = position.x;
    let y = position.y;

    if (x + rect.width > vw) x = vw - rect.width - 8;
    if (y + rect.height > vh) y = vh - rect.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }, [position]);

  if (!position || !mounted) return null;

  let globalIndex = 0;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className={cn(
        "fixed z-50 min-w-[200px] rounded-2xl py-2 shadow-2xl",
        "glass animate-spring-scale",
        "origin-top-left"
      )}
      style={{ left: position.x, top: position.y }}
    >
      {sections.map((section, sIdx) => (
        <div key={sIdx}>
          {sIdx > 0 && <div className="my-1 h-px bg-border-subtle" />}
          {section.items.map((item) => {
            const idx = globalIndex++;
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm",
                  "cursor-pointer transition-colors duration-[var(--duration-fast)]",
                  item.destructive
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-text-primary hover:bg-bg-tertiary/50",
                  item.disabled && "pointer-events-none opacity-40",
                  focusIndex === idx && "bg-bg-tertiary/50"
                )}
              >
                {Icon && (
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    className={item.destructive ? "text-destructive" : "text-text-secondary"}
                  />
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>,
    document.body
  );
}
