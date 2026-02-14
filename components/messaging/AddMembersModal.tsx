"use client";

import { cn } from "@/lib/cn";
import { useState, useRef, useEffect } from "react";
import { Search, X, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, Spinner } from "@/components/ui";
import type { Profile } from "@/lib/types";

type SearchResult = Pick<Profile, "id" | "display_name" | "avatar_url" | "is_online" | "status_text">;

type AddMembersModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (userIds: string[]) => void;
  existingMemberIds: string[];
};

export function AddMembersModal({
  open,
  onClose,
  onAdd,
  existingMemberIds,
}: AddMembersModalProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<SearchResult[]>([]);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      // Filter out existing members
      const filtered = (json.data ?? []).filter(
        (u: SearchResult) => !existingMemberIds.includes(u.id)
      );
      setResults(filtered);
    } catch {
      setError("Failed to load contacts");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      fetchContacts();
      setSelectedUsers([]);
      setSearch("");
      setError(null);
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open, existingMemberIds]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchContacts(value.trim());
    }, value.trim() ? 300 : 0);
  }

  function toggleUser(user: SearchResult) {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) return prev.filter((u) => u.id !== user.id);
      return [...prev, user];
    });
  }

  function isSelected(userId: string): boolean {
    return selectedUsers.some((u) => u.id === userId);
  }

  async function handleAdd() {
    if (selectedUsers.length === 0) return;
    setAdding(true);
    try {
      await onAdd(selectedUsers.map((u) => u.id));
    } finally {
      setAdding(false);
    }
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
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/50"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Add members"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "fixed inset-x-4 top-[10%] z-[60] mx-auto max-w-[400px]",
              "max-h-[70dvh] rounded-2xl",
              "bg-bg-secondary shadow-2xl",
              "flex flex-col"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <h3 className="text-md font-semibold text-text-primary">
                Add Members
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                aria-label="Close"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Selected chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 border-b border-border-subtle px-4 py-3">
                {selectedUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user)}
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

            {/* Search */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 rounded-lg bg-bg-input px-3 py-2">
                <Search size={16} strokeWidth={1.5} className="shrink-0 text-text-tertiary" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search people..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
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
                  <UserPlus size={32} strokeWidth={1.5} className="mb-3 text-text-tertiary" />
                  <p className="text-sm text-text-tertiary">
                    {search
                      ? `No users found for "${search}"`
                      : "No users available to add"}
                  </p>
                </div>
              )}

              {!loading &&
                results.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
                      "text-left transition-colors",
                      "hover:bg-bg-tertiary/50",
                      isSelected(user.id) && "bg-accent/5"
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
                    {isSelected(user.id) && (
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

            {/* Add button */}
            <div className="border-t border-border-subtle px-4 py-3">
              <button
                type="button"
                onClick={handleAdd}
                disabled={selectedUsers.length === 0 || adding}
                className={cn(
                  "flex w-full items-center justify-center rounded-xl",
                  "px-4 py-3",
                  "text-base font-medium",
                  "transition-all duration-200",
                  selectedUsers.length === 0 || adding
                    ? "bg-bg-tertiary text-text-tertiary cursor-not-allowed"
                    : "bg-accent text-white hover:bg-accent-hover active:scale-[0.98]"
                )}
              >
                {adding ? (
                  <Spinner size="sm" />
                ) : selectedUsers.length === 0 ? (
                  "Select people to add"
                ) : (
                  `Add ${selectedUsers.length} ${selectedUsers.length === 1 ? "member" : "members"}`
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
