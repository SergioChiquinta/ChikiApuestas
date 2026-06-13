import { NavLink, Outlet } from 'react-router-dom';
import { assetUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const photo = assetUrl(user?.foto_perfil);

  const closeSession = () => {
    logout();
    showToast('Sesión cerrada correctamente.', 'info');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">Chiki<span>Pronósticos</span></div>
          <p className="muted">Encuestas familiares del Mundial 2026 y más...</p>
        </div>

        <nav>
          <NavLink to="/">Resumen</NavLink>
          <NavLink to="/partidos">Calendario</NavLink>
          <NavLink to="/participacion">Participación</NavLink>
          <NavLink to="/ranking">Ranking</NavLink>

          {user?.rol === 'participante' && (
            <NavLink to="/mis-elecciones">Mis elecciones</NavLink>
          )}

          <NavLink to="/perfil">Perfil</NavLink>

          {user?.rol === 'admin' && (
            <>
              <NavLink to="/admin/usuarios">Administrar usuarios</NavLink>
              <NavLink to="/admin/partidos">Administrar partidos</NavLink>
            </>
          )}
        </nav>

        <button className="ghost" type="button" onClick={closeSession}>
          Cerrar sesión
        </button>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="topbar-user">
            <div className="profile-avatar small-avatar">
              {photo
                ? <img src={photo} alt="Foto de perfil" />
                : <span>{user?.nombre?.charAt(0)?.toUpperCase() || '?'}</span>}
            </div>

            <div className="topbar-user-copy">
              <strong>{user?.nombre}</strong>
              <span className="role">{user?.rol}</span>
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
