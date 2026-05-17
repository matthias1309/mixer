'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { IngredientMaster } from '@/lib/db/models/ingredientMaster';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<IngredientMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchIngredients = useCallback(async function fetchIngredients() {
    setLoading(true);
    setError('');

    try {
      const url = new URL('/api/ingredients-master', window.location.origin);
      if (search) {
        url.searchParams.set('search', search);
      }

      const response = await fetch(url.toString(), {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden von Zutaten');
      }

      const data = await response.json();
      setIngredients(data.ingredients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden von Zutaten');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  async function handleDelete(id: number) {
    if (!confirm('Sind Sie sicher, dass Sie diese Zutat löschen möchten?')) return;

    setDeleting(id);

    try {
      const response = await fetch(`/api/ingredients-master/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Zutat');
      }

      await fetchIngredients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen der Zutat');
      setDeleting(null);
    }
  }

  return (
    <ProtectedRoute>
      <div className="max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Zutaten verwalten</h1>
          <a
            href="/ingredients/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Zutat hinzufügen
          </a>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <input
            type="text"
            placeholder="Zutaten durchsuchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Zutaten werden geladen...</div>
        ) : ingredients.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            Keine Zutaten vorhanden. {search ? 'Versuchen Sie eine andere Suche.' : 'Erstellen Sie eine Zutat, um zu beginnen.'}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Kategorie</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">kcal</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Protein (g)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Fett (g)</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Kohlenhydrate (g)</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ingredient) => (
                  <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{ingredient.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {ingredient.category || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {ingredient.kcal || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {ingredient.protein || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {ingredient.fat || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {ingredient.carbohydrates || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`/ingredients/${ingredient.id}/edit`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Bearbeiten
                        </a>
                        <button
                          onClick={() => handleDelete(ingredient.id)}
                          disabled={deleting === ingredient.id}
                          className="text-red-600 hover:underline text-sm disabled:opacity-50"
                        >
                          {deleting === ingredient.id ? 'Wird gelöscht...' : 'Löschen'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <a href="/dashboard" className="text-blue-600 hover:underline">
            ← Zurück zum Dashboard
          </a>
        </div>
      </div>
    </ProtectedRoute>
  );
}
