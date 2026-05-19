'use client';

import { useState, useCallback } from 'react';

interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string;
  fetch: () => Promise<void>;
}

export function useFetch<T>(
  url: string,
  options?: RequestInit,
  onSuccess?: (data: T) => void
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await global.fetch(url, { credentials: 'include', ...options });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const result: T = await response.json();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setIsLoading(false);
    }
  }, [url, options, onSuccess]);

  return { data, isLoading, error, fetch: execute };
}
