'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '../../../../components/ProtectedRoute';
import { IngredientMasterForm } from '../../../../components/forms/IngredientMasterForm';
import { IngredientMaster } from '@/lib/db/models/ingredientMaster';

export default function EditIngredientPage() {
  const [ingredient, setIngredient] = useState<IngredientMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const id = params.id;

  const fetchIngredient = useCallback(async function fetchIngredient() {
    try {
      const response = await fetch(`/api/ingredients-master/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Zutat konnte nicht geladen werden');
      }

      const data = await response.json();
      setIngredient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zutat konnte nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIngredient();
  }, [fetchIngredient]);

  if (loading) {
    return <div className="text-center py-8">Zutat wird geladen...</div>;
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
  }

  if (!ingredient) {
    return <div className="text-center py-8">Zutat nicht gefunden</div>;
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl">
        <IngredientMasterForm initialData={ingredient} isEditing={true} />
      </div>
    </ProtectedRoute>
  );
}
