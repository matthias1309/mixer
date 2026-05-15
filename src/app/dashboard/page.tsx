'use client';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import { RecipeList } from '../../components/RecipeList';
import { IngredientFilter } from '../../components/IngredientFilter';
import CycleForm from '../../components/cycle/CycleForm';
import CycleInfo from '../../components/cycle/CycleInfo';
import PhaseFilter from '../../components/recipe/PhaseFilter';
import { useState } from 'react';

// Note: Metadata cannot be exported from a client component
// This will be handled in a layout.tsx if needed
export default function DashboardPage() {
  const [cycleInitialized, setCycleInitialized] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState('menstruation');

  return (
    <ProtectedRoute>
      <div className="py-6">
        <h1 className="text-3xl font-bold mb-6">Recipe Dashboard</h1>

        {/* Cycle Tracking Section */}
        <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <CycleForm onSave={() => setCycleInitialized(true)} />
            </div>
            <div>
              <CycleInfo />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Ingredient Filter</h3>
                <IngredientFilter />
              </div>
              <div>
                <h3 className="font-bold mb-2">Phase Filter</h3>
                <PhaseFilter
                  onFilterChange={(phase) => setSelectedPhase(phase)}
                  currentPhase={selectedPhase}
                />
              </div>
            </div>
          </div>

          {/* Recipe list */}
          <div className="lg:col-span-3">
            <RecipeList />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <a
            href="/recipes/new"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            + Create Recipe
          </a>
          <a
            href="/recipes/upload"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            📸 Upload from Photo
          </a>
        </div>
      </div>
    </ProtectedRoute>
  );
}
