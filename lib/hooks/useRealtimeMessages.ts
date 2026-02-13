"use client";

import { useEffect, useReducer } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageWithSender, MessageStatus } from "@/lib/types";
import type { Tables } from "@/lib/types/database";

type MessageRow = Tables<"messages">;

type State = {
  messages: MessageWithSender[];
  isConnected: boolean;
  isFetched: boolean;
};

type Action =
  | { type: "SET_INITIAL"; messages: MessageWithSender[] }
  | { type: "ADD_MESSAGE"; message: MessageRow }
  | { type: "UPDATE_MESSAGE"; message: MessageRow }
  | { type: "DELETE_MESSAGE"; messageId: string }
  | { type: "ADD_OPTIMISTIC"; message: MessageWithSender }
  | { type: "RECONCILE"; optimisticId: string; confirmedId: string }
  | { type: "FAIL_OPTIMISTIC"; optimisticId: string }
  | { type: "SET_CONNECTED"; connected: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_INITIAL":
      return { ...state, messages: action.messages, isFetched: true };

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
        return { ...state, messages: updated };
      }

      const newMsg: MessageWithSender = {
        ...action.message,
        sender: { id: action.message.sender_id } as MessageWithSender["sender"],
        reactions: [],
        attachments: [],
        reply_to: null,
        status: "sent",
      };
      return { ...state, messages: [...state.messages, newMsg] };
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

    case "SET_CONNECTED":
      return { ...state, isConnected: action.connected };

    default:
      return state;
  }
}

export function useRealtimeMessages(conversationId: string | null) {
  const [state, dispatch] = useReducer(reducer, {
    messages: [],
    isConnected: false,
    isFetched: false,
  });

  useEffect(() => {
    if (!conversationId) return;

    const convId = conversationId;
    const supabase = createClient();

    async function fetchMessages() {
      const { data, error } = await supabase
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

      if (error) {
        console.error("[useRealtimeMessages] fetch error:", error);
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
              id: parent.id,
              content: parent.content,
              type: parent.type,
              sender_id: parent.sender_id,
              sender: parent.sender as unknown as { id: string; display_name: string },
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
      dispatch({ type: "SET_INITIAL", messages: formatted });
    }

    fetchMessages();

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
      .subscribe((status) => {
        dispatch({ type: "SET_CONNECTED", connected: status === "SUBSCRIBED" });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return {
    messages: state.messages,
    isConnected: state.isConnected,
    isFetched: state.isFetched,
    addOptimistic: (msg: MessageWithSender) =>
      dispatch({ type: "ADD_OPTIMISTIC", message: msg }),
    reconcile: (optimisticId: string, confirmedId: string) =>
      dispatch({ type: "RECONCILE", optimisticId, confirmedId }),
    failOptimistic: (optimisticId: string) =>
      dispatch({ type: "FAIL_OPTIMISTIC", optimisticId }),
  };
}
