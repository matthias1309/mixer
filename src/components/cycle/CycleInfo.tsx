'use client';

import { useEffect, useState } from 'react';
import { CycleInfoResponse } from '@/lib/cycle/types';
import PhaseIndicator from './PhaseIndicator';

export default function CycleInfo() {
  const [cycle, setCycle] = useState<CycleInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCycle = async () => {
      try {
        const response = await fetch('/api/users/cycle', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          console.log('[CycleInfo] Loaded cycle data:', data.data);
          setCycle(data.data);
        } else {
          console.log('[CycleInfo] Response not ok:', response.status);
        }
      } catch (err) {
        console.error('Failed to fetch cycle:', err);
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
