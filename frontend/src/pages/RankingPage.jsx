import { useEffect, useMemo, useState } from 'react';
import { api, assetUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import '../styles/ranking.css';

const EMPTY_DATA = {
  resumen: {
    participantes: 0,
    partidos_finalizados: 0,
    puntos_maximos: 0,
    lider: null
  },
  ranking: []
};

function Avatar({ participant, large = false }) {
  const photo = assetUrl(participant?.foto_perfil);
  const initial = participant?.nombre?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className={`profile-avatar ranking-avatar${large ? ' ranking-avatar-large' : ''}`}>
      {photo
        ? <img src={photo} alt={`Foto de ${participant.nombre}`} />
        : <span>{initial}</span>}
    </div>
  );
}

export default function RankingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api.get('/matches/ranking')
      .then(({ data: response }) => {
        if (!active) return;

        setData({
          resumen: response?.resumen || EMPTY_DATA.resumen,
          ranking: Array.isArray(response?.ranking) ? response.ranking : []
        });
      })
      .catch((error) => {
        showToast(
          getErrorMessage(error, 'No se pudo cargar el ranking.'),
          'error'
        );
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [showToast]);

  const podium = useMemo(() => {
    const [first, second, third] = data.ranking;

    return [
      { participant: second, slot: 'second', label: '2.º' },
      { participant: first, slot: 'first', label: '1.º' },
      { participant: third, slot: 'third', label: '3.º' }
    ].filter((item) => item.participant);
  }, [data.ranking]);

  const currentUserId = String(user?.id || '');
  const leaderPoints = data.resumen.lider?.puntos || 0;

  return (
    <section className="ranking-page">
      <div className="page-heading ranking-heading">
        <p className="eyebrow">1 acierto = 1 punto</p>
        <h1>Ranking de aciertos</h1>
        <p className="muted">
          Las posiciones se actualizan automáticamente con los partidos finalizados.
          Se cuenta si la elección fue local, empate o visitante.
        </p>
      </div>

      <div className="stats ranking-summary">
        <article>
          <span>Participantes</span>
          <strong>{data.resumen.participantes}</strong>
        </article>
        <article>
          <span>Partidos evaluados</span>
          <strong>{data.resumen.partidos_finalizados}</strong>
        </article>
        <article>
          <span>Puntaje líder</span>
          <strong>{leaderPoints} pts</strong>
        </article>
      </div>

      {loading ? (
        <div className="panel ranking-state">
          <span className="ranking-loader" aria-hidden="true" />
          <p>Cargando posiciones…</p>
        </div>
      ) : data.ranking.length === 0 ? (
        <div className="panel ranking-state">
          <strong>Todavía no hay participantes activos.</strong>
        </div>
      ) : (
        <>
          <div className="ranking-podium" aria-label="Primeras posiciones">
            {podium.map(({ participant, slot, label }) => (
              <article
                className={`podium-card podium-${slot}`}
                key={participant.id}
              >
                <span className="podium-position">{label}</span>
                <Avatar participant={participant} large />
                <strong>{participant.nombre}</strong>
                <span className="podium-points">{participant.puntos} pts</span>
                <small>{participant.porcentaje_aciertos}% de aciertos</small>
              </article>
            ))}
          </div>

          {data.resumen.partidos_finalizados === 0 && (
            <div className="panel ranking-notice">
              El ranking comenzará a sumar puntos cuando el administrador marque
              el primer partido como finalizado.
            </div>
          )}

          <div className="panel ranking-table-panel">
            <div className="ranking-table-heading">
              <div>
                <h2>Tabla general</h2>
                <p className="muted">Todos los participantes, de mayor a menor puntaje.</p>
              </div>
              <span className="ranking-rule">Máximo actual: {data.resumen.puntos_maximos} pts</span>
            </div>

            <div className="ranking-table-wrap">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>Pos.</th>
                    <th>Participante</th>
                    <th>Aciertos</th>
                    <th>Fallos</th>
                    <th>Evaluados</th>
                    <th>Efectividad</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ranking.map((participant) => {
                    const isCurrentUser = String(participant.id) === currentUserId;

                    return (
                      <tr
                        className={isCurrentUser ? 'ranking-current-user' : ''}
                        key={participant.id}
                      >
                        <td data-label="Posición">
                          <span className={`ranking-position ranking-position-${participant.posicion}`}>
                            {participant.posicion}
                          </span>
                        </td>
                        <td data-label="Participante">
                          <div className="ranking-person">
                            <Avatar participant={participant} />
                            <div>
                              <strong>{participant.nombre}</strong>
                              {isCurrentUser && <small>Tú</small>}
                            </div>
                          </div>
                        </td>
                        <td data-label="Aciertos">
                          <strong className="ranking-score">{participant.aciertos} pts</strong>
                        </td>
                        <td data-label="Fallos">{participant.fallos}</td>
                        <td data-label="Evaluados">{participant.evaluados}</td>
                        <td data-label="Efectividad">
                          <div className="ranking-effectiveness">
                            <div className="ranking-progress" aria-hidden="true">
                              <span style={{ width: `${participant.porcentaje_aciertos}%` }} />
                            </div>
                            <strong>{participant.porcentaje_aciertos}%</strong>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
