import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MatchesPage from './pages/MatchesPage';
import PredictionsPage from './pages/PredictionsPage';
import ParticipationPage from './pages/ParticipationPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminMatchesPage from './pages/AdminMatchesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="partidos" element={<MatchesPage />} />
            <Route path="participacion" element={<ParticipationPage />} />
            <Route path="ranking" element={<Navigate to="/participacion" replace />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route
              path="mis-elecciones"
              element={<ProtectedRoute roles={['participante']}><PredictionsPage /></ProtectedRoute>}
            />
            <Route
              path="mis-pronosticos"
              element={<Navigate to="/mis-elecciones" replace />}
            />
            <Route
              path="admin/usuarios"
              element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>}
            />
            <Route
              path="admin/partidos"
              element={<ProtectedRoute roles={['admin']}><AdminMatchesPage /></ProtectedRoute>}
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
