'use client';

import { useState, useEffect } from 'react';
import { ParsedIngredient } from '@/lib/ocr/types';

interface OcrReviewProps {
  uploadId: string;
  onRecipeCreated?: (recipeId: number) => void;
}

export default function OcrReview({ uploadId, onRecipeCreated }: OcrReviewProps) {
  const [ingredients, setIngredients] = useState<ParsedIngredient[]>([]);
  const [recipeName, setRecipeName] = useState('');
  const [portions, setPortions] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOcrResult = async () => {
      try {
        const response = await fetch(`/api/recipes/ocr/${uploadId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load OCR result');
        }

        if (data.data.ingredients) {
          setIngredients(data.data.ingredients);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load OCR result');
      }
    };

    loadOcrResult();
  }, [uploadId]);

  const handleCreateRecipe = async () => {
    if (!recipeName.trim()) {
      setError('Please enter a recipe name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: recipeName,
          servings: portions,
          ingredients: ingredients
            .filter(ing => ing.name !== null)
            .map(ing => ({
              name: ing.name,
              quantity: ing.amount || 1,
              unit: ing.unit || 'Stück',
            })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create recipe');
      }

      const data = await response.json();
      onRecipeCreated?.(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recipe creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ocr-review">
      <h2>Review & Correct Ingredients</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label htmlFor="recipe-name">Recipe Name</label>
        <input
          id="recipe-name"
          type="text"
          value={recipeName}
          onChange={e => setRecipeName(e.target.value)}
          placeholder="e.g., Apfel Salat"
        />
      </div>

      <div className="form-group">
        <label htmlFor="portions">Portions</label>
        <input
          id="portions"
          type="number"
          min="1"
          value={portions}
          onChange={e => setPortions(parseInt(e.target.value))}
        />
      </div>

      <div className="ingredients-list">
        <h3>Ingredients ({ingredients.length})</h3>
        {ingredients.map((ing, idx) => (
          <div key={idx} className={`ingredient-item ${ing.matched ? 'matched' : 'unmatched'}`}>
            <span className="confidence">
              {(ing.confidence * 100).toFixed(0)}%
            </span>
            <span className="name">{ing.name}</span>
            <span className="amount">
              {ing.amount} {ing.unit}
            </span>
            {!ing.matched && <span className="badge">⚠️ Manual review needed</span>}
          </div>
        ))}
      </div>

      <button
        onClick={handleCreateRecipe}
        disabled={loading || ingredients.length === 0}
        className="button primary"
      >
        {loading ? 'Creating...' : 'Create Recipe'}
      </button>
    </div>
  );
}
