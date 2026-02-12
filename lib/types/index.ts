import type { Tables, TablesInsert } from "./database";

// ── Base table row aliases ──────────────────────────────────────────────────
export type Profile = Tables<"profiles">;
export type Conversation = Tables<"conversations">;
export type ConversationParticipant = Tables<"conversation_participants">;
export type Message = Tables<"messages">;
export type MessageReaction = Tables<"message_reactions">;
export type Attachment = Tables<"attachments">;

// ── Insert aliases ──────────────────────────────────────────────────────────
export type MessageInsert = TablesInsert<"messages">;
export type ConversationInsert = TablesInsert<"conversations">;

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
