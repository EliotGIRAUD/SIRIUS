import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../components/ui/StatCard';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import type { BreederInfo } from '../../lib/types';

export default function BreederDashboardPage() {
  const { breeder: cachedBreeder } = useAuth();
  const [breeder, setBreeder] = useState<BreederInfo | null>(cachedBreeder);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ breeder: BreederInfo }>('/breeders/me')
      .then((data) => setBreeder(data.breeder))
      .catch((err) => setError(err.message));
  }, []);

  if (!breeder && !error) return <p className="text-slate-500">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Tableau de bord éleveur</h2>
        <p className="text-sm text-slate-500">Visibilité et abonnement de votre élevage</p>
      </div>

      {error && <p className="text-sm text-amber-700">{error}</p>}

      {breeder && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Vues ce mois" value={breeder.monthlyViews} />
            <StatCard label="Statut abonnement" value={breeder.subscriptionStatus} />
            <StatCard label="Vérifié" value={breeder.verified ? 'Oui' : 'Non'} />
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold">{breeder.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{breeder.description || 'Aucune description'}</p>
            <p className="mt-2 text-sm">Races : {breeder.breeds.join(', ')}</p>
            <Link to="/breeder/profile" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              Modifier ma fiche →
            </Link>
          </div>

          {breeder.subscriptionStatus !== 'active' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Activez votre abonnement éleveur pour apparaître dans les recommandations adoptants.
              <Link to="/breeder/subscription" className="ml-1 font-semibold underline">Voir l'abonnement</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
