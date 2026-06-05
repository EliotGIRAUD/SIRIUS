import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { B2B_PLANS } from '@sirius/shared';
import { api } from '../../lib/api';

const TIERS = ['starter', 'standard', 'premium', 'exclusive'] as const;

export default function CampaignNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [tier, setTier] = useState<(typeof TIERS)[number]>('starter');
  const [placement, setPlacement] = useState('map');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const plan = B2B_PLANS[`sponsor_${tier}`];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api('/sponsor/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name, tier, placement }),
      });
      navigate('/sponsor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Nouvelle campagne</h2>
        <p className="text-sm text-slate-500">Choisissez un palier — activation mock après création</p>
      </div>

      <form className="card max-w-lg space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label" htmlFor="name">Nom de la campagne</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <p className="label">Palier</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {TIERS.map((t) => {
              const p = B2B_PLANS[`sponsor_${t}`];
              return (
                <button
                  key={t}
                  type="button"
                  className={`rounded-lg border p-3 text-left text-sm ${
                    tier === t ? 'border-primary bg-blue-50' : 'border-slate-200'
                  }`}
                  onClick={() => setTier(t)}
                >
                  <span className="font-semibold">{p.label}</span>
                  <span className="block text-slate-500">{p.priceEur}€ — {p.impressions?.toLocaleString('fr-FR')} imp.</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="placement">Emplacement</label>
          <select id="placement" className="input" value={placement} onChange={(e) => setPlacement(e.target.value)}>
            <option value="map">Carte GPS</option>
            <option value="shop">Boutique</option>
            <option value="home">Accueil adoptant</option>
          </select>
        </div>

        {plan && (
          <p className="text-sm text-slate-600">
            Récap : {plan.label} à {plan.priceEur}€/mois (paiement mock à l'activation)
          </p>
        )}

        {error && <p className="text-sm text-amber-700">{error}</p>}

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Création…' : 'Créer la campagne'}
        </button>
      </form>
    </div>
  );
}
