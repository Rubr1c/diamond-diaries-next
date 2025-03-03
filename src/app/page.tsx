'use client'

import { getUser } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
export default function Home() {
  const router = useRouter();
  const { data, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.log(error);
    localStorage.removeItem('token');
    router.push('/login');
  }

  return <div>{data?.username}</div>;
}
