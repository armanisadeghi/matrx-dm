"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PresenceState } from "@/lib/types";

export function usePresence(currentUserId: string | null) {
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceState>>(
    new Map()
  );

  useEffect(() => {
    if (!currentUserId) return;

    const supabase = createClient();
    const channel = supabase.channel("global-presence");

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{
          user_id: string;
          is_online: boolean;
          last_seen_at: string | null;
        }>();
        const next = new Map<string, PresenceState>();

        for (const key in state) {
          const presences = state[key];
          if (!presences) continue;
          for (const p of presences) {
            next.set(p.user_id, {
              user_id: p.user_id,
              is_online: true,
              last_seen_at: p.last_seen_at,
            });
          }
        }

        setPresenceMap(next);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUserId,
            is_online: true,
            last_seen_at: new Date().toISOString(),
          });
        }
      });

    const handleBeforeUnload = () => {
      channel.untrack();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  function isOnline(userId: string): boolean {
    return presenceMap.get(userId)?.is_online ?? false;
  }

  return { presenceMap, isOnline };
}
