import { useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

export default function useSessionParticipantsRealtime(onChange: () => void) {
  const fetchSessions = useCallback(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("session_participants_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_participants",
        },
        (payload) => {
          console.log("[Realtime] session_participants changed:", payload);
          onChange();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [onChange]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);
}
