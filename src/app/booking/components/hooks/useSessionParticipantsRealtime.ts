import { useEffect, useCallback } from "react";

export default function useSessionParticipantsRealtime(onChange: () => void) {
  const setupPolling = useCallback(() => {

    // Poll for changes every 4 seconds
    const pollInterval = setInterval(() => {
      onChange();
    }, 4000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [onChange]);

  useEffect(() => {
    const cleanup = setupPolling();
    return cleanup;
  }, [setupPolling]);
}
