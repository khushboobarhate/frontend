"use client";
import { useCallback, useEffect, useState } from "react";
export function useResource<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetcher()
      .then((data) => {
        if (active) setData(data);
      })
      .catch((error) => {
        if (active) {
          setError(
            error instanceof Error ? error.message : "Please try again.",
          );
          setData(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetcher, version]);
  return { data, error, isLoading, reload };
}
