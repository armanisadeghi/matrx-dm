"use client";

import { cn } from "@/lib/cn";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  Users, 
  UserPlus, 
  UserMinus, 
  Edit2, 
  Image as ImageIcon,
  LogOut,
  Trash2,
  Crown,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, IconButton, Spinner } from "@/components/ui";
import { AddMembersModal } from "./AddMembersModal";
import { 
  updateGroupName, 
  updateGroupAvatar,
  addGroupMembers, 
  removeGroupMember,
  updateMemberRole,
  leaveGroup,
  deleteGroup
} from "@/lib/actions/groups";
import type { Profile } from "@/lib/types";

type GroupMember = {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  profile: Profile;
};

type GroupManagementSheetProps = {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  conversationName: string;
  conversationAvatar: string | null;
};

export function GroupManagementSheet({
  open,
  onClose,
  conversationId,
  conversationName,
  conversationAvatar,
}: GroupManagementSheetProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "members" | "settings">("info");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(conversationName);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<"owner" | "admin" | "member">("member");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = currentUserRole === "owner";
  const isAdmin = currentUserRole === "admin" || isOwner;

  useEffect(() => {
    if (open) {
      setNewName(conversationName);
      setEditingName(false);
      setError(null);
      setActiveTab("info");
      fetchGroupData();
    }
  }, [open, conversationId]);

  async function fetchGroupData() {
    setFetchingData(true);
    try {
      // Fetch current user
      const userRes = await fetch("/api/users/me");
      if (!userRes.ok) throw new Error("Failed to fetch user");
      const userData = await userRes.json();
      setCurrentUserId(userData.id);

      // Fetch group members
      const membersRes = await fetch(`/api/conversations/${conversationId}/members`);
      if (!membersRes.ok) throw new Error("Failed to fetch members");
      const membersData = await membersRes.json();
      setMembers(membersData.members);

      // Find current user's role
      const currentMember = membersData.members.find((m: GroupMember) => m.user_id === userData.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }
    } catch (err) {
      setError("Failed to load group data");
    } finally {
      setFetchingData(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    setUploadingAvatar(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const result = await updateGroupAvatar(conversationId, formData);
      if (result.error) {
        setError(result.error);
        setAvatarPreview(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to upload avatar");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      URL.revokeObjectURL(previewUrl);
      // Reset file input so re-selecting the same file triggers change
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAddMembers(userIds: string[]) {
    if (userIds.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const result = await addGroupMembers(conversationId, userIds);
      if (result.error) {
        setError(result.error);
        return;
      }
      setAddMembersOpen(false);
      await fetchGroupData();
      router.refresh();
    } catch {
      setError("Failed to add members");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateName() {
    if (!newName.trim() || newName === conversationName) {
      setEditingName(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await updateGroupName(conversationId, newName.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingName(false);
      router.refresh();
    } catch {
      setError("Failed to update group name");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Remove this member from the group?")) return;

    setLoading(true);
    setError(null);
    try {
      const result = await removeGroupMember(conversationId, userId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to remove member");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(userId: string, newRole: "admin" | "member") {
    setLoading(true);
    setError(null);
    try {
      const result = await updateMemberRole(conversationId, userId, newRole);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to update member role");
    } finally {
      setLoading(false);
    }
  }

  async function handleLeaveGroup() {
    if (!confirm("Are you sure you want to leave this group?")) return;

    setLoading(true);
    try {
      const result = await leaveGroup(conversationId);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.push("/messages");
      router.refresh();
    } catch {
      setError("Failed to leave group");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGroup() {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) return;

    setLoading(true);
    try {
      const result = await deleteGroup(conversationId);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.push("/messages");
      router.refresh();
    } catch {
      setError("Failed to delete group");
    } finally {
      setLoading(false);
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Group settings"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed right-0 top-0 bottom-0 z-50",
              "w-full sm:w-[400px]",
              "bg-bg-secondary",
              "flex flex-col",
              "safe-bottom"
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3">
              <h2 className="flex-1 text-md font-semibold text-text-primary">
                Group Settings
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

            {/* Tabs */}
            <div className="flex border-b border-border-subtle">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === "info"
                    ? "text-accent border-b-2 border-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
              >
                Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("members")}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === "members"
                    ? "text-accent border-b-2 border-accent"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
              >
                Members ({members.length})
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                    activeTab === "settings"
                      ? "text-accent border-b-2 border-accent"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                >
                  Settings
                </button>
              )}
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
              {fetchingData ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : activeTab === "info" ? (
                <div className="p-4 space-y-6">
                  {/* Group Avatar */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Avatar
                        src={avatarPreview ?? conversationAvatar}
                        displayName={conversationName}
                        userId={conversationId}
                        size="xl"
                      />
                      {uploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                          <Spinner size="sm" />
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleAvatarChange}
                          className="hidden"
                          aria-label="Upload group photo"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
                        >
                          <ImageIcon size={16} strokeWidth={1.5} />
                          {uploadingAvatar ? "Uploading..." : "Change Photo"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Group Name */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">
                      Group Name
                    </label>
                    {editingName ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateName();
                            if (e.key === "Escape") setEditingName(false);
                          }}
                          autoFocus
                          className={cn(
                            "flex-1 rounded-lg bg-bg-input px-3 py-2",
                            "text-sm text-text-primary",
                            "outline-none focus:ring-2 focus:ring-accent/50"
                          )}
                        />
                        <button
                          type="button"
                          onClick={handleUpdateName}
                          disabled={loading}
                          className="px-3 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg bg-bg-input px-3 py-2">
                        <span className="text-sm text-text-primary">{conversationName}</span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setEditingName(true)}
                            className="text-text-tertiary hover:text-text-primary transition-colors"
                          >
                            <Edit2 size={16} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Group Description */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">
                      Description
                    </label>
                    <p className="text-sm text-text-tertiary">
                      {members.length} members
                    </p>
                  </div>
                </div>
              ) : activeTab === "members" ? (
                <div className="p-4">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setAddMembersOpen(true)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-3 mb-4",
                        "text-left transition-colors",
                        "hover:bg-bg-tertiary/50"
                      )}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                        <UserPlus size={20} strokeWidth={1.5} className="text-accent" />
                      </div>
                      <span className="text-sm font-medium text-accent">
                        Add Members
                      </span>
                    </button>
                  )}

                  <div className="space-y-1">
                    {members.map((member) => {
                      const isCurrentUser = member.user_id === currentUserId;
                      const canManage = isAdmin && !isCurrentUser && member.role !== "owner";

                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-bg-tertiary/50 transition-colors"
                        >
                          <Avatar
                            src={member.profile.avatar_url}
                            displayName={member.profile.display_name}
                            userId={member.user_id}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-text-primary truncate">
                                {member.profile.display_name}
                                {isCurrentUser && " (You)"}
                              </span>
                              {member.role === "owner" && (
                                <Crown size={14} className="text-amber-500" strokeWidth={1.5} />
                              )}
                              {member.role === "admin" && (
                                <Shield size={14} className="text-blue-500" strokeWidth={1.5} />
                              )}
                            </div>
                            {member.profile.status_text && (
                              <p className="text-xs text-text-tertiary truncate">
                                {member.profile.status_text}
                              </p>
                            )}
                          </div>
                          {canManage && (
                            <div className="flex items-center gap-1">
                              {member.role === "member" && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRole(member.user_id, "admin")}
                                  disabled={loading}
                                  className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
                                  title="Make admin"
                                >
                                  <Shield size={16} strokeWidth={1.5} />
                                </button>
                              )}
                              {member.role === "admin" && isOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRole(member.user_id, "member")}
                                  disabled={loading}
                                  className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
                                  title="Remove admin"
                                >
                                  <Shield size={16} strokeWidth={1.5} className="opacity-50" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member.user_id)}
                                disabled={loading}
                                className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                title="Remove member"
                              >
                                <UserMinus size={16} strokeWidth={1.5} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : activeTab === "settings" && isAdmin ? (
                <div className="p-4 space-y-2">
                  {/* Leave Group */}
                  <button
                    type="button"
                    onClick={handleLeaveGroup}
                    disabled={loading || isOwner}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3",
                      "text-left transition-colors",
                      "hover:bg-bg-tertiary/50",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <LogOut size={20} strokeWidth={1.5} className="text-text-secondary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        Leave Group
                      </p>
                      {isOwner && (
                        <p className="text-xs text-text-tertiary">
                          Transfer ownership first
                        </p>
                      )}
                    </div>
                  </button>

                  {/* Delete Group (Owner only) */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleDeleteGroup}
                      disabled={loading}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-3",
                        "text-left transition-colors",
                        "hover:bg-destructive/10",
                        "disabled:opacity-50"
                      )}
                    >
                      <Trash2 size={20} strokeWidth={1.5} className="text-destructive" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">
                          Delete Group
                        </p>
                        <p className="text-xs text-text-tertiary">
                          This action cannot be undone
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>

          {/* Add Members Modal */}
          <AddMembersModal
            open={addMembersOpen}
            onClose={() => setAddMembersOpen(false)}
            onAdd={handleAddMembers}
            existingMemberIds={members.map((m) => m.user_id)}
          />
        </>
      )}
    </AnimatePresence>
  );
}
