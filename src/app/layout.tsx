'use client';

import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/AuthContext';
import { FilterProvider } from '../contexts/FilterContext';
import { Navigation } from '../components/Navigation';
import '../styles/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <AuthProvider>
          <FilterProvider>
            <Navigation />
            <main className="max-w-6xl mx-auto p-4">
              {children}
            </main>
          </FilterProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
