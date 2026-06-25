'use client';

import { useFilter } from '../../hooks/useFilter';
import { DIFFICULTY_LEVELS, DIFFICULTY_LABELS } from '../../lib/constants';

export function DifficultyFilter() {
  const { difficulty, setDifficulty } = useFilter();

  return (
    <div className="space-y-2">
      {DIFFICULTY_LEVELS.map((level) => (
        <label key={level} className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="difficulty"
            checked={difficulty === level}
            onChange={() => setDifficulty(level)}
            className="w-4 h-4 text-brand"
          />
          <span className="ml-2 text-gray-700">{DIFFICULTY_LABELS[level]}</span>
        </label>
      ))}
    </div>
  );
}
