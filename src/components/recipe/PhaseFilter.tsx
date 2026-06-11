'use client';

import { useState } from 'react';

interface Phase {
  id: string;
  label: string;
  emoji: string;
  activeClass: string;
}

const PHASES: Phase[] = [
  { id: 'menstruation', label: 'Menstruation', emoji: '🔴', activeClass: 'bg-red-500 text-white' },
  { id: 'follicular', label: 'Follikulär', emoji: '🟡', activeClass: 'bg-yellow-400 text-white' },
  { id: 'ovulation', label: 'Ovulation', emoji: '🩷', activeClass: 'bg-pink-500 text-white' },
  { id: 'luteal', label: 'Luteal', emoji: '🟦', activeClass: 'bg-blue-500 text-white' },
];

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
    <div className="phase-filter space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Zyklusphase</label>
        <div className="flex flex-wrap gap-2">
          {PHASES.map((phase) => {
            const isActive = selectedPhase === phase.id;
            return (
              <button
                key={phase.id}
                onClick={() => handlePhaseChange(phase.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  isActive
                    ? `${phase.activeClass} border-transparent`
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                }`}
              >
                <span>{phase.emoji}</span>
                <span>{phase.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Min. Bewertung: {minScore}</label>
        <input
          type="range"
          min="0"
          max="100"
          value={minScore}
          onChange={(e) => handleScoreChange(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
