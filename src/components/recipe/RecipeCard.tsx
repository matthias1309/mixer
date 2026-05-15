'use client';

import ScoreIndicator from './ScoreIndicator';
import PhaseLabel from './PhaseLabel';

const NUTRIENTS_LABEL = 'Reich an:';

interface RecipeCardProps {
  recipe_id: number;
  name: string;
  score?: number;
  phase?: string;
  matched_nutrients?: string[];
  reason?: string;
}

export default function RecipeCard({
  recipe_id,
  name,
  score = 0,
  phase,
  matched_nutrients = [],
  reason,
}: RecipeCardProps) {
  return (
    <div className="recipe-card">
      <div className="recipe-header">
        <h3>{name}</h3>
        {score !== undefined && <ScoreIndicator score={score} />}
      </div>

      {phase && <PhaseLabel phase={phase} />}

      {reason && <p className="reason">{reason}</p>}

      {matched_nutrients.length > 0 && (
        <div className="nutrients">
          <p className="label">{NUTRIENTS_LABEL}</p>
          <ul>
            {matched_nutrients.map(nut => (
              <li key={nut}>{nut}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
