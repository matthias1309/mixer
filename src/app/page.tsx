'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          🍳 Rezept-Manager
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Entdecke Rezepte, die du mit deinen verfügbaren Zutaten kochen kannst
        </p>

        {user ? (
          <div className="space-y-4">
            <p className="text-lg text-gray-700">Willkommen, {user.email}!</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard"
                className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
              >
                Zum Dashboard
              </Link>
              <Link
                href="/recipes/new"
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
              >
                Rezept erstellen
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 justify-center">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
            >
              Registrieren
            </Link>
          </div>
        )}

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Rezepte erstellen</h3>
            <p className="text-gray-600">Teile deine Lieblingsrezepte mit der Gemeinschaft</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Intelligente Filterung</h3>
            <p className="text-gray-600">Finde Rezepte mit den Zutaten, die du zur Hand hast</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-2">Gemeinschaft</h3>
            <p className="text-gray-600">Erkunde Rezepte von anderen Kochbegeisterten</p>
          </div>
        </div>
      </div>
    </div>
  );
}
