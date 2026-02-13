"use client";

import { cn } from "@/lib/cn";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, UserPlus, Users, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, IconButton, Spinner } from "@/components/ui";
import { createDirectConversation, createGroupConversation } from "@/lib/actions/conversations";
import type { Profile } from "@/lib/types";

type SearchResult = Pick<Profile, "id" | "display_name" | "avatar_url" | "is_online" | "status_text">;

type NewConversationSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function NewConversationSheet({ open, onClose }: NewConversationSheetProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"search" | "group">("search");
  const [selectedUsers, setSelectedUsers] = useState<SearchResult[]>([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch all contacts from the API
  async function fetchContacts(query: string = "") {
    setLoading(true);
    setError(null);
    try {
      const url = query
        ? `/api/users/search?q=${encodeURIComponent(query)}`
        : "/api/users/search";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      const json = await res.json();
      setResults(json.data ?? []);
    } catch {
      setError("Failed to load contacts");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  // Load contacts when the sheet opens, focus input
  useEffect(() => {
    if (open) {
      fetchContacts();
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
    // Reset state when closing
    setSearch("");
    setResults([]);
    setError(null);
    setMode("search");
    setSelectedUsers([]);
    setGroupName("");
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape to close
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setError(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the search — when cleared, reload all contacts
    debounceRef.current = setTimeout(() => {
      fetchContacts(value.trim());
    }, value.trim() ? 300 : 0);
  }

  async function handleSelectUser(user: SearchResult) {
    if (mode === "group") {
      // Toggle selection for group
      setSelectedUsers((prev) => {
        const exists = prev.find((u) => u.id === user.id);
        if (exists) {
          return prev.filter((u) => u.id !== user.id);
        }
        return [...prev, user];
      });
      return;
    }

    // Direct message — create conversation and navigate
    setCreating(true);
    try {
      const result = await createDirectConversation(user.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
      // Navigate and refresh so the layout re-fetches conversations
      router.push(`/messages/${result.conversationId}`);
      router.refresh();
    } catch {
      setError("Failed to create conversation");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateGroup() {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    setCreating(true);
    try {
      const result = await createGroupConversation(
        groupName.trim(),
        selectedUsers.map((u) => u.id)
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.push(`/messages/${result.conversationId}`);
    } catch {
      setError("Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  function isSelected(userId: string): boolean {
    return selectedUsers.some((u) => u.id === userId);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="New conversation"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50",
              "h-[85dvh] lg:left-auto lg:right-0 lg:top-0 lg:bottom-0 lg:h-full lg:w-[400px]",
              "rounded-t-2xl lg:rounded-none",
              "bg-bg-secondary",
              "flex flex-col",
              "safe-bottom"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
              {mode === "group" ? (
                <IconButton
                  icon={ArrowLeft}
                  label="Back to search"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setMode("search");
                    setSelectedUsers([]);
                    setGroupName("");
                  }}
                />
              ) : (
                <div className="w-8" />
              )}
              <h2 className="flex-1 text-center text-md font-semibold text-text-primary">
                {mode === "group" ? "New Group" : "New Message"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Group name input (only in group mode) */}
            {mode === "group" && (
              <div className="border-b border-border-subtle px-4 py-3">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name"
                  className={cn(
                    "w-full rounded-lg bg-bg-input px-3 py-2.5",
                    "text-base text-text-primary placeholder:text-text-tertiary",
                    "outline-none focus:ring-1 focus:ring-accent/50"
                  )}
                />

                {/* Selected users chips */}
                {selectedUsers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() =>
                          setSelectedUsers((prev) =>
                            prev.filter((u) => u.id !== user.id)
                          )
                        }
                        className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                      >
                        <Avatar
                          src={user.avatar_url}
                          displayName={user.display_name}
                          userId={user.id}
                          size="xs"
                        />
                        {user.display_name}
                        <X size={12} strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search input */}
            <div className="px-4 py-3">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg bg-bg-input px-3 py-2",
                  "transition-colors duration-[var(--duration-fast)]"
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
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search people..."
                  className={cn(
                    "flex-1 bg-transparent text-sm text-text-primary",
                    "placeholder:text-text-tertiary",
                    "outline-none"
                  )}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      fetchContacts();
                      inputRef.current?.focus();
                    }}
                    className="shrink-0 rounded-full p-0.5 text-text-tertiary hover:text-text-primary"
                    aria-label="Clear search"
                  >
                    <X size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>

            {/* Mode toggle (only in search mode) */}
            {mode === "search" && !search && (
              <div className="px-4 pb-2">
                <button
                  type="button"
                  onClick={() => setMode("group")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3",
                    "text-left transition-colors",
                    "hover:bg-bg-tertiary/50"
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <Users size={20} strokeWidth={1.5} className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      New Group
                    </p>
                    <p className="text-xs text-text-tertiary">
                      Create a group with multiple people
                    </p>
                  </div>
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-4 pb-2">
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              </div>
            )}

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-2">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <UserPlus
                    size={32}
                    strokeWidth={1.5}
                    className="mb-3 text-text-tertiary"
                  />
                  <p className="text-sm text-text-tertiary">
                    {search
                      ? `No users found for "${search}"`
                      : "No other users found"}
                  </p>
                  {!search && (
                    <p className="mt-1 text-xs text-text-tertiary">
                      Other people need to sign up before you can message them
                    </p>
                  )}
                </div>
              )}

              {/* Section label */}
              {!loading && results.length > 0 && (
                <div className="px-2 pt-1 pb-2">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    {search ? "Results" : "All Contacts"}
                  </p>
                </div>
              )}

              {!loading &&
                results.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    disabled={creating}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
                      "text-left transition-colors",
                      "hover:bg-bg-tertiary/50",
                      "disabled:opacity-50",
                      mode === "group" && isSelected(user.id) && "bg-accent/5"
                    )}
                  >
                    <Avatar
                      src={user.avatar_url}
                      displayName={user.display_name}
                      userId={user.id}
                      size="md"
                      isOnline={user.is_online}
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {user.display_name}
                      </p>
                      {user.status_text && (
                        <p className="truncate text-xs text-text-tertiary">
                          {user.status_text}
                        </p>
                      )}
                    </div>
                    {mode === "group" && isSelected(user.id) && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                        <svg
                          viewBox="0 0 16 16"
                          className="h-3 w-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
            </div>

            {/* Group create button */}
            {mode === "group" && selectedUsers.length > 0 && (
              <div className="border-t border-border-subtle px-4 py-3 safe-bottom">
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || creating}
                  className={cn(
                    "flex w-full items-center justify-center rounded-xl",
                    "bg-accent px-4 py-3",
                    "text-base font-medium text-white",
                    "transition-colors hover:bg-accent-hover",
                    "disabled:opacity-50"
                  )}
                >
                  {creating ? (
                    <Spinner size="sm" />
                  ) : (
                    `Create Group (${selectedUsers.length} ${selectedUsers.length === 1 ? "person" : "people"})`
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
