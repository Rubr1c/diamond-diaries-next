'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getUser } from '@/lib/api';
import { User } from '@/index/user';

export function useUser(): UseQueryResult<User, unknown> {
  const router = useRouter();

  const query = useQuery<User>({
    queryKey: ['user'],
    queryFn: getUser,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.error) {
      localStorage.removeItem('token');
      router.replace('/login');
    }
  }, [query.error, router]);

  return query;
}
