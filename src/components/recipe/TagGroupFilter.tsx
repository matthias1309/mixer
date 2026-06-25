'use client';

import { useFilter } from '../../hooks/useFilter';

interface TagGroupFilterProps {
  tags: readonly string[];
}

// Renders one REWE-style tag group (Ernährung, Hauptzutat, Ernährungsform,
// Backen, Anlässe). All groups share the same selectedTags list in
// FilterContext — the API combines every selected tag with AND (REQ-017).
export function TagGroupFilter({ tags }: TagGroupFilterProps) {
  const { selectedTags, toggleTag } = useFilter();

  return (
    <div className="space-y-2">
      {tags.map((tag) => (
        <label key={tag} className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={selectedTags.includes(tag)}
            onChange={() => toggleTag(tag)}
            className="w-4 h-4 text-brand rounded"
          />
          <span className="ml-2 text-gray-700">{tag}</span>
        </label>
      ))}
    </div>
  );
}
