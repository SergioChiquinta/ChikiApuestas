import { useEffect, useMemo, useState } from 'react';
import { api, assetUrl } from '../api/client';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';

export default function ParticipationPage() {
  const { showToast } = useToast();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/matches/participation')
      .then(({ data }) => active && setParticipants(data))
      .catch((error) => showToast(getErrorMessage(error, 'No se pudo cargar la participación.'), 'error'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [showToast]);

  const average = useMemo(() => {
    if (!participants.length) return 0;
    return Math.round(participants.reduce((sum, item) => sum + item.porcentaje, 0) / participants.length);
  }, [participants]);

  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">Sin puntos ni clasificación por aciertos</p>
        <h1>Participación familiar</h1>
        <p className="muted">Esta vista solo muestra cuántas encuestas completó cada integrante.</p>
      </div>

      <div className="stats participation-summary">
        <article><span>Integrantes activos</span><strong>{participants.length}</strong></article>
        <article><span>Participación promedio</span><strong>{average}%</strong></article>
        <article><span>Encuestas del calendario</span><strong>{participants[0]?.total || 0}</strong></article>
      </div>

      <div className="panel participation-panel">
        {loading ? (
          <p>Cargando participación…</p>
        ) : participants.length === 0 ? (
          <p className="muted">Todavía no hay participantes activos.</p>
        ) : (
          participants.map((participant) => {
            const photo = assetUrl(participant.foto_perfil);
            return (
              <article className="participation-row" key={participant.id}>
                <div className="profile-avatar participation-avatar">
                  {photo
                    ? <img src={photo} alt={`Foto de ${participant.nombre}`} />
                    : <span>{participant.nombre?.charAt(0)?.toUpperCase() || '?'}</span>}
                </div>
                <div className="participation-copy">
                  <div className="participation-labels">
                    <strong>{participant.nombre}</strong>
                    <span>{participant.completadas} de {participant.total}</span>
                  </div>
                  <div className="progress-track" aria-label={`${participant.porcentaje}% completado`}>
                    <span style={{ width: `${participant.porcentaje}%` }} />
                  </div>
                </div>
                <strong className="participation-percent">{participant.porcentaje}%</strong>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
