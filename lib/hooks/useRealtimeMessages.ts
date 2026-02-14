"use client";

import { useEffect, useReducer, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageWithSender, MessageStatus } from "@/lib/types";
import type { Tables } from "@/lib/types/database";

type MessageRow = Tables<"messages">;

type ConnectionState = "connected" | "disconnected" | "reconnecting" | "failed";

type State = {
  messages: MessageWithSender[];
  connectionState: ConnectionState;
  isFetched: boolean;
  lastMessageTimestamp: string | null;
};

type Action =
  | { type: "SET_INITIAL"; messages: MessageWithSender[] }
  | { type: "ADD_MESSAGE"; message: MessageRow }
  | { type: "UPDATE_MESSAGE"; message: MessageRow }
  | { type: "DELETE_MESSAGE"; messageId: string }
  | { type: "ADD_OPTIMISTIC"; message: MessageWithSender }
  | { type: "RECONCILE"; optimisticId: string; confirmedId: string }
  | { type: "FAIL_OPTIMISTIC"; optimisticId: string }
  | { type: "SET_CONNECTION_STATE"; state: ConnectionState }
  | { type: "UPDATE_LAST_TIMESTAMP"; timestamp: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_INITIAL":
      return { 
        ...state, 
        messages: action.messages, 
        isFetched: true,
        lastMessageTimestamp: action.messages.length > 0 
          ? action.messages[action.messages.length - 1]!.created_at 
          : null
      };

    case "ADD_MESSAGE": {
      // Check if this message already exists by server ID
      const existsById = state.messages.some(
        (m) => m.id === action.message.id
      );
      if (existsById) {
        // Already reconciled — just update in place
        return {
          ...state,
          messages: state.messages.map((m) =>
            m.id === action.message.id
              ? { ...m, ...action.message, status: "sent" as MessageStatus }
              : m
          ),
        };
      }

      // Check for a pending optimistic message from the same sender with matching content
      // This handles the race where realtime arrives before reconcile
      const optimisticIdx = state.messages.findIndex(
        (m) =>
          m.optimistic_id &&
          m.sender_id === action.message.sender_id &&
          m.content === action.message.content &&
          (m.status === "sending" || m.status === "sent")
      );
      if (optimisticIdx !== -1) {
        const updated = [...state.messages];
        updated[optimisticIdx] = {
          ...updated[optimisticIdx]!,
          ...action.message,
          sender: updated[optimisticIdx]!.sender,
          reactions: updated[optimisticIdx]!.reactions,
          attachments: updated[optimisticIdx]!.attachments,
          reply_to: updated[optimisticIdx]!.reply_to,
          optimistic_id: undefined,
          status: "sent" as MessageStatus,
        };
        return { 
          ...state, 
          messages: updated,
          lastMessageTimestamp: action.message.created_at
        };
      }

      const newMsg: MessageWithSender = {
        ...action.message,
        sender: { id: action.message.sender_id } as MessageWithSender["sender"],
        reactions: [],
        attachments: [],
        reply_to: null,
        status: "sent",
      };
      return { 
        ...state, 
        messages: [...state.messages, newMsg],
        lastMessageTimestamp: action.message.created_at
      };
    }

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.message.id ? { ...m, ...action.message } : m
        ),
      };

    case "DELETE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.messageId
            ? { ...m, is_deleted: true, content: null }
            : m
        ),
      };

    case "ADD_OPTIMISTIC":
      return { ...state, messages: [...state.messages, action.message] };

    case "RECONCILE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.optimistic_id === action.optimisticId
            ? { ...m, id: action.confirmedId, optimistic_id: undefined, status: "sent" as MessageStatus }
            : m
        ),
      };

    case "FAIL_OPTIMISTIC":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.optimistic_id === action.optimisticId
            ? { ...m, status: "failed" as MessageStatus }
            : m
        ),
      };

    case "SET_CONNECTION_STATE":
      return { ...state, connectionState: action.state };

    case "UPDATE_LAST_TIMESTAMP":
      return { ...state, lastMessageTimestamp: action.timestamp };

    default:
      return state;
  }
}

const RECONNECT_DELAY_MS = 3000; // Show banner after 3 seconds
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

