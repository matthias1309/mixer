'use client';

import { useFilter } from '../../hooks/useFilter';

const MAX_TIME_OPTIONS_MINUTES = [15, 30, 60, 120];

export function MaxTimeFilter() {
  const { maxTime, setMaxTime } = useFilter();

  return (
    <select
      aria-label="Maximale Zubereitungszeit"
      value={maxTime ?? ''}
      onChange={(e) => setMaxTime(e.target.value ? Number(e.target.value) : null)}
      className="w-full border rounded px-2 py-1 text-sm focus:outline-brand"
    >
      <option value="">Keine Begrenzung</option>
      {MAX_TIME_OPTIONS_MINUTES.map((minutes) => (
        <option key={minutes} value={minutes}>
          bis {minutes} Min.
        </option>
      ))}
    </select>
  );
}
