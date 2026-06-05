import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeForRole } from '../../lib/routes';
import type { UserRole } from '../../lib/types';
import AppLayout from './AppLayout';

interface Props {
  roles: UserRole[];
}

export default function ProtectedRoute({ roles }: Props) {
  const { user, isBootstrapped } = useAuth();

  if (!isBootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Chargement…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;

  return <AppLayout />;
}
