import { useQuery } from '@tanstack/react-query';
import { generateAiPrompt } from '@/lib/api';
import { useEffect, useState } from 'react';

export function useAiPrompt() {
  const [isMounted, setIsMounted] = useState(false);
  const [promptFromStorage, setPromptFromStorage] = useState<string | null>(
    null
  );
  const [storageChecked, setStorageChecked] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    let foundPrompt: string | null = null;
    try {
      const storedPrompt = globalThis.localStorage.getItem('ai-prompt');
      if (storedPrompt) {
        foundPrompt = JSON.parse(storedPrompt) as string;
        setPromptFromStorage(foundPrompt);
      }
    } catch (error) {
      console.error('Failed to parse stored AI prompt:', error);
    } finally {
      setStorageChecked(true);
    }
  }, []);

  const queryResult = useQuery<string, Error>({
    queryKey: ['ai-prompt'],
    queryFn: generateAiPrompt,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: isMounted && storageChecked && promptFromStorage === null,
  });

  useEffect(() => {
    if (queryResult.data) {
      try {
        globalThis.localStorage.setItem(
          'ai-prompt',
          JSON.stringify(queryResult.data)
        );
        setPromptFromStorage(queryResult.data);
      } catch (error) {
        console.error('Failed to save AI prompt to localStorage:', error);
      }
    }
  }, [queryResult.data]);

  // Determine the data to return: prioritize the state which reflects storage/latest fetch
  const dataToShow = promptFromStorage;

  // Determine loading state: loading is true initially until storage is checked,
  // OR if the query is actively fetching (initial load or refetch)
  // Use isFetching for refetch indication, isLoading for initial load when enabled
  const isLoading = !storageChecked || queryResult.isFetching;

  return {
    ...queryResult,
    data: dataToShow,
    isLoading: isLoading,
    isFetching: queryResult.isFetching,
  };
}
