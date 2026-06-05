import { useEffect, useState } from 'react';
import { SubscriptionPlanCard } from '../../components/ui/SubscriptionPlanCard';
import { api } from '../../lib/api';
import type { BreederInfo } from '../../lib/types';

export default function BreederSubscriptionPage() {
  const [breeder, setBreeder] = useState<BreederInfo | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ breeder: BreederInfo }>('/breeders/me').then((data) => setBreeder(data.breeder)).catch((e) => setMsg(e.message));
  }, []);

  async function activate() {
    if (!breeder) return;
    setLoading(true);
    try {
      await api('/billing/subscribe-mock', {
        method: 'POST',
        body: JSON.stringify({ planId: 'breeder_launch', partnerType: 'breeder', partnerId: breeder.id }),
      });
      const refreshed = await api<{ breeder: BreederInfo }>('/breeders/me');
      setBreeder(refreshed.breeder);
      setMsg('Abonnement éleveur activé (mock)');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Abonnement éleveur</h2>
        <p className="text-sm text-slate-500">Paiement simulé jusqu'à la soutenance</p>
      </div>

      <SubscriptionPlanCard
        planId="breeder_launch"
        features={[
          'Fiche éleveur vérifiée sur la carte',
          'Recommandations par race',
          'Statistiques de vues mensuelles',
        ]}
        status={breeder?.subscriptionStatus}
        validUntil={breeder?.subscriptionValidUntil}
        onActivate={breeder?.subscriptionStatus !== 'active' ? activate : undefined}
        activating={loading}
        message={msg}
      />
    </div>
  );
}
