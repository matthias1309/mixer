'use client';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import { RecipeList } from '../../components/RecipeList';
import { IngredientFilter } from '../../components/IngredientFilter';

// Note: Metadata cannot be exported from a client component
// This will be handled in a layout.tsx if needed
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="py-6">
        <h1 className="text-3xl font-bold mb-6">Recipe Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter sidebar */}
          <div className="lg:col-span-1">
            <IngredientFilter />
          </div>

          {/* Recipe list */}
          <div className="lg:col-span-3">
            <RecipeList />
          </div>
        </div>

        <div className="mt-6">
          <a
            href="/recipes/new"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            + Create Recipe
          </a>
        </div>
      </div>
    </ProtectedRoute>
  );
}
