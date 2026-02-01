import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import ProviderSwitcher from '@/components/ProviderSwitcher';

export const metadata: Metadata = {
  title: 'MeowTV',
  description: 'Streaming Movies, TV Series, Cartoons & More',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="app-body">
        <nav className="navbar">
          <div className="nav-shell">
            <div className="nav-left">
              <Link href="/" className="logo">
                <span className="logo-mark" aria-hidden="true" />
                <span className="logo-type">MeowTV</span>
              </Link>
              <div className="nav-links">
                <Link href="/" className="nav-link">Home</Link>
              </div>
            </div>

            <div className="nav-right">
              <SearchBar />
              <div className="nav-controls">
                <ProviderSwitcher />
              </div>
            </div>
          </div>
        </nav>
        <main className="page-shell">
          {children}
          <footer className="footer">
            <div className="footer-content">
              <p>This site does not store any files on our server, we only link to media which is hosted on 3rd party services.</p>
              <p>Made With 💚 By <strong>Utkarsh Gupta</strong> | <a href="https://github.com/utkarshgupta188" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a></p>
              <div className="footer-links">
                <Link href="/dmca" className="footer-link">DMCA</Link>
              </div>
              <p>© 2025 MeowTV</p>
            </div>
          </footer>
        </main>
      </body>
    </html>
  );
}
