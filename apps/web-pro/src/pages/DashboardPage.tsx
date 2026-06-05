import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, clearToken } from '../lib/api';

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

export default function DashboardPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [newCode, setNewCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ clients: ClientRow[] }>('/pro/clients')
      .then((data) => setClients(data.clients))
      .catch((err) => setError(err.message));
  }, []);

  async function generateCode() {
    try {
      const data = await api<{ code: string }>('/pro/codes', {
        method: 'POST',
        body: JSON.stringify({ multiUse: true }),
      });
      setNewCode(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }

  return (
    <>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Tableau de bord Pro</h1>
        <button className="btn secondary" onClick={() => { clearToken(); window.location.href = '/login'; }}>
          Déconnexion
        </button>
      </header>

      <div className="card">
        <h2>Génération de code adoptant</h2>
        <button className="btn" onClick={generateCode}>Créer un code</button>
        {newCode && <p>Code généré : <strong>{newCode}</strong></p>}
      </div>

      <div className="card">
        <h2>Clients rattachés</h2>
        {error && <p className="alert">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Jour</th>
              <th>Score</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.displayName}</td>
                <td>{c.email}</td>
                <td>{c.simulation ? `J${c.simulation.currentDay}/30` : '—'}</td>
                <td>{c.simulation?.finalScore ?? '—'}</td>
                <td>{c.simulation?.status ?? 'Pas démarré'}</td>
                <td><Link to={`/client/${c.id}`}>Détails</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
