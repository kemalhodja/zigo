import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

/**
 * A custom hook to listen to realtime changes on a specific Supabase table.
 * 
 * @param table - The table name to listen to
 * @param filter - The filter for the channel (e.g. `user_id=eq.${profileId}`)
 * @param onUpdate - Callback when a realtime payload is received
 */
export function useRealtime<T>(
  table: string, 
  filter: string, 
  onUpdate: (payload: T) => void
) {
  useEffect(() => {
    const supabase = createClient();
    
    // Create a channel specific to the table and filter
    const channel = supabase
      .channel(`realtime_${table}_${filter}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: filter,
        },
        (payload) => {
          onUpdate(payload as unknown as T);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, onUpdate]);
}
