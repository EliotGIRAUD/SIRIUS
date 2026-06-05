import { useAuth } from '../../context/AuthContext';

export default function ShelterSettingsPage() {
  const { user, shelter } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Paramètres</h2>
        <p className="text-sm text-slate-500">Informations de votre compte refuge</p>
      </div>

      <div className="card max-w-lg space-y-4">
        <div>
          <p className="text-sm text-slate-500">Responsable</p>
          <p className="font-medium">{user?.displayName}</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Email</p>
          <p className="font-medium">{user?.email}</p>
        </div>
        {shelter && (
          <>
            <div>
              <p className="text-sm text-slate-500">Refuge</p>
              <p className="font-medium">{shelter.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Code SPA</p>
              <p className="font-mono text-lg font-bold text-primary">{shelter.proCode}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
