'use client';

import { getUser } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

export default function Account() {
  const router = useRouter();
  const { data: user, error } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    retry: false,
  });

  if (error) {
    localStorage.removeItem('token');
    router.push('/login');
    return null;
  }

  return (
    <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <div className="mt-4">
            <p className="text-lg">Username: {user?.username}</p>
            <p className="text-lg">Email: {user?.email}</p>
            <div className="text-lg flex items-center">
                <span>Enable 2FA: </span>
                <button
                    className={`ml-2 px-4 py-2 rounded ${
                        user?.enabled2fa ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'
                    }`}
                    onClick={() => {
                        // Add logic to toggle 2FA here
                        console.log('Toggle 2FA clicked');
                    }}
                >
                    {user?.enabled2fa ? 'Enabled' : 'Disabled'}
                </button>
            </div>
            <div className="text-lg flex items-center mt-4">
                <span>Allow AI Title Access: </span>
                <button
                    className={`ml-2 px-4 py-2 rounded ${
                        user?.aiAllowTitleAccess ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'
                    }`}
                    onClick={() => {
                        // Add logic to toggle AI Title Access here
                        console.log('Toggle AI Title Access clicked');
                    }}
                >
                    {user?.aiAllowTitleAccess ? 'Enabled' : 'Disabled'}
                </button>
            </div>
            <div className="text-lg flex items-center mt-4">
                <span>Allow AI Content Access: </span>
                <button
                    className={`ml-2 px-4 py-2 rounded ${
                        user?.aiAllowContentAccess ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'
                    }`}
                    onClick={() => {
                        // Add logic to toggle AI Content Access here
                        console.log('Toggle AI Content Access clicked');
                    }}
                >
                    {user?.aiAllowContentAccess ? 'Enabled' : 'Disabled'}
                </button>
            </div>
        </div>
    </div>
  );
}
