'use client';

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
        const response = await fetch('/api/users/cycle', {
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
      <h1 className="text-3xl font-bold mb-6">Rezepte</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold mb-2">Zutatenfilter</h3>
              <IngredientFilter />
            </div>
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
          </div>
        </div>

        <div className="lg:col-span-3">
          <RecipeList phase={selectedPhase} minScore={minScore} />
        </div>
      </div>

      {user && (
        <div className="mt-6 flex gap-4 flex-wrap">
          <a
            href="/recipes/new"
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            + Rezept erstellen
          </a>
          <a
            href="/recipes/upload"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            📸 Aus Foto hochladen
          </a>
          <a href="/cycle" className="bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700">
            📊 Zyklus verfolgen
          </a>
          <a
            href="/ingredients"
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
          >
            🧂 Zutaten verwalten
          </a>
        </div>
      )}
    </div>
  );
}
