"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TypingEvent } from "@/lib/types";

const TYPING_TIMEOUT = 3000;

export function useTypingIndicator(
  conversationId: string | null,
  currentUserId: string | null
) {
  const [typingUsers, setTypingUsers] = useState<
    Map<string, { display_name: string; timestamp: number }>
  >(new Map());
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const supabase = createClient();
    const channel = supabase.channel(`typing:${conversationId}`);

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const event = payload as TypingEvent;
        if (event.user_id === currentUserId) return;

        setTypingUsers((prev) => {
          const next = new Map(prev);
          if (event.is_typing) {
            next.set(event.user_id, {
              display_name: event.display_name,
              timestamp: Date.now(),
            });
          } else {
            next.delete(event.user_id);
          }
          return next;
        });
      })
      .subscribe();

    channelRef.current = channel;

    cleanupRef.current = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const next = new Map(prev);
        let changed = false;
        for (const [uid, val] of next) {
          if (now - val.timestamp > TYPING_TIMEOUT) {
            next.delete(uid);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (cleanupRef.current) clearInterval(cleanupRef.current);
    };
  }, [conversationId, currentUserId]);

  function startTyping(displayName: string) {
    if (!channelRef.current || !currentUserId || !conversationId) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: currentUserId,
        display_name: displayName,
        conversation_id: conversationId,
        is_typing: true,
      } satisfies TypingEvent,
    });

    debounceRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_TIMEOUT);
  }

  function stopTyping() {
    if (!channelRef.current || !currentUserId || !conversationId) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: currentUserId,
        display_name: "",
        conversation_id: conversationId,
        is_typing: false,
      } satisfies TypingEvent,
    });
  }

  const typingList = Array.from(typingUsers.values()).map((v) => v.display_name);

  return { typingUsers: typingList, startTyping, stopTyping };
}
