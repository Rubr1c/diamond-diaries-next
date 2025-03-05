'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { handleOAuthCallback } from '@/lib/api';

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const success = handleOAuthCallback();
    if (success) {
      router.push('/');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-white">Loading...</div>
    </div>
  );
}