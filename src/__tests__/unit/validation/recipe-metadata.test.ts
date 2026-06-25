import {
  validateDifficulty,
  validateMealType,
  validateTags,
  validateTotalTimeMinutes,
} from '@/lib/validation';

describe('Recipe metadata validation', () => {
  // TC-016-02 — AC-016-06
  // Given valid difficulty, mealType, time, and tags
  // When they are validated
  // Then no error is returned
  it('accepts a valid difficulty, mealType, time, and tags', () => {
    expect(validateDifficulty('easy')).toBeNull();
    expect(validateMealType('Hauptspeise')).toBeNull();
    expect(validateTotalTimeMinutes(35)).toBeNull();
    expect(validateTags(['Vegan', 'Low Carb'])).toBeNull();
  });

  // TC-016-03 — AC-016-07
  // Given an out-of-vocabulary difficulty
  // When it is validated
  // Then an error is returned
  it('rejects an unknown difficulty', () => {
    expect(validateDifficulty('extreme')).not.toBeNull();
  });

  // TC-016-03 — AC-016-07
  // Given an out-of-vocabulary mealType
  // When it is validated
  // Then an error is returned
  it('rejects an unknown mealType', () => {
    expect(validateMealType('Mitternachtssnack')).not.toBeNull();
  });

  // TC-016-03 — AC-016-07
  // Given an out-of-vocabulary tag
  // When it is validated
  // Then an error is returned
  it('rejects an unknown tag', () => {
    expect(validateTags(['Vegan', 'Glutenhaltig'])).not.toBeNull();
  });

  // TC-016-04 — AC-016-08
  // Given a zero or negative totalTimeMinutes
  // When it is validated
  // Then an error is returned
  it('rejects a zero/negative totalTimeMinutes', () => {
    expect(validateTotalTimeMinutes(0)).not.toBeNull();
    expect(validateTotalTimeMinutes(-5)).not.toBeNull();
  });

  // Regression (code review finding) — null means "explicitly cleared" and
  // must be accepted, not rejected as an invalid value, so the recipe form's
  // "–" option can actually clear a previously-set field.
  it('accepts null for difficulty, mealType, and totalTimeMinutes (explicit clear)', () => {
    expect(validateDifficulty(null)).toBeNull();
    expect(validateMealType(null)).toBeNull();
    expect(validateTotalTimeMinutes(null)).toBeNull();
  });
});
