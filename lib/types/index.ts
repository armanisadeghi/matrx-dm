import type { Tables, TablesInsert } from "./database";
import type { Json } from "./database";

// ── Base table row aliases ──────────────────────────────────────────────────
export type Profile = Tables<"profiles">;
export type Conversation = Tables<"conversations">;
export type ConversationParticipant = Tables<"conversation_participants">;
export type Message = Tables<"messages">;
export type MessageReaction = Tables<"message_reactions">;
export type Attachment = Tables<"attachments">;
export type UserProfile = Tables<"user_profiles">;
export type Contact = Tables<"contacts">;

// ── Insert aliases ──────────────────────────────────────────────────────────
export type MessageInsert = TablesInsert<"messages">;
export type ConversationInsert = TablesInsert<"conversations">;
export type ContactInsert = TablesInsert<"contacts">;

// ── Message status for optimistic updates ───────────────────────────────────
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

// ── Enriched types used by components ───────────────────────────────────────
export type MessageWithSender = Message & {
  sender: Profile;
  reactions: MessageReaction[];
  attachments: Attachment[];
  reply_to?: Message & { sender: Pick<Profile, "id" | "display_name"> } | null;
  status?: MessageStatus;
  optimistic_id?: string;
};

export type ConversationWithDetails = {
  conversation_id: string;
  conversation_name: string;
  conversation_avatar_url: string | null;
  conversation_type: string;
  conversation_updated_at: string;
  is_muted: boolean;
  is_pinned: boolean;
  last_message_id: string | null;
  last_message_content: string | null;
  last_message_created_at: string | null;
  last_message_sender_id: string | null;
  last_message_sender_name: string | null;
  last_message_type: string | null;
  unread_count: number;
};

// ── Realtime event types ────────────────────────────────────────────────────
export type TypingEvent = {
  user_id: string;
  display_name: string;
  conversation_id: string;
  is_typing: boolean;
};

export type PresenceState = {
  user_id: string;
  is_online: boolean;
  last_seen_at: string | null;
};

// ── Payload types for actions ───────────────────────────────────────────────
export type SendMessagePayload = {
  conversation_id: string;
  content: string;
  type?: string;
  reply_to_id?: string | null;
};

export type CreateGroupPayload = {
  name: string;
  user_ids: string[];
};

// ── Filter types for sidebar ────────────────────────────────────────────────
export type ConversationFilter = "all" | "unread" | "groups";

// ── Address type for contacts ───────────────────────────────────────────────
export type Address = {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
};

// ── Social media links ─────────────────────────────────────────────────────
export type SocialMedia = {
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  github?: string;
  [key: string]: string | undefined;
};

// ── Custom date entry ──────────────────────────────────────────────────────
export type CustomDate = {
  label: string;
  date: string;
};

// ── Combined view: contact with their profile data ─────────────────────────
export type ContactWithProfile = Contact & {
  profile: Profile;
  user_profile: UserProfile | null;
};

// ── Profile update payload ─────────────────────────────────────────────────
export type UpdateProfilePayload = {
  display_name?: string;
  avatar_url?: string | null;
  status_text?: string | null;
  bio?: string | null;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  website?: string | null;
  phone_primary?: string | null;
  phone_work?: string | null;
  email_primary?: string | null;
  email_work?: string | null;
  twitter_handle?: string | null;
  linkedin_url?: string | null;
  github_handle?: string | null;
  birthday?: string | null;
  show_phone?: boolean;
  show_email?: boolean;
  show_birthday?: boolean;
};

// ── Contact update payload ─────────────────────────────────────────────────
export type UpdateContactPayload = {
  custom_name?: string | null;
  custom_avatar_url?: string | null;
  nickname?: string | null;
  phone_mobile?: string | null;
  phone_home?: string | null;
  phone_work?: string | null;
  phone_other?: string | null;
  email_personal?: string | null;
  email_work?: string | null;
  email_other?: string | null;
  address_home?: Json | null;
  address_work?: Json | null;
  company?: string | null;
  job_title?: string | null;
  department?: string | null;
  birthday?: string | null;
  anniversary?: string | null;
  custom_dates?: Json | null;
  social_media?: Json | null;
  websites?: string[] | null;
  notes?: string | null;
  tags?: string[] | null;
  relationship?: string | null;
  is_favorite?: boolean;
};
