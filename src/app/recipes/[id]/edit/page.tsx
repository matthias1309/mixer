'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  async function fetchRecipe() {
    try {
      const response = await fetch(`/api/recipes/${id}`, {
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
  }

  if (isLoading) {
    return <div>Loading recipe...</div>;
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
