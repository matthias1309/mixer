# Phase 2: Ingredient Autocomplete & Auto-Create Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to search existing ingredients with autocomplete and quickly create new ingredients without leaving the recipe form.

**Architecture:** Add ingredient search capability via API, create autocomplete component with dropdown UI, create modal for ingredient creation, integrate both into RecipeForm. Use test-driven development with unit tests for search logic and component tests for UI interaction.

**Tech Stack:** React (hooks), TypeScript, Next.js API routes, Jest, React Testing Library, better-sqlite3/pg for database

---

## File Structure

**New files:**
- `src/components/forms/IngredientAutocomplete.tsx` — Ingredient name input with dropdown suggestions
- `src/components/modals/CreateIngredientModal.tsx` — Modal for creating new ingredients
- `src/__tests__/components/IngredientAutocomplete.test.tsx` — Autocomplete component tests
- `src/__tests__/components/CreateIngredientModal.test.tsx` — Modal component tests
- `src/__tests__/lib/ingredients/search.test.ts` — Search logic tests

**Modified files:**
- `src/app/api/ingredients-master/route.ts` — Add search parameter handling to GET
- `src/components/forms/RecipeForm.tsx` — Integrate IngredientAutocomplete component
- `tests/e2e/recipe-creation.cy.ts` — Add E2E tests for autocomplete and ingredient creation

**Database:** No schema changes needed (nutrition_ingredients table already exists)

---

## Task 1: Create Ingredient Search Utility

**Files:**
- Create: `src/lib/ingredients/search.ts`
- Test: `src/__tests__/lib/ingredients/search.test.ts`

- [ ] **Step 1: Write failing tests for search function**

```typescript
// src/__tests__/lib/ingredients/search.test.ts
describe('searchIngredients', () => {
  describe('case-insensitive substring matching', () => {
    test('should match ingredient by exact name', () => {
      const ingredients = [
        { id: 1, name: 'Tomato' },
        { id: 2, name: 'Potato' },
      ];
      const results = searchIngredients(ingredients, 'tomato', []);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Tomato');
    });

    test('should match by substring', () => {
      const ingredients = [
        { id: 1, name: 'Tomato' },
        { id: 2, name: 'Potato' },
      ];
      const results = searchIngredients(ingredients, 'tom', []);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Tomato');
    });

    test('should be case-insensitive', () => {
      const ingredients = [{ id: 1, name: 'Tomato' }];
      const results = searchIngredients(ingredients, 'TOMATO', []);
      expect(results).toHaveLength(1);
    });
  });

  describe('exact match priority', () => {
    test('should sort exact matches first', () => {
      const ingredients = [
        { id: 1, name: 'Tomato' },
        { id: 2, name: 'Tomate' },
        { id: 3, name: 'Tomatoe' },
      ];
      const results = searchIngredients(ingredients, 'tomato', []);
      expect(results[0].name).toBe('Tomato');
    });
  });

  describe('exclude already-added', () => {
    test('should exclude ingredients already in recipe', () => {
      const ingredients = [
        { id: 1, name: 'Tomato' },
        { id: 2, name: 'Potato' },
      ];
      const addedIds = [1];
      const results = searchIngredients(ingredients, 'to', addedIds);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(2);
    });
  });

  describe('max results', () => {
    test('should limit results to 10 by default', () => {
      const ingredients = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        name: `Ingredient ${i}`,
      }));
      const results = searchIngredients(ingredients, 'ingredient', []);
      expect(results).toHaveLength(10);
    });

    test('should return all if less than max', () => {
      const ingredients = [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Apricot' },
      ];
      const results = searchIngredients(ingredients, 'ap', []);
      expect(results).toHaveLength(2);
    });
  });

  describe('requires 2+ characters', () => {
    test('should return empty array for single character', () => {
      const ingredients = [{ id: 1, name: 'Apple' }];
      const results = searchIngredients(ingredients, 'a', []);
      expect(results).toHaveLength(0);
    });

    test('should search with 2+ characters', () => {
      const ingredients = [{ id: 1, name: 'Apple' }];
      const results = searchIngredients(ingredients, 'ap', []);
      expect(results).toHaveLength(1);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/__tests__/lib/ingredients/search.test.ts
```

