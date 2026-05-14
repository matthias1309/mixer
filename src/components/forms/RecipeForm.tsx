'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateRecipeName } from '../../lib/validation';

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeFormProps {
  initialData?: {
    id: number;
    name: string;
    description: string | null;
    instructions: string | null;
    servings: number;
    ingredients: Ingredient[];
  };
  isEditing?: boolean;
}

export function RecipeForm({ initialData, isEditing = false }: RecipeFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [servings, setServings] = useState(initialData?.servings || 1);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialData?.ingredients || []);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate
    const nameError = validateRecipeName(name);
    if (nameError) {
      setError(nameError);
      setIsLoading(false);
      return;
    }

    if (description.length > 500) {
      setError('Description must be max 500 characters');
      setIsLoading(false);
      return;
    }

    if (instructions.length > 2000) {
      setError('Instructions must be max 2000 characters');
      setIsLoading(false);
      return;
    }

    if (servings < 1) {
      setError('Servings must be at least 1');
      setIsLoading(false);
      return;
    }

    if (ingredients.length > 50) {
      setError('Maximum 50 ingredients allowed');
      setIsLoading(false);
      return;
    }

    try {
      const url = isEditing ? `/api/recipes/${initialData?.id}` : '/api/recipes';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        body: JSON.stringify({
          name,
          description: description || null,
          instructions: instructions || null,
          servings,
          ingredients,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save recipe');
      }

      // Redirect to recipe detail
      router.push(`/recipes/${data.id || initialData?.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
    } finally {
      setIsLoading(false);
    }
  }

  function addIngredient() {
    setIngredients([...ingredients, { name: '', quantity: 1, unit: 'g' }]);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, field: string, value: any) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Recipe' : 'Create Recipe'}</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Recipe Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full border rounded px-3 py-2 focus:outline-blue-500"
            disabled={isLoading}
            required
          />
          <p className="text-xs text-gray-500 mt-1">{name.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full border rounded px-3 py-2 focus:outline-blue-500"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium mb-1">Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            maxLength={2000}
            rows={5}
            className="w-full border rounded px-3 py-2 focus:outline-blue-500"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">{instructions.length}/2000</p>
        </div>

        {/* Servings */}
        <div>
          <label className="block text-sm font-medium mb-1">Servings</label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(parseInt(e.target.value))}
            min={1}
            className="w-full border rounded px-3 py-2 focus:outline-blue-500"
            disabled={isLoading}
          />
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-medium mb-2">Ingredients ({ingredients.length})</label>

          <div className="space-y-2 mb-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                  maxLength={100}
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  disabled={isLoading}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value))}
                  step="0.1"
                  min="0.1"
                  className="w-20 border rounded px-3 py-2 text-sm"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                  className="w-20 border rounded px-3 py-2 text-sm"
                  disabled={isLoading}
                  list="units"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                  disabled={isLoading}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addIngredient}
            className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
            disabled={isLoading || ingredients.length >= 50}
          >
            + Add Ingredient
          </button>

          <datalist id="units">
            <option value="g" />
            <option value="kg" />
            <option value="ml" />
            <option value="l" />
            <option value="tsp" />
            <option value="tbsp" />
            <option value="cup" />
          </datalist>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : isEditing ? 'Update Recipe' : 'Create Recipe'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
