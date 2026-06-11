'use client';

import { useFilter } from '../hooks/useFilter';
import { useFetch } from '../hooks/useFetch';
import { useEffect, useState } from 'react';

interface IngredientsResponse {
  ingredients: string[];
}

export function IngredientFilter() {
  const { selectedIngredients, toggleIngredient, clearFilters } = useFilter();
  const { data, isLoading, error, fetch: fetchIngredients } = useFetch<IngredientsResponse>(
    '/api/recipes/ingredients'
  );
  const ingredients = data?.ingredients || [];
  const [search, setSearch] = useState('');
  const visibleIngredients = ingredients.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  if (isLoading) {
    return <div className="text-gray-600">Zutaten werden geladen...</div>;
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-3 text-gray-800">Nach Zutaten filtern</h2>

      <input
        type="text"
        placeholder="Zutaten suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm mb-3 focus:outline-blue-500"
      />

      {selectedIngredients.length > 0 && (
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:underline mb-3"
        >
          Filter löschen
        </button>
      )}

      <div className="space-y-2">
        {ingredients.length === 0 ? (
          <p className="text-gray-600 text-sm">Keine Zutaten verfügbar</p>
        ) : visibleIngredients.length === 0 ? (
          <p className="text-gray-500 text-sm">Keine Treffer für „{search}"</p>
        ) : (
          visibleIngredients.map((ingredient) => (
            <label key={ingredient} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIngredients.includes(ingredient)}
                onChange={() => toggleIngredient(ingredient)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-gray-700">{ingredient}</span>
            </label>
          ))
        )}
      </div>

      {selectedIngredients.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-semibold text-gray-700 mb-2">Ausgewählt:</p>
          <div className="flex flex-wrap gap-2">
            {selectedIngredients.map((ingredient) => (
              <span
                key={ingredient}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded"
              >
                {ingredient}
                <button
                  onClick={() => toggleIngredient(ingredient)}
                  className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