Expected: FAIL - `searchIngredients is not defined`

- [ ] **Step 3: Implement search function**

```typescript
// src/lib/ingredients/search.ts
export interface SearchableIngredient {
  id: number;
  name: string;
}

export function searchIngredients(
  ingredients: SearchableIngredient[],
  query: string,
  alreadyAddedIds: number[],
  maxResults: number = 10
): SearchableIngredient[] {
  // Require at least 2 characters
  if (!query || query.length < 2) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const alreadyAddedSet = new Set(alreadyAddedIds);

  // Filter and score matches
  const matches = ingredients
    .filter((ing) => !alreadyAddedSet.has(ing.id))
    .filter((ing) => ing.name.toLowerCase().includes(lowerQuery))
    .map((ing) => {
      const nameLower = ing.name.toLowerCase();
      // Exact match = score 0 (highest), partial match = score 1
      const isExactMatch = nameLower === lowerQuery;
      const score = isExactMatch ? 0 : 1;
      return { ingredient: ing, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, maxResults)
    .map((match) => match.ingredient);

  return matches;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/__tests__/lib/ingredients/search.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ingredients/search.ts src/__tests__/lib/ingredients/search.test.ts
git commit -m "feat: add ingredient search utility with case-insensitive matching"
```

---

## Task 2: Create IngredientAutocomplete Component

**Files:**
- Create: `src/components/forms/IngredientAutocomplete.tsx`
- Test: `src/__tests__/components/IngredientAutocomplete.test.tsx`
- Modify: `src/app/api/ingredients-master/route.ts` (search parameter)

- [ ] **Step 1: Enhance API route to support search**

Read the current route:

```bash
head -50 src/app/api/ingredients-master/route.ts
```

Then modify the GET handler to properly handle the search parameter:

```typescript
// src/app/api/ingredients-master/route.ts (modify handleGET function)

async function handleGET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

    const result = search 
      ? await IngredientMasterModelAsync.findByNamePrefix(search, limit)
      : await IngredientMasterModelAsync.findAll(1, limit);

    const response = NextResponse.json(result, { status: HTTP_STATUS.OK });
    return response;
  } catch (error) {
    console.error('List ingredients error:', error);
    return NextResponse.json(
      { error: 'Failed to list ingredients' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
```

- [ ] **Step 2: Add findByNamePrefix method to IngredientMasterModelAsync**

Check current file structure:

```bash
wc -l src/lib/db/models/ingredientMasterAsync.ts
```

Then add this method to the class (around line 100-150):

```typescript
// src/lib/db/models/ingredientMasterAsync.ts
static async findByNamePrefix(
  searchQuery: string,
  limit: number = 10
): Promise<IngredientMaster[]> {
  const db = getDb();
  const query = `${searchQuery}%`;

  if (isPostgres()) {
    const pool = db as Pool;
    const result = await pool.query(
      `SELECT * FROM nutrition_ingredients 
       WHERE LOWER(name) LIKE LOWER($1) 
       ORDER BY name ASC 
       LIMIT $2`,
      [query, limit]
    );
    return result.rows;
  } else {
    const database = db as Database;
    const stmt = database.prepare(
      `SELECT * FROM nutrition_ingredients 
       WHERE LOWER(name) LIKE LOWER(?) 
       ORDER BY name ASC 
       LIMIT ?`
    );
    return stmt.all(query, limit) as IngredientMaster[];
  }
}
```

- [ ] **Step 3: Write failing test for IngredientAutocomplete component**

