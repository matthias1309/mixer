'use client';

import Link from 'next/link';
import { useState } from 'react';
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
      <line
        x1="12"
        y1="2"
        x2="12"
        y2="5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="19"
        x2="12"
        y2="22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="2"
        y1="12"
        x2="5"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="19"
        y1="12"
        x2="22"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="4.22"
        y1="4.22"
        x2="6.34"
        y2="6.34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="17.66"
        y1="17.66"
        x2="19.78"
        y2="19.78"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="19.78"
        y1="4.22"
        x2="17.66"
        y2="6.34"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="6.34"
        y1="17.66"
        x2="4.22"
        y2="19.78"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      width="22"
      height="22"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function Navigation() {
  const { user, logout } = useAuth();
  const { isSupported, isActive, toggle } = useWakeLock();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-blue-600 text-white p-4 relative">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          🍳 Recipe Manager
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <div className="hidden md:flex gap-6 items-center">
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

        {/* Mobile right side: wake lock + hamburger */}
        <div className="flex md:hidden items-center gap-3">
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
          <button
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label="Menü öffnen"
            aria-expanded={isMobileMenuOpen}
            className="p-1.5 rounded hover:bg-blue-500"
          >
            <HamburgerIcon />
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            aria-hidden="true"
            onClick={closeMobileMenu}
            data-testid="mobile-menu-backdrop"
          />
          {/* Menu panel */}
          <div
            className="absolute top-full left-0 w-full bg-blue-700 z-20 py-2 shadow-lg"
            data-testid="mobile-menu"
          >
            <Link
              href="/dashboard"
              className="block px-6 py-3 hover:bg-blue-600"
              onClick={closeMobileMenu}
            >
              Rezepte
            </Link>
            <Link
              href="/ingredients"
              className="block px-6 py-3 hover:bg-blue-600"
              onClick={closeMobileMenu}
            >
              Zutaten
            </Link>
            {user ? (
              <>
                <Link
                  href="/cycle"
                  className="block px-6 py-3 hover:bg-blue-600"
                  onClick={closeMobileMenu}
                >
                  Zyklus
                </Link>
                <span className="block px-6 py-3 text-sm opacity-75">{user.email}</span>
                <button
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="block w-full text-left px-6 py-3 hover:bg-blue-600"
                >
                  Abmelden
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-6 py-3 hover:bg-blue-600"
                  onClick={closeMobileMenu}
                >
                  Anmelden
                </Link>
                <Link
                  href="/register"
                  className="block px-6 py-3 hover:bg-blue-600"
                  onClick={closeMobileMenu}
                >
                  Registrieren
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </nav>
  );
}
