import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../lib/types';
import { BREEDER_NAV, SHELTER_NAV, SPONSOR_NAV } from '../../lib/routes';

const ROLE_LABELS: Record<UserRole, string> = {
  shelter: 'Refuge SPA',
  breeder: 'Éleveur',
  sponsor: 'Annonceur',
  adopter: 'Adoptant',
};

function navForRole(role: UserRole) {
  if (role === 'shelter') return SHELTER_NAV;
  if (role === 'breeder') return BREEDER_NAV;
  if (role === 'sponsor') return SPONSOR_NAV;
  return [];
}

export default function AppLayout() {
  const { user, shelter, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user ? navForRole(user.role) : [];

  function onLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">SIRIUS Pro</p>
            <h1 className="text-lg font-bold text-ink">{user ? ROLE_LABELS[user.role] : 'Portail B2B'}</h1>
            {shelter && <p className="text-sm text-slate-500">{shelter.name} · code {shelter.proCode}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{user?.displayName}</span>
            <button type="button" className="btn-outline" onClick={onLogout}>
              Déconnexion
            </button>
          </div>
        </div>
        {nav.length > 0 && (
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/shelter' || item.to === '/breeder' || item.to === '/sponsor'}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
