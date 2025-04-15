'use client';

import { getUser } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    retry: false,
  });

  useEffect(() => {
    if (error) {
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [error, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
<<<<<<< HEAD
    router.push('/login');
=======
    // ...side effect handled in useEffect, render nothing
>>>>>>> 418f38328aad33ef58c7c4696a13bc4fd7bd0e59
    return null;
  }

  return <h1>{data?.username}</h1>;
}
