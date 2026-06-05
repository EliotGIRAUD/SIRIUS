import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, downloadPdf } from '../../lib/api';

interface HeatCell {
  day: number;
  score: number | null;
  closed: boolean;
  penaltiesCount: number;
}

interface MetricsResponse {
  client: { displayName: string; email: string };
  simulation: {
    _id: string;
    status: string;
    currentDay: number;
    finalScore: number;
    validatedByShelter: boolean;
    budgetRemaining: number;
  };
  logs: Array<{
    dayNumber: number;
    actions: Array<{ type: string; timestamp: string; cost: number }>;
    penalties: Array<{ message: string; points: number }>;
    dayScore: number | null;
  }>;
  heatmap: HeatCell[];
  attestation: { validatedAt: string } | null;
  walks?: Array<{ durationMinutes?: number; distanceMeters?: number; validated?: boolean; cheatFlags?: string[] }>;
  forgetCounts?: Record<string, number>;
  budget?: { remaining: number; initial: number; vitalSpent: number; superfluousSpent: number; totalSpent: number };
  attestationValidUntil?: string | null;
}

function heatClass(score: number | null, closed: boolean) {
  if (!closed || score === null) return 'bg-slate-200 text-slate-500';
  if (score >= 90) return 'bg-green-600 text-white';
  if (score >= 70) return 'bg-amber-500 text-white';
  return 'bg-red-600 text-white';
}

export default function ShelterClientPage() {
  const { id } = useParams();
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<MetricsResponse>(`/pro/client/${id}/metrics`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [id]);

  async function validate() {
    if (!id) return;
    setLoading(true);
    try {
      await api(`/pro/client/${id}/validate`, { method: 'POST' });
      const refreshed = await api<MetricsResponse>(`/pro/client/${id}/metrics`);
      setData(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  async function download() {
    if (!id || !data) return;
    await downloadPdf(id, `attestation-${data.client.displayName}.pdf`);
  }

  if (!data) {
    return <p className="text-slate-500">{error || 'Chargement…'}</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/shelter" className="text-sm font-medium text-primary hover:underline">
        ← Retour au tableau de bord
      </Link>

      <div className="card">
        <h2 className="text-2xl font-bold">{data.client.displayName}</h2>
        <p className="text-slate-600">{data.client.email}</p>
        <p className="mt-2 text-sm">
          Jour {data.simulation.currentDay}/30 — Score {data.simulation.finalScore}/100 — Budget restant {data.simulation.budgetRemaining}€
        </p>
        {data.budget && (
          <p className="text-sm text-slate-500">
            Vital {data.budget.vitalSpent}€ · Superflu {data.budget.superfluousSpent}€ · Total {data.budget.totalSpent}€
          </p>
        )}
        {data.simulation.status === 'completed' && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn"
              onClick={validate}
              disabled={loading || data.simulation.validatedByShelter}
            >
              {data.simulation.validatedByShelter ? 'Attestation validée' : 'Valider attestation'}
            </button>
            {data.attestation && (
              <button type="button" className="btn-secondary" onClick={download}>
                Télécharger PDF
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold">Heatmap 30 jours</h3>
        <div className="mt-4 grid grid-cols-10 gap-1">
          {data.heatmap.map((cell) => (
            <div
              key={cell.day}
              title={cell.score !== null ? `J${cell.day}: ${cell.score}` : `J${cell.day}`}
              className={`flex aspect-square items-center justify-center rounded text-[10px] font-semibold ${heatClass(cell.score, cell.closed)}`}
            >
              {cell.day}
            </div>
          ))}
        </div>
      </div>

      {data.walks && data.walks.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold">Balades GPS ({data.walks.length})</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {data.walks.map((w, i) => (
              <li key={i} className="text-slate-700">
                {w.validated ? '✓' : '✗'} {w.durationMinutes ?? 0} min — {w.distanceMeters ?? 0} m
                {w.cheatFlags?.length ? ` (${w.cheatFlags.join(', ')})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.forgetCounts && Object.keys(data.forgetCounts).length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold">Oublis / pénalités</h3>
          {Object.entries(data.forgetCounts).map(([code, count]) => (
            <p key={code} className="text-sm text-slate-700">{code} : {count} fois</p>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold">Timeline des pénalités</h3>
        {data.logs.flatMap((log) =>
          (log.penalties || []).map((p, idx) => (
            <p key={`${log.dayNumber}-${idx}`} className="text-sm text-red-600">
              Jour {log.dayNumber} — {p.message} ({p.points} pts)
            </p>
          )),
        )}
        {data.logs.every((l) => !l.penalties?.length) && <p className="text-sm text-slate-500">Aucune pénalité.</p>}
      </div>
    </div>
  );
}
