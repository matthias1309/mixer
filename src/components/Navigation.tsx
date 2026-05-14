'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          🍳 Recipe Manager
        </Link>

        <div className="flex gap-4">
          {user ? (
            <>
              <span className="text-sm">{user.email}</span>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <button
                onClick={() => logout()}
                className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Login
              </Link>
              <Link href="/register" className="hover:underline">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
