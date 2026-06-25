import { buildRecipeQuery } from '@/lib/db/build-recipe-query';

describe('buildRecipeQuery', () => {
  // TC-017-06 — AC-017-01
  // Given a difficulty filter
  // When the query is built
  // Then a parameterised predicate is emitted
  it('emits a parameterised predicate for a valid difficulty', () => {
    const result = buildRecipeQuery({ difficulty: 'easy' });

    expect(result.predicates).toEqual(['recipes.difficulty = ?']);
    expect(result.params).toEqual(['easy']);
  });

  // AC-017-04
  // Given an unknown difficulty value
  // When the query is built
  // Then no predicate is emitted for it
  it('ignores an unknown difficulty', () => {
    const result = buildRecipeQuery({ difficulty: 'impossible' });

    expect(result.predicates).toEqual([]);
    expect(result.params).toEqual([]);
  });

  // AC-017-01
  it('emits a predicate for maxTime that excludes recipes without a time', () => {
    const result = buildRecipeQuery({ maxTime: 30 });

    expect(result.predicates).toEqual([
      'recipes.total_time_minutes IS NOT NULL AND recipes.total_time_minutes <= ?',
    ]);
    expect(result.params).toEqual([30]);
  });

  // AC-017-04
  it('ignores a non-positive maxTime', () => {
    const result = buildRecipeQuery({ maxTime: 0 });

    expect(result.predicates).toEqual([]);
    expect(result.params).toEqual([]);
  });

  // AC-017-01
  it('emits a parameterised predicate for a valid mealType', () => {
    const result = buildRecipeQuery({ mealType: 'Hauptspeise' });

    expect(result.predicates).toEqual(['recipes.meal_type = ?']);
    expect(result.params).toEqual(['Hauptspeise']);
  });

  // AC-017-04
  it('ignores an unknown mealType', () => {
    const result = buildRecipeQuery({ mealType: 'Mitternachtssnack' });

    expect(result.predicates).toEqual([]);
    expect(result.params).toEqual([]);
  });

  // TC-017-06 — AC-017-01, AC-017-02
  // Given multiple known tags
  // When the query is built
  // Then a HAVING COUNT predicate combines them with AND
  it('emits a HAVING COUNT predicate for AND tags', () => {
    const result = buildRecipeQuery({ tags: ['Vegan', 'Low Carb'] });

    expect(result.predicates).toEqual([
      'recipes.id IN (SELECT recipe_id FROM recipe_tags WHERE tag IN (?,?) GROUP BY recipe_id HAVING COUNT(DISTINCT tag) = ?)',
    ]);
    expect(result.params).toEqual(['Vegan', 'Low Carb', 2]);
  });

  // AC-017-04
  // Given a mix of known and unknown tags
  // When the query is built
  // Then only the known tags are bound, counted by their own number
  it('drops unknown tags but keeps the known ones', () => {
    const result = buildRecipeQuery({ tags: ['Vegan', 'Glutenhaltig'] });

    expect(result.predicates).toEqual([
      'recipes.id IN (SELECT recipe_id FROM recipe_tags WHERE tag IN (?) GROUP BY recipe_id HAVING COUNT(DISTINCT tag) = ?)',
    ]);
    expect(result.params).toEqual(['Vegan', 1]);
  });

  // AC-017-04
  it('emits no tag predicate when every tag is unknown', () => {
    const result = buildRecipeQuery({ tags: ['Glutenhaltig'] });

    expect(result.predicates).toEqual([]);
    expect(result.params).toEqual([]);
  });

  // AC-017-03
  // Given several filters at once
  // When the query is built
  // Then all predicates and params compose together
  it('composes multiple filters together', () => {
    const result = buildRecipeQuery({ difficulty: 'easy', maxTime: 20, tags: ['Vegan'] });

    expect(result.predicates).toHaveLength(3);
    expect(result.params).toEqual(['easy', 20, 'Vegan', 1]);
  });

  // TC-017-06
  // Given any combination of user-supplied filter values
  // When the query is built
  // Then every predicate uses a bound parameter placeholder, never the raw value
  it('binds all user values as parameters instead of inlining them', () => {
    const result = buildRecipeQuery({
      difficulty: 'easy',
      maxTime: 15,
      mealType: 'Dessert',
      tags: ['Vegan'],
    });

    for (const predicate of result.predicates) {
      expect(predicate).not.toMatch(/=\s*'/);
      expect(predicate).not.toContain('easy');
      expect(predicate).not.toContain('15');
      expect(predicate).not.toContain('Dessert');
      expect(predicate).not.toContain('Vegan');
    }
  });

  // TC-017-05 — AC-017-05
  // Given sort=time
  // When the query is built
  // Then results are ordered by total_time_minutes ascending, nulls last
  it('orders by time ascending for sort=time', () => {
    const result = buildRecipeQuery({ sort: 'time' });

    expect(result.orderBy).toBe(
      'recipes.total_time_minutes IS NULL, recipes.total_time_minutes ASC'
    );
  });

  // TC-017-05 — AC-017-05
  // Given sort=rating and no rating data available yet (REQ-018 not implemented)
  // When the query is built
  // Then it falls back to the default ordering instead of erroring
  it('falls back to default for sort=rating when no rating data', () => {
    const fallback = buildRecipeQuery({});
    const rating = buildRecipeQuery({ sort: 'rating' });

    expect(rating.orderBy).toBe(fallback.orderBy);
  });

  it('orders by newest by default', () => {
    const result = buildRecipeQuery({});

    expect(result.orderBy).toBe('recipes.created_at DESC');
  });
});
