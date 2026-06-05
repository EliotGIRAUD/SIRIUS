import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export default function ShelterCodesPage() {
  const { shelter } = useAuth();
  const [newCode, setNewCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function generateCode() {
    setLoading(true);
    setError('');
    try {
      const data = await api<{ code: string }>('/pro/codes', {
        method: 'POST',
        body: JSON.stringify({ multiUse: true }),
      });
      setNewCode(data.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Codes adoptant</h2>
        <p className="text-sm text-slate-500">Générez des codes pour lier de nouveaux adoptants à votre refuge</p>
      </div>

      {shelter && (
        <div className="card">
          <p className="text-sm text-slate-500">Code refuge permanent</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-2xl font-bold tracking-widest text-primary">{shelter.proCode}</span>
            <button type="button" className="btn-outline" onClick={() => copy(shelter.proCode)}>
              Copier
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">Utilisable à l'inscription (ex. SPADEMO1)</p>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-semibold">Code à usage multiple</h3>
        <p className="mt-1 text-sm text-slate-500">Génère un code à 6 caractères pour une campagne ou un groupe d'adoptants</p>
        <button type="button" className="btn mt-4" onClick={generateCode} disabled={loading}>
          {loading ? 'Génération…' : 'Créer un code'}
        </button>
        {newCode && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3">
            <span className="text-xl font-bold tracking-widest">{newCode}</span>
            <button type="button" className="btn-outline" onClick={() => copy(newCode)}>
              Copier
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}
      </div>
    </div>
  );
}
