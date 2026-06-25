'use client';

import { useFilter } from '../../hooks/useFilter';

const MIN_RATING_OPTIONS = [1, 2, 3, 4, 5];

export function MinRatingFilter() {
  const { minRating, setMinRating } = useFilter();

  return (
    <select
      aria-label="Bewertung mindestens"
      value={minRating ?? ''}
      onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : null)}
      className="w-full border rounded px-2 py-1 text-sm focus:outline-brand"
    >
      <option value="">Keine Begrenzung</option>
      {MIN_RATING_OPTIONS.map((stars) => (
        <option key={stars} value={stars}>
          ab {stars} ★
        </option>
      ))}
    </select>
  );
}
