'use client';

import { apiUrl } from '@lib/api-url';

const PLACEHOLDER_GRADIENTS = [
  'from-brand to-accent',
  'from-accent to-brand',
  'from-brand to-ink',
  'from-accent to-ink',
] as const;

function gradientForId(id: number): string {
  const index = Math.abs(id) % PLACEHOLDER_GRADIENTS.length;
  return PLACEHOLDER_GRADIENTS[index];
}

export interface RecipeImageProps {
  id: number;
  name: string;
  imagePath?: string | null;
  className?: string;
}

export function RecipeImage({ id, name, imagePath, className = '' }: RecipeImageProps) {
  if (imagePath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={apiUrl(`/api/recipes/${id}/image`)}
        alt={name}
        className={`w-full h-40 object-cover rounded ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={`w-full h-40 rounded bg-gradient-to-br ${gradientForId(
        id
      )} flex items-center justify-center relative ${className}`}
    >
      <span aria-hidden="true" className="text-3xl">
        🍽️
      </span>
      <span className="absolute bottom-2 left-2 right-2 text-white text-sm font-semibold truncate text-center">
        {name}
      </span>
    </div>
  );
}
