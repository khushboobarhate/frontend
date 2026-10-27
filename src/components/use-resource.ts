"use client";
import { useCallback, useEffect, useState } from "react";
export function useResource<T>(fetcher: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{
    fetcher: () => Promise<T>;
    version: number;
    data: T | null;
    error: string;
  } | null>(null);
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    Promise.resolve()
      .then(fetcher)
      .then(
        (data) => {
          if (active) setResult({ fetcher, version, data, error: "" });
        },
        (error) => {
          if (active)
            setResult({
              fetcher,
              version,
              data: null,
              error:
                error instanceof Error ? error.message : "Please try again.",
            });
        },
      );
    return () => {
      active = false;
    };
  }, [fetcher, version]);
  const current =
    result?.fetcher === fetcher && result.version === version ? result : null;
  return {
    data: current?.data ?? null,
    error: current?.error ?? "",
    isLoading: !current,
    reload,
  };
}
