'use client';

const SORT_LABELS: Record<string, string> = {
  newest: 'Neueste',
  time: 'Zubereitungszeit',
  rating: 'Bewertung',
  name: 'Name',
};

interface SortDropdownProps {
  value: string;
  onChange: (sort: string) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <select
      aria-label="Sortierung"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-3 py-2 text-sm focus:outline-brand"
    >
      {Object.entries(SORT_LABELS).map(([sortValue, label]) => (
        <option key={sortValue} value={sortValue}>
          {label}
        </option>
      ))}
    </select>
  );
}
