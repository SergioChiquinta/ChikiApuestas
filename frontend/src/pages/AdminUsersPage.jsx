import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data);
  }, []);

  useEffect(() => {
    let active = true;
    load()
      .catch((error) => active && showToast(getErrorMessage(error, 'No se pudieron cargar los usuarios.'), 'error'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [load, showToast]);

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const form = event.currentTarget;
      const payload = Object.fromEntries(new FormData(form).entries());
      await api.post('/admin/users', payload);
      form.reset();
      showToast('Usuario agregado correctamente.', 'success');
      await load();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = async (user, patch, successMessage) => {
    setUpdatingId(user.id);
    try {
      await api.put(`/admin/users/${user.id}`, patch);
      showToast(successMessage, 'success');
      await load();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">Panel administrativo</p>
        <h1>Administrar usuarios</h1>
      </div>

      <form className="panel inline-form users-form" onSubmit={create}>
        <input name="username" placeholder="Usuario" required />
        <input name="nombre" placeholder="Nombre" required />
        <input name="password" type="password" placeholder="Contraseña" minLength="8" required />
        <select name="rol" defaultValue="participante">
          <option value="participante">Participante</option>
          <option value="admin">Administrador</option>
        </select>
        <button disabled={saving}>{saving ? 'Agregando…' : 'Agregar usuario'}</button>
      </form>

      <div className="panel table-wrap">
        {loading ? (
          <p>Cargando usuarios…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.nombre}</td>
                  <td>
                    <select
                      className="table-select"
                      value={user.rol}
                      disabled={updatingId === user.id}
                      onChange={(event) => update(
                        user,
                        { rol: event.target.value },
                        `Rol de ${user.nombre} actualizado.`
                      )}
                    >
                      <option value="participante">Participante</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status ${user.activo === 'si' ? 'active-user' : 'inactive-user'}`}>
                      {user.activo === 'si' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="small secondary-button"
                      disabled={updatingId === user.id}
                      onClick={() => update(
                        user,
                        { activo: user.activo === 'si' ? 'no' : 'si' },
                        user.activo === 'si' ? 'Usuario desactivado.' : 'Usuario activado.'
                      )}
                    >
                      {user.activo === 'si' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
