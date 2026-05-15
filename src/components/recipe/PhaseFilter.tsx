'use client';

import { useState } from 'react';

const PHASES = ['menstruation', 'follicular', 'ovulation', 'luteal'];
const PHASE_LABELS: Record<string, string> = {
  menstruation: 'Menstruation 🔴',
  follicular: 'Follicular 🟡',
  ovulation: 'Ovulation 🩷',
  luteal: 'Luteal 🟦',
};

interface PhaseFilterProps {
  onFilterChange: (phase: string, minScore: number) => void;
  currentPhase?: string;
}

export default function PhaseFilter({ onFilterChange, currentPhase }: PhaseFilterProps) {
  const [selectedPhase, setSelectedPhase] = useState(currentPhase || 'menstruation');
  const [minScore, setMinScore] = useState(50);

  const handlePhaseChange = (phase: string) => {
    setSelectedPhase(phase);
    onFilterChange(phase, minScore);
  };

  const handleScoreChange = (score: number) => {
    setMinScore(score);
    onFilterChange(selectedPhase, score);
  };

  return (
    <div className="phase-filter">
      <div className="phase-buttons">
        {PHASES.map(phase => (
          <button
            key={phase}
            className={`phase-btn ${selectedPhase === phase ? 'active' : ''}`}
            onClick={() => handlePhaseChange(phase)}
          >
            {PHASE_LABELS[phase]}
          </button>
        ))}
      </div>

      <div className="score-slider">
        <label>Min Score: {minScore}</label>
        <input
          type="range"
          min="0"
          max="100"
          value={minScore}
          onChange={e => handleScoreChange(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
}
