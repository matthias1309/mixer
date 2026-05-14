'use client';

import { useContext } from 'react';
import { FilterContext, FilterContextType } from '../contexts/FilterContext';

export function useFilter(): FilterContextType {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within FilterProvider');
  }
  return context;
}
