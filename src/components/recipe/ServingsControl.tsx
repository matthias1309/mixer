interface ServingsControlProps {
  servings: number;
  originalServings: number;
  isLoading: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

export function ServingsControl({
  servings,
  originalServings,
  isLoading,
  onDecrease,
  onIncrease,
}: ServingsControlProps) {
  const isScaled = servings !== originalServings;

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg font-bold">Zutaten</span>
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
        <button
          onClick={onDecrease}
          disabled={isLoading || servings <= 1}
          aria-label="Portionen verringern"
          className="w-7 h-7 rounded-full bg-white shadow text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          −
        </button>
        <span className="min-w-[80px] text-center text-sm font-medium text-gray-700">
          {isLoading ? '…' : `${servings} Portion${servings !== 1 ? 'en' : ''}`}
        </span>
        <button
          onClick={onIncrease}
          disabled={isLoading || servings >= 100}
          aria-label="Portionen erhöhen"
          className="w-7 h-7 rounded-full bg-white shadow text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
        >
          +
        </button>
      </div>
      {isScaled && <span className="text-xs text-blue-600">(Original: {originalServings})</span>}
    </div>
  );
}
