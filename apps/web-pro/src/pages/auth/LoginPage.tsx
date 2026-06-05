import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeForRole } from '../../lib/routes';

const DEMO_ACCOUNTS = [
  { label: 'Refuge SPA', email: 'pro@spa-demo.fr', password: 'shelter123' },
  { label: 'Éleveur', email: 'breeder@demo.fr', password: 'breeder123' },
  { label: 'Annonceur', email: 'sponsor@demo.fr', password: 'sponsor123' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('pro@spa-demo.fr');
  const [password, setPassword] = useState('shelter123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(homeForRole(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">SIRIUS Pro</p>
        <h1 className="mt-1 text-2xl font-bold">Connexion B2B</h1>
        <p className="mt-1 text-sm text-slate-500">Refuge, éleveur ou annonceur</p>

        <form className="mt-6" onSubmit={onSubmit}>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className="label mt-3" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}

          <button className="btn mt-4 w-full" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium uppercase text-slate-400">Comptes démo</p>
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50"
              onClick={() => {
                setEmail(acc.email);
                setPassword(acc.password);
              }}
            >
              <span className="font-medium">{acc.label}</span>
              <span className="text-slate-500"> — {acc.email}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Créer un compte partenaire
          </Link>
        </p>
      </div>
    </div>
  );
}
