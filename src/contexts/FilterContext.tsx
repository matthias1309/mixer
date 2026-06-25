'use client';

import React, { createContext, useState, ReactNode } from 'react';

export interface FilterContextType {
  selectedIngredients: string[];
  toggleIngredient: (ingredient: string) => void;
  // REQ-017: REWE-style tag groups (Ernährung, Hauptzutat, Ernährungsform,
  // Backen, Anlässe) all write into the same selectedTags list — the API
  // combines them as AND regardless of which group they came from.
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  difficulty: string | null;
  setDifficulty: (difficulty: string | null) => void;
  maxTime: number | null;
  setMaxTime: (maxTime: number | null) => void;
  clearFilters: () => void;
}

export const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [maxTime, setMaxTime] = useState<number | null>(null);

  function toggleIngredient(ingredient: string) {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient) ? prev.filter((i) => i !== ingredient) : [...prev, ingredient]
    );
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function clearFilters() {
    setSelectedIngredients([]);
    setSelectedTags([]);
    setDifficulty(null);
    setMaxTime(null);
  }

  return (
    <FilterContext.Provider
      value={{
        selectedIngredients,
        toggleIngredient,
        selectedTags,
        toggleTag,
        difficulty,
        setDifficulty,
        maxTime,
        setMaxTime,
        clearFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}
