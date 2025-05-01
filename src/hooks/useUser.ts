'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'; // Import useState
import { getUser } from '@/lib/api';
import { User } from '@/index/user';

export function useUser(): UseQueryResult<User, Error> {
  const router = useRouter();
  const [hasCheckedToken, setHasCheckedToken] = useState(false);
  const [tokenExists, setTokenExists] = useState<boolean | null>(null); // Use null initial state

  useEffect(() => {
    const token = localStorage.getItem('token');
    setTokenExists(!!token);
    setHasCheckedToken(true); 
  }, []); 

  const query = useQuery<User, Error>({
    queryKey: ['user', tokenExists], // Include token status in key
    queryFn: getUser,
    retry: false,
    refetchOnWindowFocus: false,
    // Only enable the query if the token check is done AND the token exists
    enabled: hasCheckedToken && tokenExists === true,
  });

  useEffect(() => {
  
    if (hasCheckedToken && tokenExists === false) {
      router.replace('/login');
    }
    // Condition 2: Query encountered an error (e.g., token invalid on server)
    else if (query.isError) {
      router.replace('/login');
    }
  }, [router, hasCheckedToken, tokenExists, query.isError, query.error]);

  return query;
}
