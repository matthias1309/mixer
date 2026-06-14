'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiUrl } from '@lib/api-url';
import { useAuth } from '../../../hooks/useAuth';
import { useFilter } from '../../../hooks/useFilter';
import { ServingsControl } from '../../../components/recipe/ServingsControl';

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
  const [currentServings, setCurrentServings] = useState(0);
  const [scaledIngredients, setScaledIngredients] = useState<RecipeDetail['ingredients'] | null>(
    null
  );
  const [isScaling, setIsScaling] = useState(false);
  const [scalingError, setScalingError] = useState('');
  const [scaledNutrients, setScaledNutrients] = useState<Record<string, number> | null>(null);
  const [isNutrientsOpen, setIsNutrientsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { selectedIngredients } = useFilter();

  const id = params.id;

  const fetchRecipe = useCallback(
    async function fetchRecipe() {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(apiUrl(`/api/recipes/${id}`), {
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Rezept nicht gefunden');
        }

        setRecipe(data);
        setCurrentServings(data.servings);
        setScaledIngredients(null);
        setScaledNutrients(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rezept konnte nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    },
    [id]
  );

  const handleScaleServings = useCallback(
    async (newServings: number) => {
      if (!recipe || isScaling) return;
      setIsScaling(true);
      setScalingError('');
      try {
        const response = await fetch(apiUrl(`/api/recipes/${id}/scale`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ newServings }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Skalierung fehlgeschlagen');
        }
        setScaledIngredients(data.ingredients);
        setCurrentServings(newServings);
        if (recipe.nutrients) {
          const factor = newServings / recipe.servings;
          const scaled: Record<string, number> = {};
          for (const [key, val] of Object.entries(recipe.nutrients)) {
            scaled[key] = Math.round(val * factor * 100) / 100;
          }
          setScaledNutrients(scaled);
        }
      } catch (err) {
        setScalingError(err instanceof Error ? err.message : 'Skalierung fehlgeschlagen');
      } finally {
        setIsScaling(false);
      }
    },
    [id, recipe, isScaling]
  );

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  async function handleDeleteConfirm() {
    setIsDeleting(true);
    setIsDeleteModalOpen(false);

    try {
      const response = await fetch(apiUrl(`/api/recipes/${id}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Rezept konnte nicht gelöscht werden');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rezept konnte nicht gelöscht werden');
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
    return <div className="text-center py-8">Rezept nicht gefunden</div>;
  }

  const displayNutrients = scaledNutrients ?? recipe.nutrients;

  return (
    <div className="max-w-2xl">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{recipe.name}</h1>
            <p className="text-gray-600">von {recipe.creatorName}</p>
          </div>
          {recipe.canEdit && (
            <div className="flex gap-2">
              <Link
                href={`/recipes/${recipe.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Bearbeiten
              </Link>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isDeleting}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Wird gelöscht...' : 'Löschen'}
              </button>
            </div>
          )}
        </div>

        {recipe.description && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">Beschreibung</h2>
            <p className="text-gray-700">{recipe.description}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="mb-2">
            <ServingsControl
              servings={currentServings}
              originalServings={recipe.servings}
              isLoading={isScaling}
              onDecrease={() => handleScaleServings(currentServings - 1)}
              onIncrease={() => handleScaleServings(currentServings + 1)}
            />
          </div>
          {scalingError && <p className="text-red-600 text-sm mb-2">{scalingError}</p>}
          <ul className="space-y-1">
            {(scaledIngredients ?? recipe.ingredients).map((ing) => {
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

        {recipe.instructions && (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-2">Anweisungen</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{recipe.instructions}</p>
          </div>
        )}

        {displayNutrients && Object.values(displayNutrients).some((v) => v > 0) && (
          <div className="mb-6">
            <button
              onClick={() => setIsNutrientsOpen((open) => !open)}
              className="flex items-center gap-2 w-full text-left text-lg font-bold mb-3 hover:text-blue-600 transition-colors"
            >
              <span>Nährwerte</span>
              <span className="text-gray-400 text-sm font-normal">
                {isNutrientsOpen ? '▲ ausblenden' : '▼ anzeigen'}
              </span>
            </button>
            {isNutrientsOpen && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'kcal', label: 'Kalorien', unit: 'kcal' },
                  { key: 'protein', label: 'Protein', unit: 'g' },
                  { key: 'fat', label: 'Fett', unit: 'g' },
                  { key: 'carbohydrates', label: 'Kohlenhydrate', unit: 'g' },
                  { key: 'sugar', label: 'Zucker', unit: 'g' },
                  { key: 'fiber', label: 'Ballaststoffe', unit: 'g' },
                  { key: 'salt', label: 'Salz', unit: 'mg' },
                  { key: 'sodium', label: 'Natrium', unit: 'mg' },
                  { key: 'calcium', label: 'Calcium', unit: 'mg' },
                  { key: 'iron', label: 'Eisen', unit: 'mg' },
                  { key: 'magnesium', label: 'Magnesium', unit: 'mg' },
                  { key: 'zinc', label: 'Zink', unit: 'mg' },
                  { key: 'vitamin_d', label: 'Vitamin D', unit: 'mcg' },
                  { key: 'vitamin_e', label: 'Vitamin E', unit: 'mg' },
                  { key: 'vitamin_b6', label: 'Vitamin B6', unit: 'mg' },
                  { key: 'vitamin_b12', label: 'Vitamin B12', unit: 'mcg' },
                ].map(({ key, label, unit }) => {
                  const value = displayNutrients[key] || 0;
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
            )}
          </div>
        )}

        <div className="text-sm text-gray-500 border-t pt-4">
          <p>Erstellt: {new Date(recipe.createdAt).toLocaleString()}</p>
          {recipe.updatedAt !== recipe.createdAt && (
            <p>Zuletzt aktualisiert: {new Date(recipe.updatedAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← Zurück zum Dashboard
        </Link>
      </div>

      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onKeyDown={(e) => e.key === 'Escape' && setIsDeleteModalOpen(false)}
        >
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h2 className="text-xl font-bold mb-3">Rezept löschen</h2>
            <p className="text-gray-700 mb-6">
              Möchten Sie <strong>„{recipe.name}"</strong> wirklich löschen? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                autoFocus
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Wird gelöscht…' : 'Ja, löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
