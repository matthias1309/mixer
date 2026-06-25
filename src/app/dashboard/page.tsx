'use client';

import Link from 'next/link';
import { apiUrl } from '@lib/api-url';
import { RecipeList } from '../../components/RecipeList';
import { IngredientFilter } from '../../components/IngredientFilter';
import PhaseFilter from '../../components/recipe/PhaseFilter';
import { FilterPanel } from '../../components/FilterPanel';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFilter } from '../../hooks/useFilter';

export default function DashboardPage() {
  const { user } = useAuth();
  const { selectedIngredients, clearFilters } = useFilter();
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [search, setSearch] = useState('');

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
            <Link
              href="/recipes/new"
              className="bg-brand text-white px-5 py-2 rounded hover:bg-brand/90 font-medium"
            >
              + Rezept erstellen
            </Link>
            <Link
              href="/recipes/upload"
              className="border border-brand text-brand px-4 py-2 rounded hover:bg-surface"
            >
              📸 Aus Foto
            </Link>
            <Link
              href="/cycle"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
            >
              📊 Zyklus
            </Link>
            <Link
              href="/ingredients"
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
            >
              🧂 Zutaten
            </Link>
          </div>
        )}
      </div>

      <div className="mb-6">
        <input
          type="search"
          role="searchbox"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rezepte durchsuchen..."
          className="w-full border rounded px-4 py-2 focus:outline-brand"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FilterPanel
            hasActiveFilters={selectedIngredients.length > 0}
            onReset={clearFilters}
            groups={[
              {
                id: 'phase',
                title: 'Zyklusphase',
                emphasized: true,
                content: (
                  <PhaseFilter
                    onFilterChange={(phase, score) => {
                      setSelectedPhase(phase);
                      setMinScore(score);
                    }}
                    currentPhase={selectedPhase ?? undefined}
                  />
                ),
              },
              {
                id: 'ingredients',
                title: 'Zutaten',
                content: <IngredientFilter />,
              },
            ]}
          />
        </div>

        <div className="lg:col-span-3">
          <RecipeList phase={selectedPhase} minScore={minScore} search={search} />
        </div>
      </div>
    </div>
  );
}