```typescript
// src/__tests__/components/IngredientAutocomplete.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngredientAutocomplete } from '@/components/forms/IngredientAutocomplete';

describe('IngredientAutocomplete', () => {
  test('renders input field', () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');
    expect(input).toBeInTheDocument();
  });

  test('shows dropdown after 2+ characters', async () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname') as HTMLInputElement;
    
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ingredients: [
              { id: 1, name: 'Tomato', category: null, base_unit: 'g' },
            ],
          }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'tom');
    
    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument();
    });
  });

  test('does not show dropdown for single character', async () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');
    
    await userEvent.type(input, 't');
    
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('calls onSelect when ingredient clicked', async () => {
    const onSelect = jest.fn();
    render(
      <IngredientAutocomplete
        onSelect={onSelect}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname') as HTMLInputElement;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ingredients: [
              { id: 1, name: 'Tomato', category: null, base_unit: 'g' },
            ],
          }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'tom');
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Tomato'));
    });

    expect(onSelect).toHaveBeenCalledWith({ id: 1, name: 'Tomato' });
  });

  test('shows "Keine Zutaten gefunden" when no results', async () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ingredients: [] }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'xyz');
    
    await waitFor(() => {
      expect(screen.getByText('Keine Zutaten gefunden')).toBeInTheDocument();
    });
  });

  test('shows "Neue Zutat erstellen" button when no matches', async () => {
    const onCreateNew = jest.fn();
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={onCreateNew}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ingredients: [] }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'xyz');
    
    await waitFor(() => {
      const button = screen.getByText('Neue Zutat erstellen');
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
    });

    expect(onCreateNew).toHaveBeenCalledWith('xyz');
  });

  test('closes dropdown when Escape pressed', async () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ingredients: [
              { id: 1, name: 'Tomato', category: null, base_unit: 'g' },
            ],
          }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'tom');
    
    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('Tomato')).not.toBeInTheDocument();
    });
  });

  test('supports arrow key navigation', async () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ingredients: [
              { id: 1, name: 'Apple', category: null, base_unit: 'g' },
              { id: 2, name: 'Apricot', category: null, base_unit: 'g' },
            ],
          }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'ap');
    
    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
    
    // Arrow down should highlight first item
    expect(screen.getByText('Apple')).toHaveClass('highlighted');
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
npm test -- src/__tests__/components/IngredientAutocomplete.test.tsx
```

Expected: FAIL - Component doesn't exist

- [ ] **Step 5: Implement IngredientAutocomplete component**

```typescript
// src/components/forms/IngredientAutocomplete.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

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

  // Fetch suggestions
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
          `/api/ingredients-master?search=${encodeURIComponent(query)}&limit=10`
        );
        if (!response.ok) throw new Error('Failed to fetch ingredients');
        
        const data = await response.json();
        // Filter out already-added ingredients
        const filtered = data.ingredients.filter(
          (ing: IngredientSuggestion) => !addedIngredientIds.includes(ing.id)
        );
        setSuggestions(filtered);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query, addedIngredientIds]);

  // Close dropdown when clicking outside
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
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test -- src/__tests__/components/IngredientAutocomplete.test.tsx
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/forms/IngredientAutocomplete.tsx src/__tests__/components/IngredientAutocomplete.test.tsx src/lib/db/models/ingredientMasterAsync.ts src/app/api/ingredients-master/route.ts
git commit -m "feat: add ingredient autocomplete component with dropdown and search"
```

---

## Task 3: Create CreateIngredientModal Component

**Files:**
- Create: `src/components/modals/CreateIngredientModal.tsx`
- Test: `src/__tests__/components/CreateIngredientModal.test.tsx`

- [ ] **Step 1: Write failing tests for modal**

