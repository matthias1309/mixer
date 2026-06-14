'use client';

import { apiUrl } from '@lib/api-url';
import { RecipeList } from '../../components/RecipeList';
import { IngredientFilter } from '../../components/IngredientFilter';
import PhaseFilter from '../../components/recipe/PhaseFilter';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCurrentPhase = async () => {
      try {
        const response = await fetch(apiUrl('/api/users/cycle'), {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.current_phase) {
            setSelectedPhase(data.current_phase);
          } else {
            setSelectedPhase('menstruation');
          }
        }
      } catch {
        setSelectedPhase('menstruation');
      }
    };
    fetchCurrentPhase();
  }, [user]);

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Rezepte</h1>

        {user && (
          <div className="flex gap-2 flex-wrap items-center">
            <a
              href="/recipes/new"
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 font-medium"
            >
              + Rezept erstellen
            </a>
            <a
              href="/recipes/upload"
              className="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50"
            >
              📸 Aus Foto
            </a>
            <a
              href="/cycle"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
            >
              📊 Zyklus
            </a>
            <a
              href="/ingredients"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
            >
              🧂 Zutaten
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">Phasenfilter</h3>
              <PhaseFilter
                onFilterChange={(phase, score) => {
                  setSelectedPhase(phase);
                  setMinScore(score);
                }}
                currentPhase={selectedPhase ?? undefined}
              />
            </div>
            <div>
              <h3 className="font-bold mb-2">Zutatenfilter</h3>
              <IngredientFilter />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <RecipeList phase={selectedPhase} minScore={minScore} />
        </div>
      </div>
    </div>
  );
}
