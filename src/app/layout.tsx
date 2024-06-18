import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import Navbar from '@/components/navbar';
import { AuthProvider } from '@/context/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Invotastic',
  description: 'B2B Invoicing Software',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-[100vh]`}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-[100vh] p-8 pt-24 pb-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
