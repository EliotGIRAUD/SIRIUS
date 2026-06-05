import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import BreederDashboardPage from './pages/breeder/DashboardPage';
import BreederProfilePage from './pages/breeder/ProfilePage';
import BreederSubscriptionPage from './pages/breeder/SubscriptionPage';
import SponsorCampaignNewPage from './pages/sponsor/CampaignNewPage';
import SponsorCampaignsPage from './pages/sponsor/CampaignsPage';
import ShelterClientPage from './pages/shelter/ClientPage';
import ShelterCodesPage from './pages/shelter/CodesPage';
import ShelterDashboardPage from './pages/shelter/DashboardPage';
import ShelterSettingsPage from './pages/shelter/SettingsPage';
import ShelterSubscriptionPage from './pages/shelter/SubscriptionPage';
import { homeForRole } from './lib/routes';

function RootRedirect() {
  const { user, isBootstrapped } = useAuth();
  if (!isBootstrapped) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(user.role)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route element={<ProtectedRoute roles={['shelter']} />}>
        <Route path="/shelter" element={<ShelterDashboardPage />} />
        <Route path="/shelter/codes" element={<ShelterCodesPage />} />
        <Route path="/shelter/subscription" element={<ShelterSubscriptionPage />} />
        <Route path="/shelter/settings" element={<ShelterSettingsPage />} />
        <Route path="/shelter/client/:id" element={<ShelterClientPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['breeder']} />}>
        <Route path="/breeder" element={<BreederDashboardPage />} />
        <Route path="/breeder/profile" element={<BreederProfilePage />} />
        <Route path="/breeder/subscription" element={<BreederSubscriptionPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={['sponsor']} />}>
        <Route path="/sponsor" element={<SponsorCampaignsPage />} />
        <Route path="/sponsor/new" element={<SponsorCampaignNewPage />} />
      </Route>

      <Route path="/client/:id" element={<LegacyClientRedirect />} />
      <Route path="/subscription" element={<LegacySubscriptionRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function LegacyClientRedirect() {
  const { id } = useParams();
  return <Navigate to={`/shelter/client/${id}`} replace />;
}

function LegacySubscriptionRedirect() {
  return <Navigate to="/shelter/subscription" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
