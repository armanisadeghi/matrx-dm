"use client";

import { cn } from "@/lib/cn";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Avatar, Spinner } from "@/components/ui";
import { updateProfile, uploadUserAvatar } from "@/lib/actions/profiles";
import type { Profile, UserProfile } from "@/lib/types";

type ProfileFormProps = {
  profile: Profile;
  userProfile: UserProfile | null;
};

export function ProfileForm({ profile, userProfile }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Base profile fields
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [statusText, setStatusText] = useState(profile.status_text ?? "");

  // User profile fields
  const [bio, setBio] = useState(userProfile?.bio ?? "");
  const [title, setTitle] = useState(userProfile?.title ?? "");
  const [company, setCompany] = useState(userProfile?.company ?? "");
  const [location, setLocation] = useState(userProfile?.location ?? "");
  const [website, setWebsite] = useState(userProfile?.website ?? "");
  const [phonePrimary, setPhonePrimary] = useState(userProfile?.phone_primary ?? "");
  const [phoneWork, setPhoneWork] = useState(userProfile?.phone_work ?? "");
  const [emailPrimary, setEmailPrimary] = useState(userProfile?.email_primary ?? "");
  const [emailWork, setEmailWork] = useState(userProfile?.email_work ?? "");
  const [twitterHandle, setTwitterHandle] = useState(userProfile?.twitter_handle ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(userProfile?.linkedin_url ?? "");
  const [githubHandle, setGithubHandle] = useState(userProfile?.github_handle ?? "");
  const [birthday, setBirthday] = useState(userProfile?.birthday ?? "");

  // Privacy toggles
  const [showPhone, setShowPhone] = useState(userProfile?.show_phone ?? false);
  const [showEmail, setShowEmail] = useState(userProfile?.show_email ?? false);
  const [showBirthday, setShowBirthday] = useState(userProfile?.show_birthday ?? false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setUploadingAvatar(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const result = await uploadUserAvatar(formData);
      if (result.error) {
        setError(result.error);
        setAvatarPreview(null);
      }
      router.refresh();
    } catch {
      setError("Failed to upload avatar");
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
      URL.revokeObjectURL(previewUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateProfile({
        display_name: displayName.trim(),
        status_text: statusText.trim() || null,
        bio: bio.trim() || null,
        title: title.trim() || null,
        company: company.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        phone_primary: phonePrimary.trim() || null,
        phone_work: phoneWork.trim() || null,
        email_primary: emailPrimary.trim() || null,
        email_work: emailWork.trim() || null,
        twitter_handle: twitterHandle.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        github_handle: githubHandle.trim() || null,
        birthday: birthday || null,
        show_phone: showPhone,
        show_email: showEmail,
        show_birthday: showBirthday,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = cn(
    "w-full rounded-lg bg-bg-input px-3 py-2.5",
    "text-sm text-text-primary placeholder:text-text-tertiary",
    "outline-none focus:ring-2 focus:ring-accent/50",
    "transition-shadow"
  );

  const labelClass = "block text-xs font-medium text-text-secondary mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar
            src={avatarPreview ?? profile.avatar_url}
            displayName={displayName}
            userId={profile.id}
            size="xl"
          />
          {uploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <Spinner size="sm" />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className={cn(
              "absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center",
              "rounded-full bg-accent text-white shadow-lg",
              "hover:bg-accent-hover transition-colors",
              "disabled:opacity-50"
            )}
          >
            <Camera size={14} strokeWidth={2} />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleAvatarChange}
          className="hidden"
          aria-label="Upload profile photo"
        />
      </div>

      {/* Error / Success */}
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
          Profile updated successfully
        </p>
      )}

      {/* Basic Info */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-text-primary mb-3">Basic Info</legend>

        <div>
          <label htmlFor="display-name" className={labelClass}>Display Name</label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="status" className={labelClass}>Status</label>
          <input
            id="status"
            type="text"
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            placeholder="What's on your mind?"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="bio" className={labelClass}>Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people a bit about yourself"
            rows={3}
            className={cn(inputClass, "resize-none")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className={labelClass}>Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="company" className={labelClass}>Company</label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Inc."
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className={labelClass}>Location</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="website" className={labelClass}>Website</label>
            <input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      {/* Contact Info */}
      <fieldset className="space-y-4">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold text-text-primary">Contact Info</legend>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone-primary" className={labelClass}>Phone (Personal)</label>
            <input
              id="phone-primary"
              type="tel"
              value={phonePrimary}
              onChange={(e) => setPhonePrimary(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="phone-work" className={labelClass}>Phone (Work)</label>
            <input
              id="phone-work"
              type="tel"
              value={phoneWork}
              onChange={(e) => setPhoneWork(e.target.value)}
              placeholder="+1 (555) 765-4321"
              className={inputClass}
            />
          </div>
        </div>

        <PrivacyToggle
          label="Show phone numbers to others"
          checked={showPhone}
          onChange={setShowPhone}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email-primary" className={labelClass}>Email (Personal)</label>
            <input
              id="email-primary"
              type="email"
              value={emailPrimary}
              onChange={(e) => setEmailPrimary(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email-work" className={labelClass}>Email (Work)</label>
            <input
              id="email-work"
              type="email"
              value={emailWork}
              onChange={(e) => setEmailWork(e.target.value)}
              placeholder="you@company.com"
              className={inputClass}
            />
          </div>
        </div>

        <PrivacyToggle
          label="Show email addresses to others"
          checked={showEmail}
          onChange={setShowEmail}
        />

        <div>
          <label htmlFor="birthday" className={labelClass}>Birthday</label>
          <input
            id="birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className={inputClass}
          />
        </div>

        <PrivacyToggle
          label="Show birthday to others"
          checked={showBirthday}
          onChange={setShowBirthday}
        />
      </fieldset>

      {/* Social Links */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-text-primary mb-3">Social Links</legend>

        <div>
          <label htmlFor="twitter" className={labelClass}>Twitter / X</label>
          <input
            id="twitter"
            type="text"
            value={twitterHandle}
            onChange={(e) => setTwitterHandle(e.target.value)}
            placeholder="@username"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="linkedin" className={labelClass}>LinkedIn</label>
          <input
            id="linkedin"
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/username"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="github" className={labelClass}>GitHub</label>
          <input
            id="github"
            type="text"
            value={githubHandle}
            onChange={(e) => setGithubHandle(e.target.value)}
            placeholder="username"
            className={inputClass}
          />
        </div>
      </fieldset>

      {/* Save */}
      <div className="flex justify-end pt-4 border-t border-border-subtle">
        <button
          type="submit"
          disabled={saving || !displayName.trim()}
          className={cn(
            "flex items-center gap-2 rounded-xl px-6 py-3",
            "text-sm font-medium",
            "transition-all duration-200",
            saving || !displayName.trim()
              ? "bg-bg-tertiary text-text-tertiary cursor-not-allowed"
              : "bg-accent text-white hover:bg-accent-hover active:scale-[0.98]"
          )}
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} strokeWidth={1.5} />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

// ── Privacy toggle sub-component ──────────────────────────────────────────────
function PrivacyToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 rounded-lg px-1 py-1.5 -mx-1 hover:bg-bg-tertiary/30 transition-colors w-full text-left"
    >
      <div
        className={cn(
          "flex h-5 w-9 items-center rounded-full px-0.5 transition-colors",
          checked ? "bg-accent" : "bg-bg-tertiary"
        )}
      >
        <div
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-3.5" : "translate-x-0"
          )}
        />
      </div>
      <span className="flex items-center gap-1.5 text-xs text-text-secondary">
        {checked ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}
        {label}
      </span>
    </button>
  );
}
