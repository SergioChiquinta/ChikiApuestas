import { useEffect, useMemo, useState } from 'react';
import { api, assetUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [password, setPassword] = useState('');
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
    setSaving(true);

    try {
      const { data } = await api.put('/users/me', {
        nombre,
        password: password || undefined
      });
      setUser(data);
      setPassword('');
      showToast('Perfil actualizado correctamente.', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'No se pudo actualizar el perfil.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Selecciona una imagen JPG, PNG o WEBP.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen no puede superar los 2 MB.', 'error');
      return;
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('foto', file);
      const { data } = await api.post('/users/me/photo', formData);
      setUser((currentUser) => ({ ...currentUser, ...data }));
      setLocalPreview('');
      showToast('Foto de perfil actualizada.', 'success');
    } catch (error) {
      setLocalPreview('');
      showToast(getErrorMessage(error, 'No se pudo actualizar la foto.'), 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">Datos personales</p>
        <h1>Mi perfil</h1>
      </div>

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

          <button disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </form>
      </div>
    </section>
  );
}
