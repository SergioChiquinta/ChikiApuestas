import { NavLink, Outlet } from 'react-router-dom';
import { assetUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const photo = assetUrl(user?.foto_perfil);

  return <div className="app-shell">
    <aside className="sidebar">
      <div><div className="brand">Chiki<span>Pronósticos</span></div><p className="muted">Quiniela familiar por puntos</p></div>
      <nav>
        <NavLink to="/">Resumen</NavLink><NavLink to="/partidos">Partidos</NavLink><NavLink to="/ranking">Ranking</NavLink>
        {user?.rol === 'participante' && <NavLink to="/mis-pronosticos">Mis pronósticos</NavLink>}
        <NavLink to="/perfil">Perfil</NavLink>
        {user?.rol === 'admin' && <><NavLink to="/admin/usuarios">Administrar usuarios</NavLink><NavLink to="/admin/partidos">Administrar partidos</NavLink></>}
      </nav>
      <button className="ghost" onClick={logout}>Cerrar sesión</button>
    </aside>
    <main className="content">
      <header className="topbar">
        <div className="topbar-user">
          <div className="profile-avatar small-avatar">
            {photo ? <img src={photo} alt="Foto de perfil" /> : <span>{user?.nombre?.charAt(0)?.toUpperCase() || '?'}</span>}
          </div>
          <strong>{user?.nombre}</strong><span className="role">{user?.rol}</span>
        </div>
      </header>
      <Outlet />
    </main>
  </div>;
}
