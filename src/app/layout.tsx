import type { Metadata } from 'next';
import { initializeDatabase } from '../lib/db/init';
import RootLayoutClient from './layout-client';
import '../styles/globals.css';

// Initialize database on server startup (before any requests)
initializeDatabase().catch(error => {
  console.error('Failed to initialize database on startup:', error);
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="bg-gray-50">
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
