'use client';

const PHASE_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  Menstruation: { emoji: '🔴', label: 'Menstruell', color: '#ff4444' },
  Follicular: { emoji: '🟡', label: 'Follikulär', color: '#ffdd00' },
  Ovulation: { emoji: '🩷', label: 'Ovulation', color: '#ff69b4' },
  Luteal: { emoji: '🟦', label: 'Luteal', color: '#4444ff' },
};

interface PhaseLabelProps {
  phase: string;
}

export default function PhaseLabel({ phase }: PhaseLabelProps) {
  const info = PHASE_INFO[phase];
  if (!info) return null;

  return (
    <span className="phase-label" style={{ color: info.color }}>
      {info.emoji} Perfekt für {info.label}-Phase
    </span>
  );
}
