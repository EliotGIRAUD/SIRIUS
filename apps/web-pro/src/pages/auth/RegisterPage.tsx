import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, saveToken } from '../../lib/api';
import { homeForRole } from '../../lib/routes';
import type { AuthUser } from '../../lib/types';

type PartnerType = 'shelter' | 'breeder' | 'sponsor';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [type, setType] = useState<PartnerType>('shelter');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      let path = '/auth/register-shelter';
      let body: Record<string, string> = { email, password, displayName, shelterName: orgName };

      if (type === 'breeder') {
        path = '/auth/register-breeder';
        body = { email, password, displayName, name: orgName };
      }
      if (type === 'sponsor') {
        path = '/auth/register-sponsor';
        body = { email, password, displayName, companyName: orgName };
      }

      const data = await api<{ token: string; user: AuthUser; shelter?: { proCode: string } }>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      saveToken(data.token);
      await refresh();
      if (data.shelter?.proCode) {
        setSuccess(`Compte créé. Code refuge : ${data.shelter.proCode}`);
        setTimeout(() => navigate(homeForRole(data.user.role)), 1200);
      } else {
        navigate(homeForRole(data.user.role));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  const orgLabel = type === 'shelter' ? 'Nom du refuge' : type === 'breeder' ? 'Nom de l\'élevage' : 'Nom de l\'entreprise';

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold">Inscription partenaire</h1>
        <p className="mt-1 text-sm text-slate-500">Choisissez votre type de compte B2B</p>

        <div className="mt-4 flex gap-2">
          {(['shelter', 'breeder', 'sponsor'] as PartnerType[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium ${
                type === t ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
              }`}
              onClick={() => setType(t)}
            >
              {t === 'shelter' ? 'Refuge' : t === 'breeder' ? 'Éleveur' : 'Annonceur'}
            </button>
          ))}
        </div>

        <form className="mt-6" onSubmit={onSubmit}>
          <label className="label" htmlFor="displayName">Votre nom</label>
          <input id="displayName" className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />

          <label className="label mt-3" htmlFor="orgName">{orgLabel}</label>
          <input id="orgName" className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />

          <label className="label mt-3" htmlFor="email">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label className="label mt-3" htmlFor="password">Mot de passe</label>
          <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

          {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}
          {success && <p className="mt-3 text-sm text-green-700">{success}</p>}

          <button className="btn mt-4 w-full" type="submit" disabled={loading}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">Déjà inscrit ? Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
