"use client";
import { useEffect, useState } from "react";

export function useNow(initialNowMs: number, intervalMs = 30000) {
  const [now, setNow] = useState(initialNowMs);
  useEffect(() => {
    setNow(initialNowMs);
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [initialNowMs, intervalMs]);
  return now;
}
