"use client";

import { cn } from "@/lib/cn";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Star,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building2,
  MapPin,
  Globe,
  Calendar,
  MessageSquare,
  Save,
  Loader2,
  Tag,
  StickyNote,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, Spinner } from "@/components/ui";
import { upsertContact, deleteContact, toggleFavorite } from "@/lib/actions/contacts";
import type { ContactWithProfile } from "@/lib/types";

type ContactInfoSheetProps = {
  open: boolean;
  onClose: () => void;
  contact: ContactWithProfile;
};

export function ContactInfoSheet({
  open,
  onClose,
  contact,
}: ContactInfoSheetProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [customName, setCustomName] = useState(contact.custom_name ?? "");
  const [nickname, setNickname] = useState(contact.nickname ?? "");
  const [phoneMobile, setPhoneMobile] = useState(contact.phone_mobile ?? "");
  const [phoneWork, setPhoneWork] = useState(contact.phone_work ?? "");
  const [emailPersonal, setEmailPersonal] = useState(contact.email_personal ?? "");
  const [emailWork, setEmailWork] = useState(contact.email_work ?? "");
  const [company, setCompany] = useState(contact.company ?? "");
  const [jobTitle, setJobTitle] = useState(contact.job_title ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [relationship, setRelationship] = useState(contact.relationship ?? "");

  const displayName = contact.custom_name ?? contact.profile.display_name;

  async function handleToggleFavorite() {
    try {
      await toggleFavorite(contact.contact_user_id);
      router.refresh();
    } catch {
      // Silently fail
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const result = await upsertContact(contact.contact_user_id, {
        custom_name: customName.trim() || null,
        nickname: nickname.trim() || null,
        phone_mobile: phoneMobile.trim() || null,
        phone_work: phoneWork.trim() || null,
        email_personal: emailPersonal.trim() || null,
        email_work: emailWork.trim() || null,
        company: company.trim() || null,
        job_title: jobTitle.trim() || null,
        notes: notes.trim() || null,
        relationship: relationship.trim() || null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    } catch {
      setError("Failed to save contact");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remove this contact from your address book?")) return;
    setDeleting(true);
    try {
      await deleteContact(contact.contact_user_id);
      onClose();
      router.refresh();
    } catch {
      setError("Failed to delete contact");
    } finally {
      setDeleting(false);
    }
  }

  const inputClass = cn(
    "w-full rounded-lg bg-bg-input px-3 py-2",
    "text-sm text-text-primary placeholder:text-text-tertiary",
    "outline-none focus:ring-2 focus:ring-accent/50"
  );

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
            aria-label="Contact details"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 bottom-0 z-50",
              "w-full sm:w-[420px]",
              "bg-bg-secondary",
              "flex flex-col",
              "safe-bottom"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
              <h2 className="text-md font-semibold text-text-primary">
                {editing ? "Edit Contact" : "Contact Info"}
              </h2>
              <div className="flex items-center gap-1">
                {!editing && (
                  <>
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      className="rounded-full p-1.5 text-text-secondary hover:text-amber-500 transition-colors"
                      aria-label="Toggle favorite"
                    >
                      <Star
                        size={18}
                        strokeWidth={1.5}
                        className={contact.is_favorite ? "text-amber-500" : ""}
                        fill={contact.is_favorite ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="rounded-full p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                      aria-label="Edit contact"
                    >
                      <Edit2 size={18} strokeWidth={1.5} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                  aria-label="Close"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 mt-4">
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Profile header */}
              <div className="flex flex-col items-center gap-3 px-4 py-6">
                <Avatar
                  src={contact.custom_avatar_url ?? contact.profile.avatar_url}
                  displayName={displayName}
                  userId={contact.contact_user_id}
                  size="xl"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {displayName}
                  </h3>
                  {contact.custom_name && contact.custom_name !== contact.profile.display_name && (
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Original: {contact.profile.display_name}
                    </p>
                  )}
                  {contact.nickname && !editing && (
                    <p className="text-sm text-text-secondary mt-0.5">
                      &ldquo;{contact.nickname}&rdquo;
                    </p>
                  )}
                  {contact.profile.status_text && (
                    <p className="text-sm text-text-tertiary mt-1">
                      {contact.profile.status_text}
                    </p>
                  )}
                </div>

                {/* Quick actions */}
                {!editing && (
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push("/messages");
                      }}
                      className="flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 transition-colors"
                    >
                      <MessageSquare size={16} strokeWidth={1.5} />
                      Message
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                /* Edit mode */
                <div className="px-4 space-y-4 pb-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      Custom Name
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder={contact.profile.display_name}
                      className={inputClass}
                    />
                    <p className="text-[10px] text-text-tertiary mt-1">
                      Override how this contact appears in your list
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      Nickname
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g. Buddy, Mom"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Phone (Mobile)
                      </label>
                      <input
                        type="tel"
                        value={phoneMobile}
                        onChange={(e) => setPhoneMobile(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Phone (Work)
                      </label>
                      <input
                        type="tel"
                        value={phoneWork}
                        onChange={(e) => setPhoneWork(e.target.value)}
                        placeholder="+1 (555) 765-4321"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Email (Personal)
                      </label>
                      <input
                        type="email"
                        value={emailPersonal}
                        onChange={(e) => setEmailPersonal(e.target.value)}
                        placeholder="email@example.com"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Email (Work)
                      </label>
                      <input
                        type="email"
                        value={emailWork}
                        onChange={(e) => setEmailWork(e.target.value)}
                        placeholder="email@company.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Company
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Acme Inc."
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Software Engineer"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      Relationship
                    </label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      <option value="friend">Friend</option>
                      <option value="family">Family</option>
                      <option value="colleague">Colleague</option>
                      <option value="client">Client</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Personal notes about this contact..."
                      rows={3}
                      className={cn(inputClass, "resize-none")}
                    />
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="px-4 space-y-4 pb-4">
                  {/* Phone numbers */}
                  {(contact.phone_mobile || contact.phone_work || contact.user_profile?.phone_primary) && (
                    <InfoSection icon={Phone} label="Phone">
                      {contact.phone_mobile && (
                        <InfoRow label="Mobile" value={contact.phone_mobile} />
                      )}
                      {contact.phone_work && (
                        <InfoRow label="Work" value={contact.phone_work} />
                      )}
                      {contact.user_profile?.phone_primary &&
                        contact.user_profile.show_phone &&
                        !contact.phone_mobile && (
                          <InfoRow label="Primary (from profile)" value={contact.user_profile.phone_primary} muted />
                        )}
                    </InfoSection>
                  )}

                  {/* Email */}
                  {(contact.email_personal || contact.email_work || contact.user_profile?.email_primary) && (
                    <InfoSection icon={Mail} label="Email">
                      {contact.email_personal && (
                        <InfoRow label="Personal" value={contact.email_personal} />
                      )}
                      {contact.email_work && (
                        <InfoRow label="Work" value={contact.email_work} />
                      )}
                      {contact.user_profile?.email_primary &&
                        contact.user_profile.show_email &&
                        !contact.email_personal && (
                          <InfoRow label="Primary (from profile)" value={contact.user_profile.email_primary} muted />
                        )}
                    </InfoSection>
                  )}

                  {/* Organization */}
                  {(contact.company || contact.job_title || contact.user_profile?.company) && (
                    <InfoSection icon={Building2} label="Organization">
                      {(contact.company || contact.user_profile?.company) && (
                        <InfoRow label="Company" value={contact.company ?? contact.user_profile?.company ?? ""} muted={!contact.company} />
                      )}
                      {(contact.job_title || contact.user_profile?.title) && (
                        <InfoRow label="Title" value={contact.job_title ?? contact.user_profile?.title ?? ""} muted={!contact.job_title} />
                      )}
                    </InfoSection>
                  )}

                  {/* Relationship */}
                  {contact.relationship && (
                    <InfoSection icon={Tag} label="Relationship">
                      <p className="text-sm text-text-primary capitalize">
                        {contact.relationship}
                      </p>
                    </InfoSection>
                  )}

                  {/* Notes */}
                  {contact.notes && (
                    <InfoSection icon={StickyNote} label="Notes">
                      <p className="text-sm text-text-primary whitespace-pre-wrap">
                        {contact.notes}
                      </p>
                    </InfoSection>
                  )}

                  {/* Profile info from user_profile */}
                  {contact.user_profile?.bio && (
                    <InfoSection icon={Globe} label="Bio">
                      <p className="text-sm text-text-secondary">
                        {contact.user_profile.bio}
                      </p>
                    </InfoSection>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {editing ? (
              <div className="border-t border-border-subtle px-4 py-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-medium text-text-primary bg-bg-tertiary hover:bg-bg-tertiary/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3",
                    "text-sm font-medium",
                    "transition-all duration-200",
                    saving
                      ? "bg-bg-tertiary text-text-tertiary cursor-not-allowed"
                      : "bg-accent text-white hover:bg-accent-hover active:scale-[0.98]"
                  )}
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} strokeWidth={1.5} />
                  )}
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <div className="border-t border-border-subtle px-4 py-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3",
                    "text-sm font-medium text-destructive",
                    "hover:bg-destructive/10 transition-colors",
                    "disabled:opacity-50"
                  )}
                >
                  <Trash2 size={16} strokeWidth={1.5} />
                  {deleting ? "Removing..." : "Remove Contact"}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Info section sub-component ──────────────────────────────────────────────
function InfoSection({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-bg-primary/50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} strokeWidth={1.5} className="text-text-tertiary" />
        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="space-y-1.5 pl-[22px]">{children}</div>
    </div>
  );
}

// ── Info row sub-component ──────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <span className="text-[10px] text-text-tertiary">{label}</span>
      <p className={cn("text-sm", muted ? "text-text-tertiary italic" : "text-text-primary")}>
        {value}
      </p>
    </div>
  );
}
