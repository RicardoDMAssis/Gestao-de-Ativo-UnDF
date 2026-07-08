import { useEffect, useRef } from "react";

export function useAutoRefresh(callback: () => void, delayMs: number = 30000, active: boolean = true) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;

    const id = setInterval(() => {
      savedCallback.current();
    }, delayMs);

    return () => clearInterval(id);
  }, [delayMs, active]);
}
