'use client';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import CycleForm from '../../components/cycle/CycleForm';
import CycleInfo from '../../components/cycle/CycleInfo';
import { useState } from 'react';

export default function CyclePage() {
  const [cycleInitialized, setCycleInitialized] = useState(false);

  return (
    <ProtectedRoute>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Zyklus-Verfolgung</h1>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Legen Sie Ihren Zyklus fest</h2>
              <CycleForm onSave={() => setCycleInitialized(true)} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-4">Aktuelle Zyklusinformationen</h2>
              <CycleInfo />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <a href="/dashboard" className="text-blue-600 hover:underline">
            ← Zurück zum Dashboard
          </a>
        </div>
      </div>
    </ProtectedRoute>
  );
}
