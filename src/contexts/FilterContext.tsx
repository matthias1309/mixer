'use client';

import React, { createContext, useState, ReactNode } from 'react';

export interface FilterContextType {
  selectedIngredients: string[];
  toggleIngredient: (ingredient: string) => void;
  clearFilters: () => void;
}

export const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  function toggleIngredient(ingredient: string) {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient]
    );
  }

  function clearFilters() {
    setSelectedIngredients([]);
  }

  return (
    <FilterContext.Provider value={{ selectedIngredients, toggleIngredient, clearFilters }}>
      {children}
    </FilterContext.Provider>
  );
}
