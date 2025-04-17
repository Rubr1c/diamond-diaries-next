'use client';

import { useAiPrompt } from '@/hooks/useAiPrompt';
import { useUser } from '@/hooks/useUser';

export default function Home() {
  const { data: user } = useUser();

  // useAiPrompt returns { data, isLoading, isError, refetch, ... }
  const prompt = useAiPrompt();

  const handleRefetch = () => {
    // Calling refetch will trigger the queryFn again
    // The hook's useEffect will handle saving the new data
    prompt.refetch();
  };

  return (
    <div className="mt-20">
      <h1>Hi, {user?.username}</h1>
      {/* Display loading state */}
      {prompt.isLoading && <p>Loading prompt...</p>}
      {/* Display error state */}
      {prompt.isError && <p>Error loading prompt: {prompt.error?.message}</p>}
      {/* Display the prompt data */}
      {prompt.data && <pre>{prompt.data}</pre>}
      {/* Add a button to refetch */}
      <button onClick={handleRefetch} disabled={prompt.isFetching}>
        {prompt.isFetching ? 'Getting New Prompt...' : 'Get New Prompt'}
      </button>
    </div>
  );
}
