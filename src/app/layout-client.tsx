'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { FilterProvider } from '../contexts/FilterContext';
import { Navigation } from '../components/Navigation';

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <FilterProvider>
        <Navigation />
        <main className="max-w-6xl mx-auto p-4">
          {children}
        </main>
      </FilterProvider>
    </AuthProvider>
  );
}
