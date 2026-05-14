'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { RecipeForm } from '../../../components/forms/RecipeForm';

export default function NewRecipePage() {
  return (
    <ProtectedRoute>
      <RecipeForm />
    </ProtectedRoute>
  );
}
