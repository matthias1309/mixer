'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@lib/api-url';
import { validateRecipeName } from '../../lib/validation';
import { IngredientAutocomplete } from './IngredientAutocomplete';
import { CreateIngredientModal } from '../modals/CreateIngredientModal';
import { SUPPORTED_UNITS } from '../../lib/units/constants';

const UNIT_OPTIONS = Object.keys(SUPPORTED_UNITS) as (keyof typeof SUPPORTED_UNITS)[];

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  masterId?: number;
}

export interface RecipeFormProps {
  initialData?: {
    id: number;
    name: string;
    description: string | null;
    instructions: string | null;
    servings: number;
    ingredients: Ingredient[];
    imagePath?: string | null;
  };
  isEditing?: boolean;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB, mirrors UPLOAD_CONFIG

export function RecipeForm({ initialData, isEditing = false }: RecipeFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [instructions, setInstructions] = useState(initialData?.instructions || '');
  const [servings, setServings] = useState(initialData?.servings || 1);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialData?.ingredients || []);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imagePath ? apiUrl(`/api/recipes/${initialData.id}/image`) : null
  );
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalQuery, setCreateModalQuery] = useState('');
  const router = useRouter();

  // Release object URLs created for the photo preview to avoid a memory leak.
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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
      setError('Beschreibung muss maximal 500 Zeichen lang sein');
      setIsLoading(false);
      return;
    }

    if (instructions.length > 2000) {
      setError('Anweisungen müssen maximal 2000 Zeichen lang sein');
      setIsLoading(false);
      return;
    }

    if (servings < 1) {
      setError('Portionen müssen mindestens 1 sein');
      setIsLoading(false);
      return;
    }

    if (ingredients.length > 50) {
      setError('Maximal 50 Zutaten erlaubt');
      setIsLoading(false);
      return;
    }

    try {
      const url = apiUrl(isEditing ? `/api/recipes/${initialData?.id}` : '/api/recipes');
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(data.error || 'Rezept konnte nicht gespeichert werden');
      }

      const recipeId = data.id || initialData?.id;

      // Upload the photo separately once the recipe id is known.
      if (imageFile && recipeId) {
        const imageData = new FormData();
        imageData.append('file', imageFile);

        const imageResponse = await fetch(apiUrl(`/api/recipes/${recipeId}/image`), {
          method: 'POST',
          credentials: 'include',
          body: imageData,
        });

        if (!imageResponse.ok) {
          const imageError = await imageResponse.json();
          throw new Error(imageError.error || 'Foto konnte nicht hochgeladen werden');
        }
      }

      // Redirect to recipe detail
      router.push(`/recipes/${recipeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rezept konnte nicht gespeichert werden');
    } finally {
      setIsLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Nur JPG- und PNG-Bilder werden unterstützt');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Das Bild darf maximal 5 MB groß sein');
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function addIngredient() {
    setIngredients([...ingredients, { name: '', quantity: 1, unit: 'g' }]);
  }

  function handleSelectIngredient(ingredient: { id: number; name: string }) {
    setIngredients([
      ...ingredients,
      { name: ingredient.name, quantity: 1, unit: 'g', masterId: ingredient.id },
    ]);
  }

  async function handleCreateNewIngredient(ingredientName: string) {
    const response = await fetch(apiUrl('/api/ingredients-master'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: ingredientName }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Zutat konnte nicht erstellt werden');
    }

    const newIngredient = await response.json();
    setIngredients([
      ...ingredients,
      { name: newIngredient.name, quantity: 1, unit: 'g', masterId: newIngredient.id },
    ]);
    setCreateModalOpen(false);
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
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Rezept bearbeiten' : 'Rezept erstellen'}
      </h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Rezeptname *</label>
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
          <label className="block text-sm font-medium mb-1">Beschreibung</label>
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

        {/* Photo */}
        <div>
          <label className="block text-sm font-medium mb-1">Foto</label>
          {imagePreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt="Rezeptfoto Vorschau"
              className="mb-2 w-full max-h-64 object-cover rounded"
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleImageChange}
            className="w-full text-sm"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">JPG oder PNG, maximal 5 MB</p>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium mb-1">Anleitung</label>
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
          <label className="block text-sm font-medium mb-1">Portionen</label>
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
          <label className="block text-sm font-medium mb-2">Zutaten ({ingredients.length})</label>

          <div className="space-y-2 mb-3">
            {/* Autocomplete for adding ingredients from database */}
            <div className="flex gap-2">
              <div className="flex-1">
                <IngredientAutocomplete
                  onSelect={handleSelectIngredient}
                  onCreateNew={(query) => {
                    setCreateModalQuery(query);
                    setCreateModalOpen(true);
                  }}
                  addedIngredientIds={ingredients.flatMap((i) =>
                    i.masterId !== undefined ? [i.masterId] : []
                  )}
                />
              </div>
              <button
                type="button"
                onClick={addIngredient}
                className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
                disabled={isLoading || ingredients.length >= 50}
              >
                + Manuell
              </button>
            </div>

            {/* Existing ingredients list */}
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Zutatname"
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                  maxLength={100}
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Menge"
                  value={Math.round(ing.quantity)}
                  onChange={(e) => {
                    const val = e.target.value.replace(',', '.');
                    const num = parseInt(val);
                    updateIngredient(idx, 'quantity', isNaN(num) ? 0 : num);
                  }}
                  className="w-20 border rounded px-3 py-2 text-sm"
                  disabled={isLoading}
                />
                <select
                  value={ing.unit}
                  onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                  className="w-24 border rounded px-2 py-2 text-sm bg-white"
                  disabled={isLoading}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                  disabled={isLoading}
                >
                  Entfernen
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for creating new ingredient */}
        <CreateIngredientModal
          isOpen={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            setCreateModalQuery('');
          }}
          onCreate={handleCreateNewIngredient}
          suggestedName={createModalQuery}
        />

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Speichern...' : isEditing ? 'Rezept aktualisieren' : 'Rezept erstellen'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            disabled={isLoading}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </form>
  );
}
