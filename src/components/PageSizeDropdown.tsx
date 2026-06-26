'use client';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface PageSizeDropdownProps {
  value: number;
  onChange: (pageSize: number) => void;
}

export function PageSizeDropdown({ value, onChange }: PageSizeDropdownProps) {
  return (
    <select
      aria-label="Rezepte pro Seite"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className="border rounded px-3 py-2 text-sm focus:outline-brand"
    >
      {PAGE_SIZE_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option} pro Seite
        </option>
      ))}
    </select>
  );
}
