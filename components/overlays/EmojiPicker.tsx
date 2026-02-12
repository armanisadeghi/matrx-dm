"use client";

import { cn } from "@/lib/cn";
import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

const CATEGORIES = [
  {
    name: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "🥹", "😅", "🤣", "😂", "🙂",
      "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲",
      "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔",
      "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒", "🙄",
      "😬", "🤥", "🫨", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒",
    ],
  },
  {
    name: "Gestures",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "🫷",
      "🫸", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙",
      "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊",
      "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏",
    ],
  },
  {
    name: "Hearts",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟",
    ],
  },
  {
    name: "Objects",
    emojis: [
      "🔥", "⭐", "💫", "✨", "🌟", "💥", "💢", "💯", "🎉", "🎊",
      "🏆", "🎯", "💡", "📱", "💻", "🎮", "🎵", "🎶", "📸", "🎬",
    ],
  },
] as const;

const RECENT_KEY = "matrx-dm-recent-emojis";
const MAX_RECENT = 20;

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
};

export function EmojiPicker({ onSelect, onClose, className }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(RECENT_KEY) : null;
      if (stored) return JSON.parse(stored) as string[];
    } catch {
      // localStorage unavailable
    }
    return [];
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  function handleSelect(emoji: string) {
    onSelect(emoji);

    const updated = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(
      0,
      MAX_RECENT
    );
    setRecentEmojis(updated);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // localStorage unavailable
    }
  }

  const filteredCategories = search ? CATEGORIES : CATEGORIES;

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-[320px] rounded-xl shadow-xl glass",
        "animate-spring-scale origin-bottom",
        "overflow-hidden",
        className
      )}
    >
      {/* Search */}
      <div className="flex items-center gap-2 border-b border-glass-border px-3 py-2">
        <Search size={16} className="shrink-0 text-text-tertiary" strokeWidth={1.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emojis"
          className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-text-tertiary hover:text-text-primary"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="max-h-[280px] overflow-y-auto scrollbar-hide p-2">
        {/* Recent */}
        {!search && recentEmojis.length > 0 && (
          <div className="mb-2">
            <span className="mb-1 block px-1 text-xs font-medium text-text-tertiary">
              Recent
            </span>
            <div className="grid grid-cols-8 gap-0.5">
              {recentEmojis.map((emoji) => (
                <EmojiButton key={`recent-${emoji}`} emoji={emoji} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {filteredCategories.map((cat) => (
          <div key={cat.name} className="mb-2">
            <span className="mb-1 block px-1 text-xs font-medium text-text-tertiary">
              {cat.name}
            </span>
            <div className="grid grid-cols-8 gap-0.5">
              {cat.emojis.map((emoji) => (
                <EmojiButton key={`${cat.name}-${emoji}`} emoji={emoji} onSelect={handleSelect} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex items-center border-t border-glass-border px-1 py-1">
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(idx)}
              className={cn(
                "flex-1 rounded-md py-1 text-center text-xs",
                "cursor-pointer transition-colors",
                activeCategory === idx
                  ? "bg-bg-tertiary text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              {cat.emojis[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmojiButton({
  emoji,
  onSelect,
}: {
  emoji: string;
  onSelect: (emoji: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(emoji)}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-lg",
        "cursor-pointer transition-colors hover:bg-bg-tertiary/50"
      )}
    >
      {emoji}
    </button>
  );
}
