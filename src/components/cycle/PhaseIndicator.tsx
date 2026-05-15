'use client';

interface PhaseIndicatorProps {
  phase: string;
}

const PHASE_EMOJIS: Record<string, string> = {
  'Menstruation': '🔴',
  'Follicular': '🟡',
  'Ovulation': '🩷',
  'Luteal': '🟦',
};

const PHASE_COLORS: Record<string, string> = {
  'Menstruation': '#ff4444',
  'Follicular': '#ffdd00',
  'Ovulation': '#ff69b4',
  'Luteal': '#4444ff',
};

export default function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const emoji = PHASE_EMOJIS[phase] || '⚪';
  const color = PHASE_COLORS[phase] || '#999999';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '32px' }}>{emoji}</span>
      <span style={{ fontSize: '18px', color, fontWeight: 'bold' }}>{phase}</span>
    </div>
  );
}
