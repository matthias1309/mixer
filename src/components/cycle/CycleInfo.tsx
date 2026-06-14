'use client';

import { useEffect, useState } from 'react';
import { CycleInfoResponse } from '@/lib/cycle/types';
import { apiUrl } from '@lib/api-url';
import PhaseIndicator from './PhaseIndicator';

export default function CycleInfo() {
  const [cycle, setCycle] = useState<CycleInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCycle = async () => {
      try {
        const response = await fetch(apiUrl('/api/users/cycle'), {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCycle(data.data);
        }
      } catch (err) {
        // Failed to fetch cycle, will show error state
      } finally {
        setLoading(false);
      }
    };

    loadCycle();
  }, []);

  if (loading) return <div>Wird geladen...</div>;
  if (!cycle) return <div>Zyklus nicht gesetzt. Bitte initialisieren Sie zuerst.</div>;

  return (
    <div className="cycle-info">
      <h2>Ihr Zyklus</h2>

      <div className="phase-display">
        <PhaseIndicator phase={cycle.current_phase.phase.name} />
      </div>

      <div className="details">
        <p>
          <strong>Zyklustag:</strong> {cycle.current_phase.day_of_cycle + 1} von{' '}
          {cycle.cycle_length_days}
        </p>
        <p>
          <strong>Aktuelle Phase:</strong> {cycle.current_phase.phase.name}
        </p>
        <p>
          <strong>Fortschritt:</strong>{' '}
          {(cycle.current_phase.cycle_progress * 100).toFixed(0)}%
        </p>
      </div>

      <button onClick={() => window.location.reload()}>Aktualisieren</button>
    </div>
  );
}
