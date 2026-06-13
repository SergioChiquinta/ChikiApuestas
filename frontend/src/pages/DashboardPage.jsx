import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { flagFor } from '../utils/flags';
import { getErrorMessage } from '../utils/errors';
import { limaDateText, matchHeading } from '../utils/matchFormat';

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [matches, setMatches] = useState([]);
  const [participation, setParticipation] = useState([]);
  const [mySelections, setMySelections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const requests = [api.get('/matches'), api.get('/matches/participation')];
    if (user?.rol === 'participante') requests.push(api.get('/predictions/me'));

    Promise.all(requests)
      .then((responses) => {
        if (!active) return;
        setMatches(responses[0].data);
        setParticipation(responses[1].data);
        setMySelections(responses[2]?.data || []);
      })
      .catch((error) => showToast(getErrorMessage(error, 'No se pudo cargar el resumen.'), 'error'))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [showToast, user?.rol]);

  const available = matches.filter((match) => !match.bloqueado && match.estado === 'pendiente').length;
  const finished = matches.filter((match) => match.estado === 'finalizado').length;
  const myParticipation = participation.find((item) => String(item.id) === String(user?.id));

  const upcoming = useMemo(
    () => matches
      .filter((match) => !match.bloqueado && match.estado === 'pendiente')
      .sort((a, b) => String(a.inicio_iso).localeCompare(String(b.inicio_iso)))
      .slice(0, 4),
    [matches]
  );

  if (loading) return <div className="panel">Cargando resumen…</div>;

  return (
    <section>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Hola, {user?.nombre}</p>
          <h1>Panel principal</h1>
        </div>
      </div>

      <div className="stats">
        <article>
          <span>Encuestas disponibles</span>
          <strong>{available}</strong>
        </article>
        <article>
          <span>Partidos finalizados</span>
          <strong>{finished}</strong>
        </article>
        <article>
          <span>{user?.rol === 'participante' ? 'Tus elecciones guardadas' : 'Participantes activos'}</span>
          <strong>{user?.rol === 'participante' ? mySelections.length : participation.length}</strong>
          {user?.rol === 'participante' && (
            <small className="muted">{myParticipation?.porcentaje || 0}% de participación</small>
          )}
        </article>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Hora de Lima</p>
            <h2>Próximos partidos</h2>
          </div>
        </div>

        {upcoming.length === 0 ? (
          <p className="muted">No hay partidos disponibles por el momento.</p>
        ) : (
          <div className="upcoming-list">
            {upcoming.map((match) => (
              <article className="upcoming-row" key={match.id}>
                <div>
                  <strong>{matchHeading(match)}</strong>
                  <span>{limaDateText(match)}</span>
                </div>
                <div className="mini-versus">
                  <span>{flagFor(match.local)} {match.local}</span>
                  <b>vs</b>
                  <span>{flagFor(match.visitante)} {match.visitante}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
