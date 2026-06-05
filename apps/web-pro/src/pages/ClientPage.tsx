import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, downloadPdf } from '../lib/api';

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
}

function heatColor(score: number | null, closed: boolean) {
  if (!closed || score === null) return '#e2e8f0';
  if (score >= 90) return '#16a34a';
  if (score >= 70) return '#ca8a04';
  return '#dc2626';
}

export default function ClientPage() {
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

  if (!data) return <p>{error || 'Chargement…'}</p>;

  return (
    <>
      <Link to="/">← Retour</Link>
      <div className="card">
        <h1>{data.client.displayName}</h1>
        <p>{data.client.email}</p>
        <p>Jour {data.simulation.currentDay}/30 — Score {data.simulation.finalScore}/100</p>
        <p>Budget restant : {data.simulation.budgetRemaining}€</p>
        {data.simulation.status === 'completed' && (
          <>
            <button className="btn" onClick={validate} disabled={loading || data.simulation.validatedByShelter}>
              {data.simulation.validatedByShelter ? 'Attestation validée' : 'Valider attestation'}
            </button>
            {data.attestation && (
              <button className="btn secondary" style={{ marginLeft: 8 }} onClick={download}>
                Télécharger PDF
              </button>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2>Heatmap 30 jours</h2>
        <div className="heatmap">
          {data.heatmap.map((cell) => (
            <div
              key={cell.day}
              className="heat-cell"
              style={{ background: heatColor(cell.score, cell.closed) }}
              title={cell.score !== null ? `J${cell.day}: ${cell.score}` : `J${cell.day}`}
            >
              {cell.day}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Erreurs et timeline</h2>
        {data.logs.flatMap((log) =>
          (log.penalties || []).map((p, idx) => (
            <p key={`${log.dayNumber}-${idx}`} className="penalty">
              Jour {log.dayNumber} — {p.message} ({p.points} pts)
            </p>
          )),
        )}
        {data.logs.every((l) => !l.penalties?.length) && <p>Aucune pénalité enregistrée.</p>}
      </div>
    </>
  );
}
