'use client';

import { useFilter } from '../hooks/useFilter';
import { useState, useEffect } from 'react';

export function IngredientFilter() {
  const { selectedIngredients, toggleIngredient, clearFilters } = useFilter();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, []);

  async function fetchIngredients() {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/recipes/ingredients', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ingredients');
      }

      const data = await response.json();
      setIngredients(data.ingredients || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ingredients');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <div className="text-gray-600">Loading ingredients...</div>;
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-3 rounded text-sm">{error}</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4 text-gray-800">Filter by Ingredients</h2>

      {selectedIngredients.length > 0 && (
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:underline mb-3"
        >
          Clear filters
        </button>
      )}

      <div className="space-y-2">
        {ingredients.length === 0 ? (
          <p className="text-gray-600 text-sm">No ingredients available</p>
        ) : (
          ingredients.map((ingredient) => (
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
          <p className="text-sm font-semibold text-gray-700 mb-2">Selected:</p>
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