export function useRealtimeMessages(conversationId: string | null) {
  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    connectionState: "disconnected",
    isFetched: false,
    lastMessageTimestamp: null,
  });

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const lastMessageTimestampRef = useRef<string | null>(null);
  const isReconnectingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    lastMessageTimestampRef.current = state.lastMessageTimestamp;
  }, [state.lastMessageTimestamp]);

  useEffect(() => {
    if (!conversationId) return;

    const convId = conversationId;
    const supabase = createClient();
    let isCleanedUp = false;

    async function fetchMessages(sinceTimestamp?: string | null) {
      const query = supabase
        .from("messages")
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(*),
          reactions:message_reactions(*),
          attachments(*)
        `
        )
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(100);

      // If we have a timestamp, fetch only messages after it (for reconnection)
      if (sinceTimestamp) {
        query.gt("created_at", sinceTimestamp);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[useRealtimeMessages] fetch error:", error);
        return [];
      }

      const messages = data ?? [];

      // Build a lookup map for reply_to references
      const messageMap = new Map(messages.map((m) => [m.id, m]));

      const formatted = messages.map((m) => {
        let replyTo: MessageWithSender["reply_to"] = null;
        if (m.reply_to_id) {
          const parent = messageMap.get(m.reply_to_id);
          if (parent) {
            replyTo = {
              ...parent,
              sender: parent.sender as unknown as Pick<MessageWithSender["sender"], "id" | "display_name">,
            };
          }
        }

        return {
          ...m,
          sender: m.sender as unknown as MessageWithSender["sender"],
          reactions: (m.reactions ?? []) as MessageWithSender["reactions"],
          attachments: (m.attachments ?? []) as MessageWithSender["attachments"],
          reply_to: replyTo,
          status: "sent" as MessageStatus,
        };
      });

      return formatted;
    }

    async function setupChannel() {
      // Prevent concurrent reconnection attempts
      if (isReconnectingRef.current || isCleanedUp) {
        return;
      }
      
      isReconnectingRef.current = true;

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Remove existing channel if any
      if (channelRef.current) {
        try {
          await supabase.removeChannel(channelRef.current);
        } catch (err) {
          console.error("[useRealtimeMessages] Error removing channel:", err);
        }
        channelRef.current = null;
      }

      if (isCleanedUp) {
        isReconnectingRef.current = false;
        return;
      }

      const channel = supabase
        .channel(`messages:${convId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${convId}`,
          },
          (payload) => {
            dispatch({ type: "ADD_MESSAGE", message: payload.new as MessageRow });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${convId}`,
          },
          (payload) => {
            dispatch({ type: "UPDATE_MESSAGE", message: payload.new as MessageRow });
          }
        )
        .subscribe(async (status) => {
          if (isCleanedUp) return;

          if (status === "SUBSCRIBED") {
            // Successfully connected/reconnected
            dispatch({ type: "SET_CONNECTION_STATE", state: "connected" });
            retryAttemptRef.current = 0;
            isReconnectingRef.current = false;

            // If we were reconnecting, fetch any missed messages
            if (lastMessageTimestampRef.current) {
              const missedMessages = await fetchMessages(lastMessageTimestampRef.current);
              if (!isCleanedUp) {
                missedMessages.forEach((msg) => {
                  dispatch({ type: "ADD_MESSAGE", message: msg as unknown as MessageRow });
                });
              }
            }
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            isReconnectingRef.current = false;
            
            // Connection failed - schedule retry with exponential backoff
            if (retryAttemptRef.current < MAX_RETRY_ATTEMPTS && !isCleanedUp) {
              const delay = RETRY_DELAYS[retryAttemptRef.current] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1]!;
              retryAttemptRef.current++;

              console.log(`[useRealtimeMessages] Retry attempt ${retryAttemptRef.current}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`);

              // Schedule reconnection outside the current call stack
              setTimeout(() => {
                if (!isCleanedUp) {
                  setupChannel();
                }
              }, delay);
            } else if (!isCleanedUp) {
              // Max retries exceeded
              dispatch({ type: "SET_CONNECTION_STATE", state: "failed" });
              console.error("[useRealtimeMessages] Max retry attempts exceeded");
            }
          } else if (status === "CLOSED") {
            isReconnectingRef.current = false;
            
            if (isCleanedUp) return;

            // Connection closed - schedule reconnect timer
            // Only show "reconnecting" UI after RECONNECT_DELAY_MS
            if (!reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                if (!isCleanedUp) {
                  dispatch({ type: "SET_CONNECTION_STATE", state: "reconnecting" });
                }
              }, RECONNECT_DELAY_MS);
            }

            // Set to disconnected state
            dispatch({ type: "SET_CONNECTION_STATE", state: "disconnected" });
            
            // Schedule reconnection attempt outside the current call stack
            setTimeout(() => {
              if (!isCleanedUp) {
                setupChannel();
              }
            }, 1000);
          }
        });

      channelRef.current = channel;
    }

    // Initial fetch and setup
    (async () => {
      const initialMessages = await fetchMessages();
      dispatch({ type: "SET_INITIAL", messages: initialMessages });
      await setupChannel();
    })();

    return () => {
      isCleanedUp = true;
      isReconnectingRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  return {
    messages: state.messages,
    connectionState: state.connectionState,
    isFetched: state.isFetched,
    addOptimistic: (msg: MessageWithSender) =>
      dispatch({ type: "ADD_OPTIMISTIC", message: msg }),
    reconcile: (optimisticId: string, confirmedId: string) =>
      dispatch({ type: "RECONCILE", optimisticId, confirmedId }),
    failOptimistic: (optimisticId: string) =>
      dispatch({ type: "FAIL_OPTIMISTIC", optimisticId }),
  };
}
