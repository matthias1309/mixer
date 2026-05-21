'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IngredientMaster } from '@/lib/db/models/ingredientMaster';
import { SUPPORTED_UNITS } from '@/lib/units/constants';

const UNIT_OPTIONS = Object.keys(SUPPORTED_UNITS) as (keyof typeof SUPPORTED_UNITS)[];

interface IngredientMasterFormProps {
  initialData?: IngredientMaster;
  isEditing?: boolean;
}

export function IngredientMasterForm({
  initialData,
  isEditing = false,
}: IngredientMasterFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [baseUnit, setBaseUnit] = useState(initialData?.base_unit || 'g');
  const [baseSize, setBaseSize] = useState(initialData?.base_size || 100);

  const [kcal, setKcal] = useState(initialData?.kcal || '');
  const [sugar, setSugar] = useState(initialData?.sugar || '');
  const [fat, setFat] = useState(initialData?.fat || '');
  const [protein, setProtein] = useState(initialData?.protein || '');
  const [carbohydrates, setCarbohydrates] = useState(initialData?.carbohydrates || '');
  const [fiber, setFiber] = useState(initialData?.fiber || '');
  const [salt, setSalt] = useState(initialData?.salt || '');
  const [sodium, setSodium] = useState(initialData?.sodium || '');
  const [calcium, setCalcium] = useState(initialData?.calcium || '');
  const [vitaminD, setVitaminD] = useState(initialData?.vitamin_d || '');
  const [magnesium, setMagnesium] = useState(initialData?.magnesium || '');
  const [vitaminB6, setVitaminB6] = useState(initialData?.vitamin_b6 || '');
  const [vitaminB12, setVitaminB12] = useState(initialData?.vitamin_b12 || '');
  const [vitaminE, setVitaminE] = useState(initialData?.vitamin_e || '');
  const [iron, setIron] = useState(initialData?.iron || '');
  const [zinc, setZinc] = useState(initialData?.zinc || '');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name.trim()) {
      setError('Zutatname ist erforderlich');
      setIsLoading(false);
      return;
    }

    if (name.length > 255) {
      setError('Zutatname darf höchstens 255 Zeichen lang sein');
      setIsLoading(false);
      return;
    }

    try {
      const url = isEditing
        ? `/api/ingredients-master/${initialData?.id}`
        : '/api/ingredients-master';
      const method = isEditing ? 'PUT' : 'POST';

      const body: any = {
        name: name.trim(),
        category: category.trim() || undefined,
        base_unit: baseUnit || 'g',
        base_size: baseSize || 100,
      };

      // Add nutrients only if not empty
      if (kcal) body.kcal = parseFloat(kcal as string);
      if (sugar) body.sugar = parseFloat(sugar as string);
      if (fat) body.fat = parseFloat(fat as string);
      if (protein) body.protein = parseFloat(protein as string);
      if (carbohydrates) body.carbohydrates = parseFloat(carbohydrates as string);
      if (fiber) body.fiber = parseFloat(fiber as string);
      if (salt) body.salt = parseFloat(salt as string);
      if (sodium) body.sodium = parseFloat(sodium as string);
      if (calcium) body.calcium = parseFloat(calcium as string);
      if (vitaminD) body.vitamin_d = parseFloat(vitaminD as string);
      if (magnesium) body.magnesium = parseFloat(magnesium as string);
      if (vitaminB6) body.vitamin_b6 = parseFloat(vitaminB6 as string);
      if (vitaminB12) body.vitamin_b12 = parseFloat(vitaminB12 as string);
      if (vitaminE) body.vitamin_e = parseFloat(vitaminE as string);
      if (iron) body.iron = parseFloat(iron as string);
      if (zinc) body.zinc = parseFloat(zinc as string);

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Speichern der Zutat');
      }

      router.push(`/ingredients`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern der Zutat');
    } finally {
      setIsLoading(false);
    }
  }

  const nutrientInputs = [
    { label: 'kcal', value: kcal, onChange: setKcal, unit: 'kcal' },
    { label: 'Protein', value: protein, onChange: setProtein, unit: 'g' },
    { label: 'Fett', value: fat, onChange: setFat, unit: 'g' },
    { label: 'Kohlenhydrate', value: carbohydrates, onChange: setCarbohydrates, unit: 'g' },
    { label: 'Zucker', value: sugar, onChange: setSugar, unit: 'g' },
    { label: 'Ballaststoffe', value: fiber, onChange: setFiber, unit: 'g' },
    { label: 'Salz', value: salt, onChange: setSalt, unit: 'mg' },
    { label: 'Natrium', value: sodium, onChange: setSodium, unit: 'mg' },
    { label: 'Calcium', value: calcium, onChange: setCalcium, unit: 'mg' },
    { label: 'Vitamin D', value: vitaminD, onChange: setVitaminD, unit: 'mcg' },
    { label: 'Magnesium', value: magnesium, onChange: setMagnesium, unit: 'mg' },
    { label: 'Vitamin B6', value: vitaminB6, onChange: setVitaminB6, unit: 'mg' },
    { label: 'Vitamin B12', value: vitaminB12, onChange: setVitaminB12, unit: 'mcg' },
    { label: 'Vitamin E', value: vitaminE, onChange: setVitaminE, unit: 'mg' },
    { label: 'Eisen', value: iron, onChange: setIron, unit: 'mg' },
    { label: 'Zink', value: zinc, onChange: setZinc, unit: 'mg' },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Zutat bearbeiten' : 'Neue Zutat erstellen'}
      </h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="space-y-4">
        {/* Basic Info */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-semibold mb-3">Grundinformationen</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Zutatname *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              className="w-full border rounded px-3 py-2 focus:outline-blue-500"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{name.length}/255</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 mt-3">Kategorie</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="z.B. Gemüse, Proteine, Getreide"
              className="w-full border rounded px-3 py-2 focus:outline-blue-500"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium mb-1">Basiseinheit</label>
              <select
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-blue-500 bg-white"
                disabled={isLoading}
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Basisgröße</label>
              <input
                type="number"
                value={baseSize}
                onChange={(e) => setBaseSize(parseInt(e.target.value) || 100)}
                placeholder="100"
                className="w-full border rounded px-3 py-2 focus:outline-blue-500"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Nutrients */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Nährwerte (pro {baseSize} {baseUnit})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {nutrientInputs.map((nutrient) => (
              <div key={nutrient.label}>
                <label className="block text-sm font-medium mb-1">{nutrient.label}</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={nutrient.value}
                    onChange={(e) => nutrient.onChange(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    className="flex-1 border rounded px-3 py-2 focus:outline-blue-500 text-sm"
                    disabled={isLoading}
                  />
                  <span className="text-xs text-gray-500 flex items-center px-2">
                    {nutrient.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6 border-t pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Speichern...' : isEditing ? 'Zutat aktualisieren' : 'Zutat erstellen'}
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
