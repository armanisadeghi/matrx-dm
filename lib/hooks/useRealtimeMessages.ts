"use client";

import { useEffect, useReducer } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageWithSender, MessageStatus } from "@/lib/types";
import type { Tables } from "@/lib/types/database";

type MessageRow = Tables<"messages">;

type State = {
  messages: MessageWithSender[];
  isConnected: boolean;
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
      return { ...state, messages: action.messages };

    case "ADD_MESSAGE": {
      const exists = state.messages.some(
        (m) => m.id === action.message.id || m.optimistic_id === action.message.id
      );
      if (exists) {
        return {
          ...state,
          messages: state.messages.map((m) =>
            m.optimistic_id === action.message.id
              ? { ...m, ...action.message, optimistic_id: undefined, status: "sent" as MessageStatus }
              : m
          ),
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
  });

  useEffect(() => {
    if (!conversationId) return;

    const convId = conversationId;
    const supabase = createClient();

    async function fetchMessages() {
      const { data } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:profiles!messages_sender_id_fkey(*),
          reactions:message_reactions(*),
          attachments(*),
          reply_to:messages!messages_reply_to_id_fkey(
            id, content, type, sender_id,
            sender:profiles!messages_sender_id_fkey(id, display_name)
          )
        `
        )
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (data) {
        const formatted = data.map((m) => ({
          ...m,
          sender: m.sender as unknown as MessageWithSender["sender"],
          reactions: (m.reactions ?? []) as MessageWithSender["reactions"],
          attachments: (m.attachments ?? []) as MessageWithSender["attachments"],
          reply_to: (m.reply_to as unknown as MessageWithSender["reply_to"]) ?? null,
          status: "sent" as MessageStatus,
        }));
        dispatch({ type: "SET_INITIAL", messages: formatted });
      }
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
    addOptimistic: (msg: MessageWithSender) =>
      dispatch({ type: "ADD_OPTIMISTIC", message: msg }),
    reconcile: (optimisticId: string, confirmedId: string) =>
      dispatch({ type: "RECONCILE", optimisticId, confirmedId }),
    failOptimistic: (optimisticId: string) =>
      dispatch({ type: "FAIL_OPTIMISTIC", optimisticId }),
  };
}
