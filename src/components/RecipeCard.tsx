'use client';

import Link from 'next/link';

export interface RecipeCardProps {
  id: number;
  name: string;
  description: string | null;
  creatorName: string;
  ingredientCount: number;
  createdAt: string;
  score?: number | null;
}

export function RecipeCard(props: RecipeCardProps) {
  const getScoreBadgeColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Link href={`/recipes/${props.id}`}>
      <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg cursor-pointer transition relative">
        {props.score !== undefined && props.score !== null && (
          <div
            className={`absolute top-2 right-2 ${getScoreBadgeColor(
              props.score
            )} text-white text-xs font-bold px-2 py-1 rounded`}
          >
            {Math.round(props.score)}
          </div>
        )}
        <h3 className="text-xl font-bold text-gray-800">{props.name}</h3>
        <p className="text-gray-600 text-sm">von {props.creatorName}</p>
        {props.description && (
          <p className="text-gray-700 mt-2 line-clamp-2">{props.description}</p>
        )}
        <div className="mt-3 flex justify-between text-sm text-gray-500">
          <span>{props.ingredientCount} Zutaten</span>
          <span>{new Date(props.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
