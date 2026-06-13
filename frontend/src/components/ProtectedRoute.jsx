import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="screen-center">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
}
