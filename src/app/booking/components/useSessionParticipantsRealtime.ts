import { useEffect, useCallback } from "react";

export default function useSessionParticipantsRealtime(onChange: () => void) {
  const setupPolling = useCallback(() => {
    console.log("[Realtime] Setting up polling...");

    // Poll for changes every 3 seconds
    const pollInterval = setInterval(() => {
      console.log("[Realtime] Polling for changes...");
      onChange();
    }, 3000);

    return () => {
      console.log("[Realtime] Cleaning up polling...");
      clearInterval(pollInterval);
    };
  }, [onChange]);

  useEffect(() => {
    const cleanup = setupPolling();
    return cleanup;
  }, [setupPolling]);
}
