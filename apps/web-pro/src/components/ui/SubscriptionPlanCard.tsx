import { B2B_PLANS } from '@sirius/shared';

interface Props {
  planId: string;
  features: string[];
  status?: string;
  validUntil?: string;
  onActivate?: () => void;
  activating?: boolean;
  message?: string;
}

export function SubscriptionPlanCard({
  planId,
  features,
  status,
  validUntil,
  onActivate,
  activating,
  message,
}: Props) {
  const plan = B2B_PLANS[planId];
  if (!plan) return null;

  return (
    <div className="card max-w-lg">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">{plan.label}</p>
      <h2 className="mt-1 text-3xl font-bold">{plan.priceEur} €<span className="text-base font-normal text-slate-500">/mois</span></h2>
      {plan.impressions && (
        <p className="mt-1 text-sm text-slate-500">{plan.impressions.toLocaleString('fr-FR')} impressions incluses</p>
      )}
      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-green-600">✓</span>
            {f}
          </li>
        ))}
      </ul>
      {status && (
        <p className="mt-4 text-sm">
          Statut : <strong className={status === 'active' ? 'text-green-700' : 'text-amber-700'}>{status}</strong>
        </p>
      )}
      {validUntil && (
        <p className="text-sm text-slate-500">Valide jusqu'au {new Date(validUntil).toLocaleDateString('fr-FR')}</p>
      )}
      {onActivate && status !== 'active' && (
        <button type="button" className="btn mt-4" onClick={onActivate} disabled={activating}>
          {activating ? 'Activation…' : 'Activer (démo mock)'}
        </button>
      )}
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </div>
  );
}
