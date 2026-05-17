import { NUTRIENT_KEYS } from '@/lib/nutrition/types';
import { NUTRIENT_NAMES, NUTRIENT_UNITS } from '@/lib/nutrition/constants';

describe('Salt nutrient in types and constants', () => {
  it('includes salt in NUTRIENT_KEYS', () => {
    expect(NUTRIENT_KEYS).toContain('salt');
  });

  it('salt appears before sodium in NUTRIENT_KEYS', () => {
    const saltIdx = NUTRIENT_KEYS.indexOf('salt');
    const sodiumIdx = NUTRIENT_KEYS.indexOf('sodium');
    expect(saltIdx).toBeGreaterThanOrEqual(0);
    expect(saltIdx).toBeLessThan(sodiumIdx);
  });

  it('NUTRIENT_NAMES has German label for salt', () => {
    expect(NUTRIENT_NAMES.salt).toBe('Salz');
  });

  it('NUTRIENT_UNITS has mg unit for salt', () => {
    expect(NUTRIENT_UNITS.salt).toBe('mg');
  });
});
