"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type RoomParticipant = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
};

type PresenceState = Record<string, RoomParticipant[]>;

/**
 * Supabase Realtime presence for a focus room.
 * Tracks live participants; the pomodoro phase itself is wall-clock synced
 * (see focus-rooms.ts) so no broadcast channel is needed.
 */
export function useFocusRoom(options: {
  slug: string | null;
  participant: RoomParticipant;
  enabled: boolean;
}) {
  const { slug, participant, enabled } = options;
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !slug) {
      setParticipants([]);
      setConnected(false);
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel(`focus-room:${slug}`, {
      config: { presence: { key: participant.user_id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state: PresenceState = channel.presenceState<RoomParticipant>();
        const list = Object.values(state)
          .flat()
          .filter((p) => Boolean(p?.user_id));
        setParticipants(list);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(participant);
          setConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      void channel.untrack();
      void supabase.removeChannel(channel);
      channelRef.current = null;
      setConnected(false);
      setParticipants([]);
    };
    // participant object identity must not re-subscribe on every render

  }, [slug, enabled]);

  const leave = useCallback(() => {
    const channel = channelRef.current;
    if (channel) void channel.untrack();
  }, []);

  return useMemo(
    () => ({ participants, connected, leave }),
    [participants, connected, leave],
  );
}

/**
 * Lightweight live-count probe used by the room list: joins every room's
 * presence briefly and reports participant counts. All channels share a
 * single websocket via supabase-js multiplexing.
 */
export function useFocusRoomCounts(slugs: string[], enabled: boolean) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!enabled || slugs.length === 0) return;

    let cancelled = false;
    const channels: RealtimeChannel[] = [];
    const supabase = createClient();

    for (const slug of slugs) {
      const channel = supabase.channel(`focus-room:${slug}`, {
        config: { presence: { key: `observer-${Math.random().toString(36).slice(2, 8)}` } },
      });
      channel.on("presence", { event: "sync" }, () => {
        const state: PresenceState = channel.presenceState<RoomParticipant>();
        const count = Object.values(state)
          .flat()
          .filter((p) => p.user_id && !p.user_id.startsWith("observer-")).length;
        if (!cancelled) setCounts((prev) => ({ ...prev, [slug]: count }));
      });
      channel.subscribe();
      channels.push(channel);
    }

    return () => {
      cancelled = true;
      for (const channel of channels) void supabase.removeChannel(channel);
    };
  }, [slugs.join("|"), enabled]);

  return counts;
}