```typescript
// src/__tests__/components/CreateIngredientModal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateIngredientModal } from '@/components/modals/CreateIngredientModal';

describe('CreateIngredientModal', () => {
  test('renders modal when open is true', () => {
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={jest.fn()}
        suggestedName=""
      />
    );
    expect(screen.getByText('Neue Zutat erstellen')).toBeInTheDocument();
  });

  test('does not render when open is false', () => {
    const { container } = render(
      <CreateIngredientModal
        isOpen={false}
        onClose={jest.fn()}
        onCreate={jest.fn()}
        suggestedName=""
      />
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  test('pre-fills name input with suggestedName', () => {
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={jest.fn()}
        suggestedName="Tomato"
      />
    );
    const input = screen.getByPlaceholderText('Zutat-Name (Deutsch)') as HTMLInputElement;
    expect(input.value).toBe('Tomato');
  });

  test('calls onClose when Cancel clicked', () => {
    const onClose = jest.fn();
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={onClose}
        onCreate={jest.fn()}
        suggestedName=""
      />
    );
    const cancelButton = screen.getByRole('button', { name: /Abbrechen/i });
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onClose when clicking outside modal', () => {
    const onClose = jest.fn();
    const { container } = render(
      <CreateIngredientModal
        isOpen={true}
        onClose={onClose}
        onCreate={jest.fn()}
        suggestedName=""
      />
    );
    const backdrop = container.querySelector('[class*="fixed"]');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  test('validates name field is not empty', async () => {
    const onCreate = jest.fn();
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={onCreate}
        suggestedName=""
      />
    );
    const createButton = screen.getByRole('button', { name: /Erstellen/i });
    
    fireEvent.click(createButton);
    
    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByText(/erforderlich/i)).toBeInTheDocument();
  });

  test('calls onCreate with name when form submitted', async () => {
    const onCreate = jest.fn();
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={onCreate}
        suggestedName=""
      />
    );
    const input = screen.getByPlaceholderText('Zutat-Name (Deutsch)');
    const createButton = screen.getByRole('button', { name: /Erstellen/i });

    await userEvent.type(input, 'New Ingredient');
    fireEvent.click(createButton);

    expect(onCreate).toHaveBeenCalledWith('New Ingredient');
  });

  test('trims whitespace from name', async () => {
    const onCreate = jest.fn();
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={onCreate}
        suggestedName=""
      />
    );
    const input = screen.getByPlaceholderText('Zutat-Name (Deutsch)');
    const createButton = screen.getByRole('button', { name: /Erstellen/i });

    await userEvent.type(input, '  New Ingredient  ');
    fireEvent.click(createButton);

    expect(onCreate).toHaveBeenCalledWith('New Ingredient');
  });

  test('shows error when ingredient already exists', async () => {
    const onCreate = jest.fn().mockRejectedValueOnce(
      new Error('Diese Zutat existiert bereits')
    );
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={onCreate}
        suggestedName=""
      />
    );
    const input = screen.getByPlaceholderText('Zutat-Name (Deutsch)');
    const createButton = screen.getByRole('button', { name: /Erstellen/i });

    await userEvent.type(input, 'Existing');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Diese Zutat existiert bereits/i)).toBeInTheDocument();
    });
  });

  test('clears error message when typing', async () => {
    const onCreate = jest.fn().mockRejectedValueOnce(
      new Error('Diese Zutat existiert bereits')
    );
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={onCreate}
        suggestedName=""
      />
    );
    const input = screen.getByPlaceholderText('Zutat-Name (Deutsch)');
    const createButton = screen.getByRole('button', { name: /Erstellen/i });

    await userEvent.type(input, 'Existing');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Diese Zutat existiert bereits/i)).toBeInTheDocument();
    });

    await userEvent.clear(input);
    await userEvent.type(input, 'New');

    expect(screen.queryByText(/Diese Zutat existiert bereits/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/__tests__/components/CreateIngredientModal.test.tsx
```

Expected: FAIL - Component doesn't exist

- [ ] **Step 3: Implement CreateIngredientModal component**

```typescript
// src/components/modals/CreateIngredientModal.tsx
'use client';

import { useState } from 'react';

export interface CreateIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  suggestedName: string;
}

export function CreateIngredientModal({
  isOpen,
  onClose,
  onCreate,
  suggestedName,
}: CreateIngredientModalProps) {
  const [name, setName] = useState(suggestedName);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name ist erforderlich');
      return;
    }

    setIsLoading(true);
    try {
      await onCreate(trimmedName);
      setName('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Es ist ein Fehler aufgetreten'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    if (error) setError('');
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="text-xl font-bold mb-4">
          Neue Zutat erstellen
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Zutat-Name (Deutsch) *
            </label>
            <input
              type="text"
              placeholder="Zutat-Name (Deutsch)"
              value={name}
              onChange={handleNameChange}
              maxLength={255}
              className="w-full border rounded px-3 py-2 focus:outline-blue-500"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">{name.length}/255</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Erstellen...' : 'Erstellen'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/__tests__/components/CreateIngredientModal.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/modals/CreateIngredientModal.tsx src/__tests__/components/CreateIngredientModal.test.tsx
git commit -m "feat: add create ingredient modal with validation"
```

