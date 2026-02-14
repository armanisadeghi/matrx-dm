"use client";

import { cn } from "@/lib/cn";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Star,
  UserPlus,
  MessageSquare,
  ChevronRight,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui";
import { ContactInfoSheet } from "./ContactInfoSheet";
import { upsertContact } from "@/lib/actions/contacts";
import type { ContactWithProfile } from "@/lib/types";

type Suggestion = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
};

type ContactListProps = {
  contacts: ContactWithProfile[];
  suggestions: Suggestion[];
};

export function ContactList({ contacts, suggestions }: ContactListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactWithProfile | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addingUser, setAddingUser] = useState<string | null>(null);

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (
      c.custom_name ?? c.nickname ?? c.profile.display_name
    ).toLowerCase();
    const company = (c.company ?? "").toLowerCase();
    const tags = (c.tags ?? []).join(" ").toLowerCase();
    return name.includes(q) || company.includes(q) || tags.includes(q);
  });

  const favorites = filtered.filter((c) => c.is_favorite);
  const others = filtered.filter((c) => !c.is_favorite);

  function getDisplayName(c: ContactWithProfile): string {
    return c.custom_name ?? c.profile.display_name;
  }

  async function handleAddContact(userId: string) {
    setAddingUser(userId);
    try {
      await upsertContact(userId, {});
      router.refresh();
    } catch {
      // Silently fail
    } finally {
      setAddingUser(null);
    }
  }

  return (
    <>
      {/* Header */}
      <div className="border-b border-border-subtle px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-text-primary">Contacts</h1>
          <span className="text-sm text-text-tertiary">
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg bg-bg-input px-3 py-2">
          <Search size={16} strokeWidth={1.5} className="shrink-0 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="shrink-0 rounded-full p-0.5 text-text-tertiary hover:text-text-primary"
              aria-label="Clear search"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Favorites section */}
        {favorites.length > 0 && (
          <div className="px-4 pt-4">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Star size={12} className="text-amber-500" fill="currentColor" />
              Favorites
            </p>
            <div className="space-y-0.5">
              {favorites.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  displayName={getDisplayName(c)}
                  onClick={() => {
                    setSelectedContact(c);
                    setSheetOpen(true);
                  }}
                  onMessage={() => router.push(`/messages`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All contacts */}
        {others.length > 0 && (
          <div className="px-4 pt-4">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Users size={12} />
              {favorites.length > 0 ? "Other Contacts" : "All Contacts"}
            </p>
            <div className="space-y-0.5">
              {others.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  displayName={getDisplayName(c)}
                  onClick={() => {
                    setSelectedContact(c);
                    setSheetOpen(true);
                  }}
                  onMessage={() => router.push(`/messages`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && !search && (
          <div className="px-4 pt-6 pb-4">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <UserPlus size={12} />
              Add to Contacts
            </p>
            <div className="space-y-0.5">
              {suggestions.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleAddContact(user.id)}
                  disabled={addingUser === user.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
                    "text-left transition-colors",
                    "hover:bg-bg-tertiary/50",
                    "disabled:opacity-50"
                  )}
                >
                  <Avatar
                    src={user.avatar_url}
                    displayName={user.display_name}
                    userId={user.id}
                    size="md"
                    isOnline={user.is_online}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {user.display_name}
                    </p>
                  </div>
                  <span className="text-xs text-accent font-medium">
                    {addingUser === user.id ? "Adding..." : "+ Add"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={40} strokeWidth={1.5} className="mb-3 text-text-tertiary" />
            <p className="text-sm text-text-tertiary">
              {search ? `No contacts matching "${search}"` : "No contacts yet"}
            </p>
            <p className="mt-1 text-xs text-text-tertiary">
              Start a conversation to add people to your contacts
            </p>
          </div>
        )}
      </div>

      {/* Contact detail sheet */}
      {selectedContact && (
        <ContactInfoSheet
          open={sheetOpen}
          onClose={() => {
            setSheetOpen(false);
            setSelectedContact(null);
          }}
          contact={selectedContact}
        />
      )}
    </>
  );
}

// ── Contact row sub-component ───────────────────────────────────────────────
function ContactRow({
  contact,
  displayName,
  onClick,
  onMessage,
}: {
  contact: ContactWithProfile;
  displayName: string;
  onClick: () => void;
  onMessage: () => void;
}) {
  const subtitle = contact.nickname
    ? `"${contact.nickname}"`
    : contact.company || contact.job_title || contact.profile.status_text;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
        "text-left transition-colors",
        "hover:bg-bg-tertiary/50"
      )}
    >
      <Avatar
        src={contact.custom_avatar_url ?? contact.profile.avatar_url}
        displayName={displayName}
        userId={contact.contact_user_id}
        size="md"
        isOnline={contact.profile.is_online}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-text-primary">
            {displayName}
          </p>
          {contact.is_favorite && (
            <Star size={12} className="text-amber-500 shrink-0" fill="currentColor" />
          )}
        </div>
        {subtitle && (
          <p className="truncate text-xs text-text-tertiary">
            {subtitle}
          </p>
        )}
      </div>
      <ChevronRight size={16} className="shrink-0 text-text-tertiary" />
    </button>
  );
}
