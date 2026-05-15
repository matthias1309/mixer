'use client';

import { useEffect } from 'react';

export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow max-w-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Es ist ein Fehler aufgetreten!</h2>
        <p className="text-gray-700 mb-4">{error.message || 'Ein unerwarteter Fehler ist aufgetreten'}</p>
        <button
          onClick={reset}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}