---

## Task 4: Integrate Autocomplete into RecipeForm

**Files:**
- Modify: `src/components/forms/RecipeForm.tsx`

- [ ] **Step 1: Update RecipeForm to use IngredientAutocomplete**

Read the current ingredient input section (around lines 184-248):

```bash
sed -n '184,248p' src/components/forms/RecipeForm.tsx
```

Replace it with:

```typescript
// In src/components/forms/RecipeForm.tsx, replace the ingredients section:

import { IngredientAutocomplete } from './IngredientAutocomplete';
import { CreateIngredientModal } from '../modals/CreateIngredientModal';

// Add state for modal
const [createModalOpen, setCreateModalOpen] = useState(false);
const [createModalQuery, setCreateModalQuery] = useState('');

// Add handler for creating new ingredient
async function handleCreateNewIngredient(name: string) {
  try {
    const response = await fetch('/api/ingredients-master', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Zutat konnte nicht erstellt werden');
    }

    const newIngredient = await response.json();
    
    // Add the new ingredient to the recipe
    setIngredients([
      ...ingredients,
      { name: newIngredient.name, quantity: 1, unit: 'g' },
    ]);
    setCreateModalOpen(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Fehler beim Erstellen der Zutat');
  }
}

// Add handler for selecting ingredient from autocomplete
function handleSelectIngredient(ingredient: { id: number; name: string }) {
  // Add ingredient with default quantity/unit
  setIngredients([
    ...ingredients,
    { name: ingredient.name, quantity: 1, unit: 'g' },
  ]);
}

// Replace the ingredients section (lines 183-248) with:
{/* Ingredients */}
<div>
  <label className="block text-sm font-medium mb-2">Zutaten ({ingredients.length})</label>

  <div className="space-y-2 mb-3">
    {/* Autocomplete input for adding new ingredient */}
    <div className="flex gap-2">
      <div className="flex-1">
        <IngredientAutocomplete
          onSelect={handleSelectIngredient}
          onCreateNew={(query) => {
            setCreateModalQuery(query);
            setCreateModalOpen(true);
          }}
          addedIngredientIds={[]} // We don't have IDs in recipe form, so pass empty
        />
      </div>
      <button
        type="button"
        onClick={() => addIngredient()}
        className="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
        disabled={isLoading || ingredients.length >= 50}
      >
        + Hinzufügen
      </button>
    </div>

    {/* Existing ingredients */}
    {ingredients.map((ing, idx) => (
      <div key={idx} className="flex gap-2">
        <input
          type="text"
          placeholder="Zutatname"
          value={ing.name}
          onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
          maxLength={100}
          className="flex-1 border rounded px-3 py-2 text-sm"
          disabled={isLoading}
        />
        <input
          type="number"
          placeholder="Menge"
          value={ing.quantity}
          onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value))}
          step="0.1"
          min="0.1"
          className="w-20 border rounded px-3 py-2 text-sm"
          disabled={isLoading}
        />
        <input
          type="text"
          placeholder="Einheit"
          value={ing.unit}
          onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
          className="w-20 border rounded px-3 py-2 text-sm"
          disabled={isLoading}
          list="units"
        />
        <button
          type="button"
          onClick={() => removeIngredient(idx)}
          className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
          disabled={isLoading}
        >
          Entfernen
        </button>
      </div>
    ))}
  </div>

  <datalist id="units">
    <option value="g" />
    <option value="kg" />
    <option value="ml" />
    <option value="l" />
    <option value="tsp" />
    <option value="tbsp" />
    <option value="cup" />
  </datalist>
</div>

{/* Modal for creating new ingredient */}
<CreateIngredientModal
  isOpen={createModalOpen}
  onClose={() => {
    setCreateModalOpen(false);
    setCreateModalQuery('');
  }}
  onCreate={handleCreateNewIngredient}
  suggestedName={createModalQuery}
/>
```

