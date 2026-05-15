'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchIngredient();
  }, [id]);

  async function fetchIngredient() {
    try {
      const response = await fetch(`/api/ingredients-master/${id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load ingredient');
      }

      const data = await response.json();
      setIngredient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ingredient');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading ingredient...</div>;
  }

  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>;
  }

  if (!ingredient) {
    return <div className="text-center py-8">Ingredient not found</div>;
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl">
        <IngredientMasterForm initialData={ingredient} isEditing={true} />
      </div>
    </ProtectedRoute>
  );
}
