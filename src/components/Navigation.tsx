'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useWakeLock } from '../hooks/useWakeLock';

export function Navigation() {
  const { user, logout } = useAuth();
  const { isSupported, isActive, toggle } = useWakeLock();

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          🍳 Recipe Manager
        </Link>

        <div className="flex gap-6 items-center">
          <Link href="/dashboard" className="hover:underline">
            Rezepte
          </Link>
          <Link href="/ingredients" className="hover:underline">
            Zutaten
          </Link>

          {user ? (
            <>
              <Link href="/cycle" className="hover:underline">
                Zyklus
              </Link>
              {isSupported && (
                <button
                  onClick={toggle}
                  aria-label="Bildschirm wach halten"
                  title={isActive ? 'Bildschirmsperre deaktivieren' : 'Bildschirmsperre aktivieren'}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    isActive
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-400 text-white border border-blue-300'
                  }`}
                >
                  {isActive ? 'Bildschirm: AN' : 'Bildschirm: AUS'}
                </button>
              )}
              <span className="text-sm opacity-75">{user.email}</span>
              <button
                onClick={() => logout()}
                className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
              >
                Abmelden
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Anmelden
              </Link>
              <Link href="/register" className="hover:underline">
                Registrieren
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