- [ ] **Step 2: Update imports at top of file**

Add these imports to the top:

```typescript
import { IngredientAutocomplete } from './IngredientAutocomplete';
import { CreateIngredientModal } from '../modals/CreateIngredientModal';
```

- [ ] **Step 3: Run the app and test manually**

```bash
npm run dev
```

Visit `http://localhost:3000/recipes/new` and test:
- Type in ingredient field (should show autocomplete after 2 chars)
- Click a suggestion (should add ingredient)
- Type something not in database, click "Neue Zutat erstellen"
- Create new ingredient in modal
- Verify it's added to the recipe

- [ ] **Step 4: Commit**

```bash
git add src/components/forms/RecipeForm.tsx
git commit -m "feat: integrate ingredient autocomplete and create modal into recipe form"
```

---

## Task 5: Add E2E Tests

**Files:**
- Create/Modify: `tests/e2e/recipe-creation.cy.ts`

- [ ] **Step 1: Write E2E test for autocomplete**

```typescript
// tests/e2e/recipe-creation.cy.ts (add to existing file or create new)

describe('Recipe Creation - Ingredient Autocomplete', () => {
  beforeEach(() => {
    cy.visit('/recipes/new');
  });

  it('should show autocomplete suggestions after 2 characters', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('to');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"]').should('contain', 'Tomato');
  });

  it('should not show autocomplete for single character', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('t');
    cy.get('[role="listbox"]').should('not.exist');
  });

  it('should add ingredient when clicking suggestion', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('tom');
    cy.get('[role="listbox"]').contains('Tomato').click();
    
    // Verify ingredient was added
    cy.get('input[placeholder="Zutatname"]').should('have.value', 'Tomato');
  });

  it('should show "Neue Zutat erstellen" when no matches', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('xyz123');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"]').should('contain', 'Keine Zutaten gefunden');
    cy.get('[role="listbox"]').should('contain', 'Neue Zutat erstellen');
  });

  it('should close autocomplete when clicking outside', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('tom');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('body').click(0, 0);
    cy.get('[role="listbox"]').should('not.exist');
  });

  it('should support keyboard navigation with arrow keys', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('app');
    cy.get('[role="listbox"]').should('be.visible');
    
    cy.get('input[placeholder="Zutatname"]').first().type('{downarrow}');
    cy.get('[role="option"][aria-selected="true"]').should('contain', 'Apple');
    
    cy.get('input[placeholder="Zutatname"]').first().type('{downarrow}');
    cy.get('[role="option"][aria-selected="true"]').should('contain', 'Apricot');
  });

  it('should select ingredient with Enter key', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('tom');
    cy.get('input[placeholder="Zutatname"]').first().type('{downarrow}{enter}');
    
    // Verify ingredient was added
    cy.get('input[placeholder="Zutatname"]').should('have.value', 'Tomato');
  });

  it('should close dropdown with Escape key', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('tom');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('input[placeholder="Zutatname"]').first().type('{esc}');
    cy.get('[role="listbox"]').should('not.exist');
  });
});

describe('Recipe Creation - Create Ingredient', () => {
  beforeEach(() => {
    cy.visit('/recipes/new');
  });

  it('should open modal when clicking "Neue Zutat erstellen"', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('newingredient123');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"]').contains('Neue Zutat erstellen').click();
    
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').should('contain', 'Neue Zutat erstellen');
  });

  it('should pre-fill suggested name in modal', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('mynewthing');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"]').contains('Neue Zutat erstellen').click();
    
    cy.get('[role="dialog"] input[placeholder="Zutat-Name (Deutsch)"]').should('have.value', 'mynewthing');
  });

  it('should close modal when clicking Cancel', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('xyz');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"]').contains('Neue Zutat erstellen').click();
    
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').contains('Abbrechen').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should close modal when clicking outside', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('xyz');
    cy.get('[role="listbox"]').contains('Neue Zutat erstellen').click();
    
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('body').click(0, 0);
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should create ingredient and add to recipe', () => {
    const newIngredientName = `TestIngredient${Date.now()}`;
    cy.get('input[placeholder="Zutatname"]').first().type(newIngredientName);
    cy.get('[role="listbox"]').contains('Neue Zutat erstellen').click();
    
    cy.get('[role="dialog"] input[placeholder="Zutat-Name (Deutsch)"]')
      .clear()
      .type(newIngredientName);
    cy.get('[role="dialog"]').contains('Erstellen').click();
    
    cy.get('[role="dialog"]').should('not.exist');
    // Verify ingredient was added to form
    cy.get('input[placeholder="Zutatname"]').should('contain.value', newIngredientName);
  });

  it('should show error when ingredient already exists', () => {
    // Create ingredient first
    const ingredientName = `Duplicate${Date.now()}`;
    cy.get('input[placeholder="Zutatname"]').first().type(ingredientName);
    cy.get('[role="listbox"]').contains('Neue Zutat erstellen').click();
    cy.get('[role="dialog"] input[placeholder="Zutat-Name (Deutsch)"]')
      .clear()
      .type(ingredientName);
    cy.get('[role="dialog"]').contains('Erstellen').click();
    cy.get('[role="dialog"]').should('not.exist');

    // Try creating same ingredient again
    cy.get('input[placeholder="Zutatname"]').eq(1).type(ingredientName);
    cy.get('[role="listbox"]').contains('Neue Zutat erstellen').click();
    cy.get('[role="dialog"] input[placeholder="Zutat-Name (Deutsch)"]').clear().type(ingredientName);
    cy.get('[role="dialog"]').contains('Erstellen').click();
    
    cy.get('[role="dialog"]').should('contain', 'Diese Zutat existiert bereits');
  });
});
```

