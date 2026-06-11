'use client';

import { useState, useEffect, useCallback } from 'react';
import { RecipeCard, RecipeCardProps } from './RecipeCard';
import { useFilter } from '../hooks/useFilter';
import { useFetch } from '../hooks/useFetch';

interface RecipesResponse {
  recipes: RecipeCardProps[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface RecipeListProps {
  phase?: string | null;
  minScore?: number;
}

export function RecipeList({ phase, minScore = 0 }: RecipeListProps) {
  const [recipes, setRecipes] = useState<RecipeCardProps[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { selectedIngredients } = useFilter();

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (selectedIngredients.length > 0) {
      params.set('ingredients', selectedIngredients.join(','));
    }
    if (phase) {
      params.set('phase', phase);
    }
    return `/api/recipes?${params}`;
  }, [page, selectedIngredients, phase]);

  const url = buildUrl();

  const handleSuccess = useCallback(
    (data: RecipesResponse) => {
      const filteredRecipes = data.recipes.filter((recipe: RecipeCardProps) => {
        if (recipe.score === undefined || recipe.score === null) {
          return true;
        }
        return recipe.score >= minScore;
      });
      setRecipes(filteredRecipes);
      setTotalPages(data.totalPages);
      setPage(data.page);
    },
    [minScore]
  );

  const { isLoading, error, fetch: fetchRecipes } = useFetch<RecipesResponse>(
    url,
    undefined,
    handleSuccess
  );

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-200 rounded w-full mb-1" />
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
  }

  if (recipes.length === 0) {
    return (
      <div className="bg-gray-100 p-8 rounded text-center">
        <p className="text-gray-600 mb-4">Keine Rezepte gefunden</p>
        <a href="/recipes/new" className="text-blue-600 hover:underline">
          Erstellen Sie Ihr erstes Rezept
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-600">
          {recipes.length} Rezepte gefunden
          {selectedIngredients.length > 0 && ` mit ${selectedIngredients.join(', ')}`}
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
            Vorherige
          </button>
          <span className="px-4 py-2 text-gray-600">
            Seite {page} von {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Nächste
          </button>
        </div>
      )}
    </div>
  );
}
