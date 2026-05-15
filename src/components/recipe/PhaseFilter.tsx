'use client';

import { useState } from 'react';

const PHASES = ['none', 'menstruation', 'follicular', 'ovulation', 'luteal'];
const PHASE_LABELS: Record<string, string> = {
  none: 'Keine Zyklus-Filterung',
  menstruation: 'Menstruell 🔴',
  follicular: 'Follikulär 🟡',
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
  const currentPhaseLabel = currentPhase ? PHASE_LABELS[currentPhase] : 'Keine Zyklus-Daten';

  const handlePhaseChange = (phase: string) => {
    setSelectedPhase(phase);
    onFilterChange(phase, minScore);
  };

  const handleScoreChange = (score: number) => {
    setMinScore(score);
    onFilterChange(selectedPhase, score);
  };

  return (
    <div className="phase-filter space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Zyklusphase</label>
        <select
          value={selectedPhase}
          onChange={(e) => handlePhaseChange(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-blue-500"
        >
          {currentPhase && (
            <option value={currentPhase}>
              Automatisch: {PHASE_LABELS[currentPhase]}
            </option>
          )}
          <optgroup label="Mit anderen Phasen vergleichen">
            {PHASES.filter(p => p !== 'none').map(phase => (
              <option key={phase} value={phase}>
                {PHASE_LABELS[phase]}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Min. Bewertung: {minScore}</label>
        <input
          type="range"
          min="0"
          max="100"
          value={minScore}
          onChange={e => handleScoreChange(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
