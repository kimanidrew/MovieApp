"use client";

import { useEffect, useState } from "react";

export function useVideoHistory() {
  const [history, setHistory] = useState<any>({});

  useEffect(() => {
    try {
      const data = JSON.parse(
        localStorage.getItem("movieflix-history") || "{}",
      );
      setHistory(data);
    } catch {
      setHistory({});
    }
  }, []);

  const isContinueWatching = (id: string) => {
    const item = history[id];
    return (
      item &&
      item.time > 5 &&
      item.duration > 0 &&
      item.time / item.duration < 0.95
    );
  };

  return { history, isContinueWatching };
}
