import { useEffect, useMemo, useState } from 'react';
import { api, assetUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';

function errorMessage(error) {
  if (error.code === 'ERR_NETWORK') {
    return 'No se pudo conectar con el backend. Comprueba que npm run dev siga ejecutándose en backend.';
  }
  return error.response?.data?.message || 'No se pudieron guardar los cambios.';
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState('');

  useEffect(() => setNombre(user?.nombre || ''), [user?.nombre]);
  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const currentPhoto = useMemo(
    () => localPreview || assetUrl(user?.foto_perfil),
    [localPreview, user?.foto_perfil]
  );

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);

    try {
      const { data } = await api.put('/users/me', {
        nombre,
        password: password || undefined
      });
      setUser(data);
      setPassword('');
      setMessage('Perfil actualizado correctamente.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Selecciona una imagen JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar los 2 MB.');
      return;
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setMessage('');
    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('foto', file);
      const { data } = await api.post('/users/me/photo', formData);
      setUser((currentUser) => ({ ...currentUser, ...data }));
      setLocalPreview('');
      setMessage('Foto de perfil actualizada correctamente.');
    } catch (requestError) {
      setLocalPreview('');
      setError(errorMessage(requestError));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section>
      <h1>Mi perfil</h1>

      <div className="profile-grid">
        <aside className="panel profile-photo-panel">
          <div className="profile-avatar large">
            {currentPhoto
              ? <img src={currentPhoto} alt={`Foto de ${user?.nombre}`} />
              : <span>{user?.nombre?.charAt(0)?.toUpperCase() || '?'}</span>}
          </div>

          <label className={`upload-button ${uploading ? 'disabled' : ''}`}>
            {uploading ? 'Subiendo imagen…' : 'Seleccionar foto'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={uploadPhoto}
              disabled={uploading}
            />
          </label>
          <small className="muted">JPG, PNG o WEBP. Máximo 2 MB.</small>
        </aside>

        <form className="panel form" onSubmit={save}>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="alert">{error}</p>}

          <label>
            Nombre
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              maxLength={80}
              required
            />
          </label>

          <label>
            Rol
            <input value={user?.rol || ''} disabled />
          </label>

          <label>
            Nueva contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              placeholder="Déjalo vacío para conservarla"
            />
          </label>

          <button disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </section>
  );
}
