'use client';

import { useState, useEffect } from 'react';
import { RecipeCard, RecipeCardProps } from './RecipeCard';
import { useFilter } from '../hooks/useFilter';

interface RecipesResponse {
  recipes: RecipeCardProps[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function RecipeList() {
  const [recipes, setRecipes] = useState<RecipeCardProps[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { selectedIngredients } = useFilter();

  useEffect(() => {
    fetchRecipes();
  }, [page, selectedIngredients]);

  async function fetchRecipes() {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());

      if (selectedIngredients.length > 0) {
        params.set('ingredients', selectedIngredients.join(','));
      }

      const response = await fetch(`/api/recipes?${params}`, {
        credentials: 'include',
      });

      const data: RecipesResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recipes');
      }

      setRecipes(data.recipes);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading recipes...</div>;
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
  }

  if (recipes.length === 0) {
    return (
      <div className="bg-gray-100 p-8 rounded text-center">
        <p className="text-gray-600 mb-4">No recipes found</p>
        <a href="/recipes/new" className="text-blue-600 hover:underline">
          Create your first recipe
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-600">
          {recipes.length} recipes found
          {selectedIngredients.length > 0 && ` with ${selectedIngredients.join(', ')}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} {...recipe} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
