'use client';

import { useState, useEffect } from 'react';

export interface CreateIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  suggestedName: string;
}

export function CreateIngredientModal({
  isOpen,
  onClose,
  onCreate,
  suggestedName,
}: CreateIngredientModalProps) {
  const [name, setName] = useState(suggestedName);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(suggestedName);
      setError('');
    }
  }, [isOpen, suggestedName]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name ist erforderlich');
      return;
    }

    setIsLoading(true);
    try {
      await onCreate(trimmedName);
      setName('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Es ist ein Fehler aufgetreten'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    if (error) setError('');
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" className="text-xl font-bold mb-4">
          Neue Zutat erstellen
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Zutat-Name (Deutsch) *
            </label>
            <input
              type="text"
              placeholder="Zutat-Name (Deutsch)"
              value={name}
              onChange={handleNameChange}
              maxLength={255}
              className="w-full border rounded px-3 py-2 focus:outline-blue-500"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">{name.length}/255</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Erstellen...' : 'Erstellen'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
