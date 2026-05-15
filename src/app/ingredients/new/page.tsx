'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { IngredientMasterForm } from '../../../components/forms/IngredientMasterForm';

export default function NewIngredientPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-4xl">
        <IngredientMasterForm />
      </div>
    </ProtectedRoute>
  );
}
