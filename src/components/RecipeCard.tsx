'use client';

import Link from 'next/link';
import { RecipeImage } from './RecipeImage';
import { DIFFICULTY_LABELS, DifficultyLevel } from '@/lib/constants';

export interface RecipeCardProps {
  id: number;
  name: string;
  description: string | null;
  imagePath?: string | null;
  creatorName: string;
  ingredientCount: number;
  createdAt: string;
  score?: number | null;
  tags?: string[];
  totalTimeMinutes?: number | null;
  difficulty?: string | null;
}

function getScoreBadgeColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function RecipeCard(props: RecipeCardProps) {
  const hasScore = props.score !== undefined && props.score !== null;

  return (
    <Link href={`/recipes/${props.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition overflow-hidden">
        <div data-testid="recipe-card-image" className="relative">
          <RecipeImage id={props.id} name={props.name} imagePath={props.imagePath} />
          {hasScore && (
            <div
              data-testid="score-badge"
              className={`absolute top-2 right-2 ${getScoreBadgeColor(
                props.score as number
              )} text-white text-xs font-bold px-2 py-1 rounded`}
            >
              {Math.round(props.score as number)}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 data-testid="recipe-card-title" className="text-xl font-bold text-ink">
            {props.name}
          </h3>
          <p className="text-gray-600 text-sm">von {props.creatorName}</p>

          {props.description && (
            <p className="text-gray-700 mt-2 line-clamp-2">{props.description}</p>
          )}

          {props.tags && props.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {props.tags.map((tag) => (
                <span
                  key={tag}
                  data-testid="tag-chip"
                  className="bg-surface text-ink text-xs px-2 py-0.5 rounded-full border border-accent/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div
            data-testid="recipe-card-meta"
            className="mt-3 flex flex-wrap justify-between gap-1 text-sm text-gray-500"
          >
            <span>{props.ingredientCount} Zutaten</span>
            {props.totalTimeMinutes !== null && props.totalTimeMinutes !== undefined && (
              <span>{props.totalTimeMinutes} min</span>
            )}
            {props.difficulty !== null && props.difficulty !== undefined && (
              <span>{DIFFICULTY_LABELS[props.difficulty as DifficultyLevel]}</span>
            )}
            <span>{new Date(props.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
