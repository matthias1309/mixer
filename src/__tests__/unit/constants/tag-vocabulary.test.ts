import {
  DIFFICULTY_LEVELS,
  MEAL_TYPES,
  TAG_GROUPS,
  TAG_VOCABULARY,
  isValidDifficulty,
  isValidMealType,
  isValidTag,
} from '@/lib/constants';

describe('REWE tag vocabulary constants', () => {
  // TC-016-01 — AC-016-01, AC-016-02
  // Given the recipe metadata constants
  // When they are inspected
  // Then they expose the REWE tag groups, difficulty levels, and meal types
  it('exposes the REWE tag groups, difficulty levels, and meal types', () => {
    expect(DIFFICULTY_LEVELS).toEqual(['easy', 'medium', 'hard']);

    expect(MEAL_TYPES).toEqual([
      'Vorspeise',
      'Hauptspeise',
      'Dessert',
      'Beilagen',
      'Frühstück',
      'Suppen',
      'Auflauf',
      'Snacks',
      'Getränke',
    ]);

    expect(TAG_GROUPS.ernaehrung).toEqual(['Fleisch', 'Fisch', 'Vegetarisch', 'Vegan']);
    expect(TAG_GROUPS.hauptzutat).toEqual([
      'Nudeln/Pasta',
      'Kartoffeln',
      'Reis',
      'Gemüse',
      'Kürbis',
    ]);
    expect(TAG_GROUPS.ernaehrungsform).toEqual([
      'Laktosefrei',
      'Low Carb',
      'Glutenfrei',
      'Paleo',
      'Wenig Zucker',
      'Clean Eating',
    ]);
    expect(TAG_GROUPS.backen).toEqual([
      'Kuchen',
      'Torten',
      'Brot',
      'Muffins',
      'Cupcakes',
      'Plätzchen',
    ]);
    expect(TAG_GROUPS.anlaesse).toEqual([
      'Frühling',
      'Grillen',
      'Picknick',
      'Kindergerichte',
      'Geburtstag',
      'Party',
      'günstig',
    ]);

    // TAG_VOCABULARY is the flattened allow-list used for validation
    expect(TAG_VOCABULARY).toContain('Vegan');
    expect(TAG_VOCABULARY).toContain('Kürbis');
    expect(TAG_VOCABULARY).toContain('günstig');
    expect(TAG_VOCABULARY.length).toBe(
      Object.values(TAG_GROUPS).reduce((sum, group) => sum + group.length, 0)
    );

    expect(isValidDifficulty('easy')).toBe(true);
    expect(isValidDifficulty('extreme')).toBe(false);

    expect(isValidMealType('Hauptspeise')).toBe(true);
    expect(isValidMealType('Mitternachtssnack')).toBe(false);

    expect(isValidTag('Vegan')).toBe(true);
    expect(isValidTag('Glutenhaltig')).toBe(false);
  });
});
