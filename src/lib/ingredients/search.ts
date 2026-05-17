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
  if (!query || query.length < 2) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const alreadyAddedSet = new Set(alreadyAddedIds);

  return ingredients
    .filter((ing) => !alreadyAddedSet.has(ing.id))
    .filter((ing) => ing.name.toLowerCase().includes(lowerQuery))
    .map((ing) => ({
      ingredient: ing,
      score: ing.name.toLowerCase() === lowerQuery ? 0 : 1,
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, maxResults)
    .map((match) => match.ingredient);
}
