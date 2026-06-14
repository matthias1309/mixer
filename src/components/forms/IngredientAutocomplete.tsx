'use client';

import { useState, useRef, useEffect } from 'react';
import { searchIngredients } from '@/lib/ingredients/search';
import { apiUrl } from '@lib/api-url';

interface IngredientSuggestion {
  id: number;
  name: string;
}

export interface IngredientAutocompleteProps {
  onSelect: (ingredient: IngredientSuggestion) => void;
  onCreateNew: (query: string) => void;
  addedIngredientIds: number[];
}

export function IngredientAutocomplete({
  onSelect,
  onCreateNew,
  addedIngredientIds,
}: IngredientAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          apiUrl(`/api/ingredients-master?search=${encodeURIComponent(query)}&pageSize=10`)
        );
        if (!response.ok) throw new Error('Failed to fetch ingredients');

        const data = await response.json();
        const filtered = searchIngredients(data.ingredients, query, addedIngredientIds);
        setSuggestions(filtered);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, addedIngredientIds]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }

  function handleSelect(ingredient: IngredientSuggestion) {
    onSelect({ id: ingredient.id, name: ingredient.name });
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleCreateNew() {
    onCreateNew(query);
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Zutatname"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-blue-500"
      />

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded mt-1 max-h-64 overflow-y-auto z-50"
          role="listbox"
        >
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Laden...</div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((ing, idx) => (
                <div
                  key={ing.id}
                  onClick={() => handleSelect(ing)}
                  className={`px-3 py-2 text-sm cursor-pointer ${
                    idx === selectedIndex
                      ? 'bg-blue-100 highlighted'
                      : 'hover:bg-gray-100'
                  }`}
                  role="option"
                  aria-selected={idx === selectedIndex}
                >
                  {ing.name}
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="px-3 py-2 text-sm text-gray-500">
                Keine Zutaten gefunden
              </div>
              <button
                type="button"
                onClick={handleCreateNew}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-100"
              >
                Neue Zutat erstellen
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
