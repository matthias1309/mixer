'use client';

const STAR_VALUES = [1, 2, 3, 4, 5];

interface StarRatingProps {
  rating: number | null;
  onRate: (stars: number) => void;
}

export function StarRating({ rating, onRate }: StarRatingProps) {
  return (
    <div role="group" aria-label="Bewertung">
      {STAR_VALUES.map((value) => {
        const isFilled = rating !== null && value <= rating;
        return (
          <button
            key={value}
            type="button"
            aria-label={`${value} Stern${value !== 1 ? 'e' : ''}`}
            aria-pressed={isFilled}
            onClick={() => onRate(value)}
            className={isFilled ? 'text-yellow-500' : 'text-gray-300'}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
