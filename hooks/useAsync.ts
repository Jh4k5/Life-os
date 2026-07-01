// hooks/useAsync.ts
// Load async data with an immediate fallback (mock) so the UI never blocks.
// Reloads when the screen regains focus (e.g. after Apply writes new rows).
// Optional `cacheKey`: the last successful result is persisted to AsyncStorage
// and re-hydrated on cold start, so a returning/offline user sees their real
// data instantly instead of the seed — write-through, read-through cache.
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAsync<T>(loader: () => Promise<T>, fallback: T, cacheKey?: string) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);

  // hydrate from cache once (before/while the network resolves)
  useEffect(() => {
    if (!cacheKey) return;
    let alive = true;
    AsyncStorage.getItem(`cache:${cacheKey}`)
      .then((raw) => {
        if (alive && raw) setData(JSON.parse(raw) as T);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [cacheKey]);

  const run = useCallback(() => {
    let alive = true;
    setLoading(true);
    loader()
      .then((res) => {
        if (!alive) return;
        setData(res);
        if (cacheKey) AsyncStorage.setItem(`cache:${cacheKey}`, JSON.stringify(res)).catch(() => {});
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  useEffect(run, [run]);
  useFocusEffect(run);

  return { data, loading, reload: run };
}
