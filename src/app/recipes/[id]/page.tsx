'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useFilter } from '../../../hooks/useFilter';

interface RecipeDetail {
  id: number;
  name: string;
  description: string | null;
  instructions: string | null;
  servings: number;
  creatorName: string;
  creatorId: number;
  ingredients: Array<{ id: number; name: string; quantity: number; unit: string | null }>;
  nutrients?: Record<string, number>;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function RecipeDetailPage() {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { selectedIngredients } = useFilter();

  const id = params.id;

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  async function fetchRecipe() {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Recipe not found');
      }

      setRecipe(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Sind Sie sicher, dass Sie dieses Rezept löschen möchten?')) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe');
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Rezept wird geladen...</div>;
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
  }

  if (!recipe) {
    return <div className="text-center py-8">Recipe not found</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{recipe.name}</h1>
            <p className="text-gray-600">by {recipe.creatorName}</p>
          </div>
          {recipe.canEdit && (
            <div className="flex gap-2">
              <a
                href={`/recipes/${recipe.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Edit
              </a>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        {recipe.description && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">Description</h2>
            <p className="text-gray-700">{recipe.description}</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Ingredients (Servings: {recipe.servings})</h2>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing) => {
              const isSelected = selectedIngredients.includes(ing.name.toLowerCase());
              return (
                <li
                  key={ing.id}
                  className={`flex items-center gap-2 p-2 rounded ${
                    isSelected ? 'bg-green-100 text-green-800' : ''
                  }`}
                >
                  {isSelected && <span className="text-green-600">✓</span>}
                  <span>
                    {ing.quantity} {ing.unit} {ing.name}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {recipe.nutrients && Object.values(recipe.nutrients).some(v => v > 0) && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3">Nährwerte</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'kcal', label: 'Kalorien', unit: 'kcal' },
                { key: 'protein', label: 'Protein', unit: 'g' },
                { key: 'fat', label: 'Fett', unit: 'g' },
                { key: 'carbohydrates', label: 'Kohlenhydrate', unit: 'g' },
                { key: 'sugar', label: 'Zucker', unit: 'g' },
                { key: 'fiber', label: 'Ballaststoffe', unit: 'g' },
                { key: 'sodium', label: 'Natrium', unit: 'mg' },
                { key: 'calcium', label: 'Calcium', unit: 'mg' },
                { key: 'iron', label: 'Iron', unit: 'mg' },
                { key: 'magnesium', label: 'Magnesium', unit: 'mg' },
                { key: 'zinc', label: 'Zinc', unit: 'mg' },
                { key: 'vitamin_d', label: 'Vitamin D', unit: 'mcg' },
                { key: 'vitamin_e', label: 'Vitamin E', unit: 'mg' },
                { key: 'vitamin_b6', label: 'Vitamin B6', unit: 'mg' },
                { key: 'vitamin_b12', label: 'Vitamin B12', unit: 'mcg' },
              ].map(({ key, label, unit }) => {
                const value = recipe.nutrients?.[key] || 0;
                if (value === 0) return null;
                return (
                  <div key={key} className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">{label}</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {value.toFixed(2)} {unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {recipe.instructions && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">Instructions</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{recipe.instructions}</p>
          </div>
        )}

        <div className="text-sm text-gray-500 border-t pt-4">
          <p>Created: {new Date(recipe.createdAt).toLocaleString()}</p>
          {recipe.updatedAt !== recipe.createdAt && (
            <p>Last updated: {new Date(recipe.updatedAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <a
          href="/dashboard"
          className="text-blue-600 hover:underline"
        >
          ← Zurück zum Dashboard
        </a>
      </div>
    </div>
  );
}
