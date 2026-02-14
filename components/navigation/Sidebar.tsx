"use client";

import { cn } from "@/lib/cn";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { SquarePen, SlidersHorizontal, Check } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { Avatar, IconButton } from "@/components/ui";
import { ConversationListItem } from "@/components/messaging/ConversationListItem";
import { NewConversationSheet } from "@/components/messaging/NewConversationSheet";
import { GroupManagementSheet } from "@/components/messaging/GroupManagementSheet";
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
  ExternalLink,
  Settings,
  Users,
  UserCircle,
} from "lucide-react";
import type { ConversationWithDetails, ConversationFilter } from "@/lib/types";
import {
  togglePin,
  toggleMute,
  deleteConversation,
} from "@/lib/actions/conversations";
import { useConversations } from "@/app/(app)/messages/conversations-context";

type SidebarProps = {
  conversations: ConversationWithDetails[];
  className?: string;
};

const FILTERS: { label: string; value: ConversationFilter }[] = [
  { label: "All Messages", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Groups", value: "groups" },
];

export function Sidebar({ conversations, className }: SidebarProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [selectedGroupForSettings, setSelectedGroupForSettings] = useState<ConversationWithDetails | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const activeId = params?.conversationId as string | undefined;
  const contextMenu = useContextMenu<ConversationWithDetails>();
  const searchBarRef = useRef<HTMLInputElement>(null);
  const { removeConversation } = useConversations();

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

  // Listen for custom events from other pages (e.g. conversation-not-found)
  useEffect(() => {
    function handleOpenNewConversation() {
      setNewConvOpen(true);
    }
    function handleFocusSearch() {
      searchBarRef.current?.focus();
    }

    window.addEventListener("open-new-conversation", handleOpenNewConversation);
    window.addEventListener("focus-search", handleFocusSearch);
    return () => {
      window.removeEventListener(
        "open-new-conversation",
        handleOpenNewConversation
      );
      window.removeEventListener("focus-search", handleFocusSearch);
    };
  }, []);

  // Close filter menu on outside click
  useEffect(() => {
    if (!filterMenuOpen) return;

    function handleClick(e: MouseEvent) {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(e.target as Node)
      ) {
        setFilterMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setFilterMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [filterMenuOpen]);

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

  // Limit pinned avatars to 3
  const pinnedAvatars = pinned.slice(0, 3);

  async function handleDelete(conversationId: string) {
    // Optimistic: remove from sidebar immediately
    removeConversation(conversationId);

    // If we're viewing the deleted conversation, navigate away
    if (activeId === conversationId) {
      router.replace("/messages");
    }

    // Fire-and-forget server cleanup
    deleteConversation(conversationId);
  }

  function getContextMenuSections(
    conv: ConversationWithDetails
  ): ContextMenuSection[] {
    const sections: ContextMenuSection[] = [
      {
        items: [
          {
            label: conv.is_pinned ? "Unpin" : "Pin",
            icon: Pin,
            onClick: () => togglePin(conv.conversation_id),
          },
          {
            label: "Mark as Read",
            icon: MailOpen,
            onClick: () => {
              /* handled by markRead */
            },
          },
          {
            label: conv.is_muted ? "Unmute" : "Hide Alerts",
            icon: BellOff,
            onClick: () => toggleMute(conv.conversation_id),
          },
        ],
      },
    ];

    // Add Group Settings option for groups only
    if (conv.conversation_type === "group") {
      sections.push({
        items: [
          {
            label: "Group Settings",
            icon: Settings,
            onClick: () => {
              setSelectedGroupForSettings(conv);
              setGroupSettingsOpen(true);
            },
          },
        ],
      });
    }

    // Add View Contact option for direct conversations
    if (conv.conversation_type === "direct") {
      sections.push({
        items: [
          {
            label: "View Contact",
            icon: UserCircle,
            onClick: () => {
              router.push("/contacts");
            },
          },
        ],
      });
    }

    sections.push(
      {
        items: [
          {
            label: "Open in New Window",
            icon: ExternalLink,
            onClick: () => {
              window.open(`/messages/${conv.conversation_id}`, "_blank");
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
            onClick: () => handleDelete(conv.conversation_id),
          },
        ],
      }
    );

    return sections;
  }

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col bg-bg-primary sm:w-[280px] sm:border-r sm:border-border-subtle",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 safe-top">
        {/* Left: Filter icon */}
        <div className="relative" ref={filterMenuRef}>
          <IconButton
            icon={SlidersHorizontal}
            label="Filter conversations"
            size="sm"
            variant="ghost"
            onClick={() => setFilterMenuOpen((prev) => !prev)}
            className={filter !== "all" ? "text-accent" : undefined}
          />

          {/* Filter dropdown */}
          {filterMenuOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 min-w-[180px] rounded-2xl py-1.5 shadow-2xl glass animate-spring-scale origin-top-left">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => {
                    setFilter(f.value);
                    setFilterMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-sm",
                    "cursor-pointer transition-colors duration-[var(--duration-fast)]",
                    "text-text-primary hover:bg-bg-tertiary/50"
                  )}
                >
                  {f.label}
                  {filter === f.value && (
                    <Check
                      size={16}
                      strokeWidth={2}
                      className="text-accent"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <h2 className="text-xl font-semibold text-text-primary">Messages</h2>

        {/* Right: New conversation */}
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

      {/* Pinned avatars row */}
      {pinnedAvatars.length > 0 && (
        <div className="flex items-center justify-center gap-5 border-b border-border-subtle px-4 pb-3 pt-1">
          {pinnedAvatars.map((c) => {
            const displayName =
              c.conversation_name || "Unknown";
            return (
              <button
                key={c.conversation_id}
                type="button"
                onClick={() =>
                  router.push(`/messages/${c.conversation_id}`)
                }
                onContextMenu={(e) => contextMenu.open(e, c)}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1",
                  "transition-transform duration-[var(--duration-fast)] active:scale-95"
                )}
              >
                <Avatar
                  src={c.conversation_avatar_url}
                  displayName={displayName}
                  userId={c.conversation_id}
                  size="lg"
                />
                <span className="max-w-[56px] truncate text-[10px] text-text-secondary">
                  {displayName.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
        {/* Show pinned conversations beyond the first 3 (4th, 5th, etc.) */}
        {pinned.slice(3).map((c) => (
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

        {/* Then show all unpinned conversations */}
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

      {/* Group management sheet */}
      {selectedGroupForSettings && (
        <GroupManagementSheet
          open={groupSettingsOpen}
          onClose={() => {
            setGroupSettingsOpen(false);
            setSelectedGroupForSettings(null);
          }}
          conversationId={selectedGroupForSettings.conversation_id}
          conversationName={selectedGroupForSettings.conversation_name || "Group"}
          conversationAvatar={selectedGroupForSettings.conversation_avatar_url}
        />
      )}

      {/* Bottom navigation */}
      <div className="border-t border-border-subtle px-2 py-2 safe-bottom">
        <button
          type="button"
          onClick={() => router.push("/contacts")}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
            "text-left transition-colors",
            "text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary"
          )}
        >
          <Users size={18} strokeWidth={1.5} />
          <span className="text-sm font-medium">Contacts</span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/settings")}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
            "text-left transition-colors",
            "text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary"
          )}
        >
          <Settings size={18} strokeWidth={1.5} />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
}
