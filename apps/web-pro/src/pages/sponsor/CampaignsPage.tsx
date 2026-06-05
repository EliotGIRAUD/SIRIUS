import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { B2B_PLANS } from '@sirius/shared';
import { api } from '../../lib/api';
import type { SponsorCampaign } from '../../lib/types';

export default function SponsorCampaignsPage() {
  const [campaigns, setCampaigns] = useState<SponsorCampaign[]>([]);
  const [error, setError] = useState('');
  const [activatingId, setActivatingId] = useState<string | null>(null);

  function load() {
    api<{ campaigns: SponsorCampaign[] }>('/sponsor/campaigns')
      .then((data) => setCampaigns(data.campaigns.map((c) => ({ ...c, id: c.id || c._id! }))))
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function activate(campaign: SponsorCampaign) {
    setActivatingId(campaign.id);
    try {
      await api(`/sponsor/campaigns/${campaign.id}/activate-mock`, {
        method: 'POST',
        body: JSON.stringify({ tier: campaign.tier }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setActivatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campagnes sponsoring</h2>
          <p className="text-sm text-slate-500">Visibilité sur la carte et la boutique adoptant</p>
        </div>
        <Link to="/sponsor/new" className="btn">
          Nouvelle campagne
        </Link>
      </div>

      {error && <p className="text-sm text-amber-700">{error}</p>}

      <div className="grid gap-4">
        {campaigns.map((c) => {
          const plan = B2B_PLANS[`sponsor_${c.tier}`];
          const progress = c.impressionsLimit ? Math.min(100, (c.impressionsCount / c.impressionsLimit) * 100) : 0;
          return (
            <div key={c.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  <p className="text-sm text-slate-500">
                    {plan?.label} — {plan?.priceEur}€/mois — {c.placement}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {c.status}
                </span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{c.impressionsCount.toLocaleString('fr-FR')} impressions</span>
                  <span>{c.impressionsLimit.toLocaleString('fr-FR')} max</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
              </div>
              {c.status !== 'active' && (
                <button
                  type="button"
                  className="btn mt-4"
                  disabled={activatingId === c.id}
                  onClick={() => activate(c)}
                >
                  {activatingId === c.id ? 'Activation…' : 'Activer (mock)'}
                </button>
              )}
            </div>
          );
        })}
        {campaigns.length === 0 && (
          <div className="card text-center text-slate-500">
            Aucune campagne. <Link to="/sponsor/new" className="text-primary hover:underline">Créer la première</Link>
          </div>
        )}
      </div>
    </div>
  );
}