- [ ] **Step 2: Run E2E tests**

```bash
npm run cypress:open
```

Select the `recipe-creation.cy.ts` file and run the tests. Verify all tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/recipe-creation.cy.ts
git commit -m "test: add E2E tests for ingredient autocomplete and creation"
```

---

## Task 6: Verify All Tests Pass

- [ ] **Step 1: Run all unit and component tests**

```bash
npm test
```

Expected: All tests pass (or handle any failures)

- [ ] **Step 2: Run E2E tests in headless mode**

```bash
npm run cypress:run
```

Expected: All E2E tests pass

- [ ] **Step 3: Run linter**

```bash
npm run lint
```

Expected: No linting errors

- [ ] **Step 4: Build the project**

```bash
npm run build
```

Expected: Build succeeds with no errors

- [ ] **Step 5: Commit final state**

```bash
git status
# Verify clean working directory
```

---

## Summary

This plan implements Phase 2 ingredient features with:

✅ **Feature 1 - Ingredient Autocomplete**
- Real-time search with 2+ character trigger
- Case-insensitive substring matching
- Dropdown with up to 10 suggestions
- Keyboard navigation (arrows, Enter, Escape)
- Empty state with "Neue Zutat erstellen" button
- Excludes already-added ingredients

✅ **Feature 2 - Auto-Create Ingredients**
- Modal for quick ingredient creation
- Required name field with uniqueness check
- Suggested name pre-fill from autocomplete query
- Immediate addition to recipe
- Persists to database for future use

✅ **Integration**
- Modified RecipeForm to use autocomplete
- Connected modal trigger from autocomplete
- Proper error handling and validation

✅ **Testing**
- Unit tests for search algorithm
- Component tests for autocomplete and modal
- E2E tests for full user workflows
- All tests use TDD approach (write tests first)

✅ **No Breaking Changes**
- Existing recipe functionality unchanged
- Database schema unchanged
- Backward compatible with existing recipes
