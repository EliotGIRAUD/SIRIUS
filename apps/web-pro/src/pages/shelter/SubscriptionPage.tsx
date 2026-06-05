import { useEffect, useState } from 'react';
import { SubscriptionPlanCard } from '../../components/ui/SubscriptionPlanCard';
import { api } from '../../lib/api';

export default function ShelterSubscriptionPage() {
  const [sub, setSub] = useState<{ subscriptionStatus: string; subscriptionValidUntil?: string } | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ subscriptionStatus: string; subscriptionValidUntil?: string }>('/pro/subscription')
      .then(setSub)
      .catch((e) => setMsg(e.message));
  }, []);

  async function activate() {
    setLoading(true);
    try {
      const data = await api<{ shelter: { subscriptionStatus: string; subscriptionValidUntil: string } }>(
        '/pro/subscription/activate-mock',
        { method: 'POST', body: '{}' },
      );
      setSub({
        subscriptionStatus: data.shelter.subscriptionStatus,
        subscriptionValidUntil: data.shelter.subscriptionValidUntil,
      });
      setMsg('Abonnement activé (paiement mock — démo soutenance)');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Abonnement refuge</h2>
        <p className="text-sm text-slate-500">Paiement simulé jusqu'à la soutenance</p>
      </div>

      <SubscriptionPlanCard
        planId="spa_launch"
        features={[
          'Métriques GPS complètes par adoptant',
          'Rapports PDF et attestations',
          'Validité attestation 6 mois',
          'Tableau de bord KPI refuge',
        ]}
        status={sub?.subscriptionStatus}
        validUntil={sub?.subscriptionValidUntil}
        onActivate={sub?.subscriptionStatus !== 'active' ? activate : undefined}
        activating={loading}
        message={msg}
      />
    </div>
  );
}
