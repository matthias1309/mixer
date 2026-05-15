'use client';

import { useState } from 'react';

interface CycleFormProps {
  onSave?: (data: any) => void;
}

export default function CycleForm({ onSave }: CycleFormProps) {
  const [date, setDate] = useState('');
  const [length, setLength] = useState('28');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          last_menstruation_date: date,
          cycle_length_days: parseInt(length),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save cycle');
      }

      const data = await response.json();
      onSave?.(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="cycle-form">
      <h2>Verfolgung Ihres Zyklus</h2>

      {error && <div className="error">{error}</div>}

      <div className="form-group">
        <label htmlFor="last-date">Startdatum</label>
        <input
          id="last-date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="cycle-length">Zyklus-Länge (Tage)</label>
        <input
          id="cycle-length"
          type="number"
          min="21"
          max="35"
          value={length}
          onChange={e => setLength(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Wird gespeichert...' : 'Zyklus speichern'}
      </button>
    </form>
  );
}
