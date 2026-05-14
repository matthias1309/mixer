'use client';

import Link from 'next/link';

export interface RecipeCardProps {
  id: number;
  name: string;
  description: string | null;
  creatorName: string;
  ingredientCount: number;
  createdAt: string;
}

export function RecipeCard(props: RecipeCardProps) {
  return (
    <Link href={`/recipes/${props.id}`}>
      <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg cursor-pointer transition">
        <h3 className="text-xl font-bold text-gray-800">{props.name}</h3>
        <p className="text-gray-600 text-sm">by {props.creatorName}</p>
        {props.description && (
          <p className="text-gray-700 mt-2 line-clamp-2">{props.description}</p>
        )}
        <div className="mt-3 flex justify-between text-sm text-gray-500">
          <span>{props.ingredientCount} ingredients</span>
          <span>{new Date(props.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
