'use client';

import { useUser } from '@/hooks/useUser';

export default function Home() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return <div>Loading your profile…</div>;
  }

  return <h1>{user!.username}</h1>;
}
