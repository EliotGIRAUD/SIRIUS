import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/ui/StatCard';
import { api } from '../../lib/api';

interface ClientRow {
  id: string;
  displayName: string;
  email: string;
  simulation: {
    status: string;
    currentDay: number;
    finalScore: number;
    validatedByShelter: boolean;
  } | null;
}

export default function ShelterDashboardPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<{ clientCount: number; avgScore: number; walkCount: number } | null>(null);

  useEffect(() => {
    api<{ clients: ClientRow[] }>('/pro/clients')
      .then((data) => setClients(data.clients))
      .catch((err) => setError(err.message));
    api<{ clientCount: number; avgScore: number; walkCount: number }>('/pro/dashboard-stats')
      .then(setStats)
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.displayName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [clients, search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tableau de bord refuge</h2>
        <p className="text-sm text-slate-500">Suivi des adoptants et indicateurs clés</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Adoptants" value={stats.clientCount} />
          <StatCard label="Score moyen" value={stats.avgScore} hint="/ 100" />
          <StatCard label="Balades GPS" value={stats.walkCount} />
        </div>
      )}

      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold">Clients rattachés</h3>
          <input
            className="input max-w-xs"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Nom</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Jour</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Statut</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium">{c.displayName}</td>
                  <td className="py-3 pr-4 text-slate-600">{c.email}</td>
                  <td className="py-3 pr-4">{c.simulation ? `J${c.simulation.currentDay}/30` : '—'}</td>
                  <td className="py-3 pr-4">{c.simulation?.finalScore ?? '—'}</td>
                  <td className="py-3 pr-4">{c.simulation?.status ?? 'Pas démarré'}</td>
                  <td className="py-3">
                    <Link to={`/shelter/client/${c.id}`} className="font-medium text-primary hover:underline">
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">Aucun client trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
