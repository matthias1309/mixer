'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RecipeCard, RecipeCardProps } from './RecipeCard';
import { Pagination } from './Pagination';
import { useFilter } from '../hooks/useFilter';
import { useFetch } from '../hooks/useFetch';
import { apiUrl } from '@lib/api-url';

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
  search?: string;
  sort?: string;
}

export function RecipeList({ phase, minScore = 0, search, sort }: RecipeListProps) {
  const [recipes, setRecipes] = useState<RecipeCardProps[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { selectedIngredients, selectedTags, difficulty, maxTime } = useFilter();

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (selectedIngredients.length > 0) {
      params.set('ingredients', selectedIngredients.join(','));
    }
    if (phase) {
      params.set('phase', phase);
    }
    if (search) {
      params.set('search', search);
    }
    if (sort) {
      params.set('sort', sort);
    }
    if (difficulty) {
      params.set('difficulty', difficulty);
    }
    if (maxTime) {
      params.set('maxTime', maxTime.toString());
    }
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
    }
    return apiUrl(`/api/recipes?${params}`);
  }, [page, selectedIngredients, phase, search, sort, difficulty, maxTime, selectedTags]);

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

  const {
    isLoading,
    error,
    fetch: fetchRecipes,
  } = useFetch<RecipesResponse>(url, undefined, handleSuccess);

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
        <Link href="/recipes/new" className="text-brand hover:underline">
          Erstellen Sie Ihr erstes Rezept
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-gray-600" data-testid="results-counter">
          {recipes.length} Rezepte gefunden
          {selectedIngredients.length > 0 && ` mit ${selectedIngredients.join(', ')}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} {...recipe} />
        ))}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
