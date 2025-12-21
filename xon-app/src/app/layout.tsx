import './globals.css';

import type { Metadata } from 'next';
import Link from 'next/link';

import SearchBar from '@/components/SearchBar';

export const metadata: Metadata = {
  title: 'Xon App',
  description: 'Standalone Xon + Kartoons web app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <nav className="navbar">
          <Link href="/" className="logo">
            MeowTV
          </Link>
          <div className="nav-links">
            <Link href="/" className="nav-link">
              Home
            </Link>
          </div>
          <SearchBar />
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
