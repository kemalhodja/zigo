"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

export type RoomParticipant = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
};

type PresenceState = Record<string, RoomParticipant[]>;

/**
 * Synchronously detaches any existing channel with the same topic from the
 * singleton Supabase RealtimeClient so that calling `supabase.channel(topic)`
 * always creates a fresh RealtimeChannel instance (preventing the
 * "cannot add `presence` callbacks after `subscribe()`" error when switching
 * from observer count probes to active room presence or during StrictMode remounts).
 */
function acquireCleanChannel(
  supabase: SupabaseClient,
  topicName: string,
  presenceKey: string,
): RealtimeChannel {
  const fullTopic = `realtime:${topicName}`;
  const channels = supabase.getChannels();

  for (let i = channels.length - 1; i >= 0; i--) {
    const existing = channels[i];
    if (existing && existing.topic === fullTopic) {
      channels.splice(i, 1);
      try {
        void existing.unsubscribe();
        (existing as unknown as { teardown?: () => void }).teardown?.();
      } catch {
        // Ignore cleanup errors on stale channel
      }
    }
  }

  return supabase.channel(topicName, {
    config: { presence: { key: presenceKey } },
  });
}

function releaseChannelSafely(supabase: SupabaseClient, channel: RealtimeChannel) {
  try {
    const channels = supabase.getChannels();
    const idx = channels.indexOf(channel);
    if (idx !== -1) {
      channels.splice(idx, 1);
    }
    void channel.untrack();
    void supabase.removeChannel(channel);
  } catch {
    // Ignore cleanup errors
  }
}

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
  const [participants, setParticipants] = useState<RoomParticipant[]>(() =>
    enabled && slug && participant.user_id ? [participant] : [],
  );
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !slug) {
      setParticipants([]);
      setConnected(false);
      return;
    }

    // Always show the current user immediately so the room never appears empty to them
    setParticipants([participant]);

    let cancelled = false;
    let supabase: SupabaseClient | null = null;
    let channel: RealtimeChannel | null = null;

    try {
      supabase = createClient();
      channel = acquireCleanChannel(
        supabase,
        `focus-room:${slug}`,
        participant.user_id || `user-${Math.random().toString(36).slice(2, 8)}`,
      );

      channel
        .on("presence", { event: "sync" }, () => {
          if (cancelled || !channel) return;
          try {
            const state: PresenceState = channel.presenceState<RoomParticipant>();
            const rawList = Object.values(state)
              .flat()
              .filter((p) => Boolean(p?.user_id) && !p.user_id.startsWith("observer-"));

            // Deduplicate by user_id and ensure current participant is included
            const byId = new Map<string, RoomParticipant>();
            if (participant.user_id) {
              byId.set(participant.user_id, participant);
            }
            for (const p of rawList) {
              byId.set(p.user_id, p);
            }
            setParticipants(Array.from(byId.values()));
          } catch {
            // Keep existing participants on parse failure
          }
        })
        .subscribe(async (status) => {
          if (cancelled || !channel) return;
          if (status === "SUBSCRIBED") {
            setConnected(true);
            try {
              await channel.track(participant);
            } catch {
              // Presence track non-fatal
            }
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setConnected(false);
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.warn("Odak odası canlı bağlantı uyarısı:", err);
      setConnected(false);
    }

    return () => {
      cancelled = true;
      if (supabase && channel) {
        releaseChannelSafely(supabase, channel);
      }
      channelRef.current = null;
      setConnected(false);
    };
    // participant object identity must not re-subscribe on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, enabled, participant.user_id]);

  const leave = useCallback(() => {
    const channel = channelRef.current;
    if (channel) {
      try {
        void channel.untrack();
      } catch {
        // Ignore untrack error
      }
    }
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
  const slugsKey = slugs.join("|");

  useEffect(() => {
    if (!enabled || slugs.length === 0) return;

    let cancelled = false;
    const channels: RealtimeChannel[] = [];
    let supabase: SupabaseClient | null = null;

    try {
      supabase = createClient();

      for (const slug of slugs) {
        const observerKey = `observer-${Math.random().toString(36).slice(2, 8)}`;
        const channel = acquireCleanChannel(supabase, `focus-room:${slug}`, observerKey);
        channel.on("presence", { event: "sync" }, () => {
          if (cancelled) return;
          try {
            const state: PresenceState = channel.presenceState<RoomParticipant>();
            const uniqueUsers = new Set(
              Object.values(state)
                .flat()
                .filter((p) => p?.user_id && !p.user_id.startsWith("observer-"))
                .map((p) => p.user_id),
            );
            setCounts((prev) => ({ ...prev, [slug]: uniqueUsers.size }));
          } catch {
            // Ignore count parse errors
          }
        });
        channel.subscribe();
        channels.push(channel);
      }
    } catch (err) {
      console.warn("Odak odaları sayaç bağlantısı uyarısı:", err);
    }

    return () => {
      cancelled = true;
      if (supabase) {
        for (const channel of channels) {
          releaseChannelSafely(supabase, channel);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugsKey, enabled]);

  return counts;
}
