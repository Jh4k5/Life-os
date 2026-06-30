// hooks/useAsync.ts
// Load async data with an immediate fallback (mock) so the UI never blocks.
// Reloads when the screen regains focus (e.g. after Apply writes new rows).
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function useAsync<T>(loader: () => Promise<T>, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  const run = useCallback(() => {
    let alive = true;
    setLoading(true);
    loader()
      .then((res) => {
        if (alive) setData(res);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(run, [run]);
  useFocusEffect(run);

  return { data, loading, reload: run };
}
