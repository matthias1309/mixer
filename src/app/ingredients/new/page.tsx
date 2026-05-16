'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { IngredientMasterForm } from '../../../components/forms/IngredientMasterForm';

export const dynamic = 'force-dynamic';

export default function NewIngredientPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-4xl">
        <IngredientMasterForm />
      </div>
    </ProtectedRoute>
  );
}
