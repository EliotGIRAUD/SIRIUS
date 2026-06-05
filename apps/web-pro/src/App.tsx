import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientPage from './pages/ClientPage';

function App() {
  const token = localStorage.getItem('sirius_token');

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={token ? <DashboardPage /> : <Navigate to="/login" replace />} />
        <Route path="/client/:id" element={token ? <ClientPage /> : <Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
