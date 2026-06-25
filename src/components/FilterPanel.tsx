'use client';

import { ReactNode, useState } from 'react';

export interface FilterGroupConfig {
  id: string;
  title: string;
  emphasized?: boolean;
  content: ReactNode;
}

interface FilterPanelProps {
  groups: FilterGroupConfig[];
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function FilterPanel({ groups, onReset, hasActiveFilters }: FilterPanelProps) {
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);

  function toggleGroup(id: string) {
    setCollapsedIds((prev) =>
      prev.includes(id) ? prev.filter((collapsedId) => collapsedId !== id) : [...prev, id]
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-brand hover:underline font-medium"
        >
          Filter zurücksetzen
        </button>
      )}

      {groups.map((group) => {
        const isCollapsed = collapsedIds.includes(group.id);
        return (
          <div
            key={group.id}
            className={group.emphasized ? 'border-l-4 border-brand pl-3' : 'pl-3'}
          >
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={!isCollapsed}
              className="flex w-full items-center justify-between font-bold mb-2 text-ink"
            >
              <span>{group.title}</span>
              <span aria-hidden="true">{isCollapsed ? '▸' : '▾'}</span>
            </button>
            {!isCollapsed && group.content}
          </div>
        );
      })}
    </div>
  );
}
