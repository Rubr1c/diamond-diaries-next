'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/ui/navbar';
import { useQuery } from '@tanstack/react-query';
import { getUser } from '@/lib/api';

const NavbarProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const excludedRoutes = ['/login', '/signup'];

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: getUser,
    retry: false,
    enabled: !excludedRoutes.includes(pathname),
  });

  return (
    <>
      {!excludedRoutes.includes(pathname) && <Navbar user={user} />}
      <main>{children}</main>
    </>
  );
};

export default NavbarProvider;
