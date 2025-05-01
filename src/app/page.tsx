'use client';

import { useAiPrompt } from '@/hooks/useAiPrompt';
import { useUser } from '@/hooks/useUser';

export default function Home() {
  const { data: user } = useUser();

  const prompt = useAiPrompt();

  const handleRefetch = () => {
    prompt.refetch();
  };

  return (
    <div className="mt-20">
      <h1>Hi, {user?.username}</h1>
      {prompt.isLoading && <p>Loading prompt...</p>}
      {prompt.isError && <p>Error loading prompt: {prompt.error?.message}</p>}
      {prompt.data && <pre>{prompt.data}</pre>}
      <button onClick={handleRefetch} disabled={prompt.isFetching}>
        {prompt.isFetching ? 'Getting New Prompt...' : 'Get New Prompt'}
      </button>
    </div>
  );
}
