import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import NavbarProvider from '@/providers/navbar-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Diamond Diaries',
  description: 'A beautiful diary application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <NavbarProvider>
            {children}
          </NavbarProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
