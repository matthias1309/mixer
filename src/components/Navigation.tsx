'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { useWakeLock } from '../hooks/useWakeLock';

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      width="18"
      height="18"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="19.78" y1="4.22" x2="17.66" y2="6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="6.34" y1="17.66" x2="4.22" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

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

          {isSupported && (
            <button
              onClick={toggle}
              aria-label="Bildschirm wach halten"
              title={isActive ? 'Bildschirmsperre deaktivieren' : 'Bildschirmsperre aktivieren'}
              className={`p-1.5 rounded transition-colors ${
                isActive
                  ? 'text-yellow-300 hover:text-yellow-100'
                  : 'text-white opacity-50 hover:opacity-80'
              }`}
            >
              <SunIcon />
            </button>
          )}

          {user ? (
            <>
              <Link href="/cycle" className="hover:underline">
                Zyklus
              </Link>
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
