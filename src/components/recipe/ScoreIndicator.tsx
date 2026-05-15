'use client';

interface ScoreIndicatorProps {
  score: number;
}

export default function ScoreIndicator({ score }: ScoreIndicatorProps) {
  const getColor = (s: number) => {
    if (s >= 80) return '#4CAF50';
    if (s >= 60) return '#FFC107';
    if (s >= 40) return '#FF9800';
    return '#ccc';
  };

  const getLabel = (s: number) => {
    if (s >= 80) return 'Excellent';
    if (s >= 60) return 'Very Good';
    if (s >= 40) return 'Good';
    return 'Fair';
  };

  return (
    <div className="score-indicator">
      <div
        className="score-circle"
        style={{
          background: getColor(score),
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
        }}
      >
        {score.toFixed(0)}
      </div>
      <p className="score-label">{getLabel(score)}</p>
    </div>
  );
}
