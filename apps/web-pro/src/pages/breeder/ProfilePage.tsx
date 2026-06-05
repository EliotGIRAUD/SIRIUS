import { FormEvent, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { BreederInfo } from '../../lib/types';

const BREED_OPTIONS = ['labrador', 'golden', 'berger', 'caniche'];

export default function BreederProfilePage() {
  const [breeder, setBreeder] = useState<BreederInfo | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [breeds, setBreeds] = useState<string[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ breeder: BreederInfo }>('/breeders/me')
      .then((data) => {
        setBreeder(data.breeder);
        setName(data.breeder.name);
        setDescription(data.breeder.description);
        setBreeds(data.breeder.breeds);
      })
      .catch((err) => setError(err.message));
  }, []);

  function toggleBreed(id: string) {
    setBreeds((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const data = await api<{ breeder: BreederInfo }>('/breeders/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, description, breeds }),
      });
      setBreeder(data.breeder);
      setMsg('Fiche mise à jour');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  if (!breeder && !error) return <p className="text-slate-500">Chargement…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Ma fiche éleveur</h2>
        <p className="text-sm text-slate-500">Visible par les adoptants sur la carte et les recommandations</p>
      </div>

      <form className="card max-w-lg space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label" htmlFor="name">Nom de l'élevage</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="desc">Description</label>
          <textarea
            id="desc"
            className="input min-h-24"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <p className="label">Races</p>
          <div className="flex flex-wrap gap-2">
            {BREED_OPTIONS.map((b) => (
              <button
                key={b}
                type="button"
                className={`rounded-full px-3 py-1 text-sm capitalize ${
                  breeds.includes(b) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                }`}
                onClick={() => toggleBreed(b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-amber-700">{error}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
