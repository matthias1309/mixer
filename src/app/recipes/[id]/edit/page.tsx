'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { apiUrl } from '@lib/api-url';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { RecipeForm } from '../../../../components/forms/RecipeForm';

interface RecipeData {
  id: number;
  name: string;
  description: string | null;
  instructions: string | null;
  servings: number;
  ingredients: Array<{ name: string; quantity: number; unit: string }>;
  canEdit: boolean;
}

export default function EditRecipePage() {
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const id = params.id;

  const fetchRecipe = useCallback(async function fetchRecipe() {
    try {
      const response = await fetch(apiUrl(`/api/recipes/${id}`), {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.canEdit) {
        throw new Error('Cannot edit this recipe');
      }

      setRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  if (isLoading) {
    return <div>Rezept wird geladen...</div>;
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
  }

  if (!recipe) {
    return <div>Recipe not found</div>;
  }

  return (
    <ProtectedRoute>
      <RecipeForm initialData={recipe} isEditing={true} />
    </ProtectedRoute>
  );
}
