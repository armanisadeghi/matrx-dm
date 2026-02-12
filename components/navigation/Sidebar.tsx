"use client";

import { cn } from "@/lib/cn";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { SquarePen } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { IconButton } from "@/components/ui";
import { ConversationListItem } from "@/components/messaging/ConversationListItem";
import { NewConversationSheet } from "@/components/messaging/NewConversationSheet";
import {
  ContextMenu,
  useContextMenu,
  type ContextMenuSection,
} from "@/components/overlays/ContextMenu";
import {
  Pin,
  BellOff,
  MailOpen,
  Trash2,
} from "lucide-react";
import type { ConversationWithDetails, ConversationFilter } from "@/lib/types";
import {
  togglePin,
  toggleMute,
  deleteConversation,
} from "@/lib/actions/conversations";

type SidebarProps = {
  conversations: ConversationWithDetails[];
  className?: string;
};

const FILTERS: { label: string; value: ConversationFilter }[] = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Groups", value: "groups" },
];

export function Sidebar({ conversations, className }: SidebarProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [newConvOpen, setNewConvOpen] = useState(false);
  const router = useRouter();
  const params = useParams();
  const activeId = params?.conversationId as string | undefined;
  const contextMenu = useContextMenu<ConversationWithDetails>();
  const searchBarRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts: Cmd+N for new conversation, Cmd+K for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "n") {
        e.preventDefault();
        setNewConvOpen(true);
      }

      if (mod && e.key === "k") {
        e.preventDefault();
        searchBarRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = conversations.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      const name = (c.conversation_name ?? "").toLowerCase();
      const preview = (c.last_message_content ?? "").toLowerCase();
      if (!name.includes(q) && !preview.includes(q)) return false;
    }

    if (filter === "unread" && c.unread_count === 0) return false;
    if (filter === "groups" && c.conversation_type !== "group") return false;

    return true;
  });

  const pinned = filtered.filter((c) => c.is_pinned);
  const unpinned = filtered.filter((c) => !c.is_pinned);

  function getContextMenuSections(
    conv: ConversationWithDetails
  ): ContextMenuSection[] {
    return [
      {
        items: [
          {
            label: conv.is_pinned ? "Unpin" : "Pin",
            icon: Pin,
            onClick: () => togglePin(conv.conversation_id),
          },
          {
            label: conv.is_muted ? "Unmute" : "Mute",
            icon: BellOff,
            onClick: () => toggleMute(conv.conversation_id),
          },
          {
            label: "Mark as Read",
            icon: MailOpen,
            onClick: () => {
              /* handled by markRead */
            },
          },
        ],
      },
      {
        items: [
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: () => deleteConversation(conv.conversation_id),
          },
        ],
      },
    ];
  }

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col bg-bg-primary lg:w-[320px] lg:border-r lg:border-border-subtle",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 safe-top">
        <h2 className="text-xl font-semibold text-text-primary">Messages</h2>
        <IconButton
          icon={SquarePen}
          label="New conversation"
          size="sm"
          variant="ghost"
          onClick={() => setNewConvOpen(true)}
        />
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <SearchBar ref={searchBarRef} value={search} onChange={setSearch} />
      </div>

      {/* Filters */}
      <div className="flex gap-1 px-4 pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              "cursor-pointer transition-colors duration-[var(--duration-fast)]",
              filter === f.value
                ? "bg-accent text-white"
                : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
        {/* Pinned section */}
        {pinned.length > 0 && (
          <div className="mb-1">
            <span className="px-2 text-xs font-medium text-text-tertiary">
              Pinned
            </span>
            {pinned.map((c) => (
              <ConversationListItem
                key={c.conversation_id}
                conversation={c}
                isActive={activeId === c.conversation_id}
                onClick={() =>
                  router.push(`/messages/${c.conversation_id}`)
                }
                onContextMenu={(e) => contextMenu.open(e, c)}
              />
            ))}
          </div>
        )}

        {/* All conversations */}
        {unpinned.map((c) => (
          <ConversationListItem
            key={c.conversation_id}
            conversation={c}
            isActive={activeId === c.conversation_id}
            onClick={() =>
              router.push(`/messages/${c.conversation_id}`)
            }
            onContextMenu={(e) => contextMenu.open(e, c)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-text-tertiary">
              {search ? "No conversations found" : "No conversations yet"}
            </p>
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu.target && (
        <ContextMenu
          sections={getContextMenuSections(
            contextMenu.target as ConversationWithDetails
          )}
          position={contextMenu.position}
          onClose={contextMenu.close}
        />
      )}

      {/* New conversation sheet */}
      <NewConversationSheet
        open={newConvOpen}
        onClose={() => setNewConvOpen(false)}
      />
    </aside>
  );
}
