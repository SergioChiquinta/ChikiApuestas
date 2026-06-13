import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import { flagFor } from '../utils/flags';
import { limaDateText, matchStatusText } from '../utils/matchFormat';

const STAGES = [
  {
    key: 'round32',
    title: 'Ronda de 32',
    shortTitle: 'Ronda de 32',
    column: 1,
    rowSpan: 2
  },
  {
    key: 'round16',
    title: 'Octavos de final',
    shortTitle: 'Octavos',
    column: 2,
    rowSpan: 4
  },
  {
    key: 'quarterfinals',
    title: 'Cuartos de final',
    shortTitle: 'Cuartos',
    column: 3,
    rowSpan: 8
  },
  {
    key: 'semifinals',
    title: 'Semifinales',
    shortTitle: 'Semifinales',
    column: 4,
    rowSpan: 16
  },
  {
    key: 'final',
    title: 'Final',
    shortTitle: 'Final',
    column: 5,
    rowSpan: 32
  }
];

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function stageForPhase(phase) {
  const normalized = normalize(phase);

  if (normalized.includes('ronda de 32') || normalized.includes('dieciseisavos')) {
    return 'round32';
  }

  if (normalized.includes('octavos') || normalized.includes('ronda de 16')) {
    return 'round16';
  }

  if (normalized.includes('cuartos')) return 'quarterfinals';
  if (normalized.includes('semifinal')) return 'semifinals';
  if (normalized === 'final' || normalized.endsWith(' final')) return 'final';
  if (normalized.includes('tercer puesto')) return 'thirdPlace';

  return '';
}

function winnerSide(match) {
  if (normalize(match?.estado) !== 'finalizado') return '';

  const homeGoals = Number(match.goles_local);
  const awayGoals = Number(match.goles_visitante);

  if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return '';
  if (homeGoals > awayGoals) return 'local';
  if (homeGoals < awayGoals) return 'visitante';

  const tieBreakerWinner = normalize(match.ganador_desempate);
  const homeTeam = normalize(match.local);
  const awayTeam = normalize(match.visitante);

  if (tieBreakerWinner === 'local' || tieBreakerWinner === homeTeam) return 'local';
  if (tieBreakerWinner === 'visitante' || tieBreakerWinner === awayTeam) return 'visitante';

  return '';
}

function tieBreakerText(match) {
  const tieBreakerWinner = normalize(match?.ganador_desempate);

  if (!tieBreakerWinner) return '';
  if (tieBreakerWinner === 'local') return match.local;
  if (tieBreakerWinner === 'visitante') return match.visitante;

  return match.ganador_desempate;
}

function BracketTeam({ match, side, winner }) {
  const team = side === 'local' ? match.local : match.visitante;
  const score = side === 'local' ? match.goles_local : match.goles_visitante;
  const finished = normalize(match.estado) === 'finalizado';

  return (
    <div className={`bracket-team ${winner === side ? 'is-winner' : ''}`}>
      <span className="bracket-team-flag">{flagFor(team)}</span>
      <span className="bracket-team-name" title={team}>{team}</span>
      <strong className="bracket-score">{finished ? score : '—'}</strong>
    </div>
  );
}

function BracketMatch({ match, stage, index }) {
  const winner = winnerSide(match);
  const tieBreakerWinner = tieBreakerText(match);
  const rowStart = 1 + (index * stage.rowSpan);

  return (
    <article
      className={`bracket-match stage-${stage.key} ${normalize(match.estado)}`}
      style={{
        gridColumn: stage.column,
        gridRow: `${rowStart} / span ${stage.rowSpan}`
      }}
    >
      <div className="bracket-match-meta">
        <span>Partido N.º {match.id}</span>
        <span className={`status ${match.estado} ${match.bloqueado ? 'locked' : ''}`}>
          {matchStatusText(match)}
        </span>
      </div>

      <BracketTeam match={match} side="local" winner={winner} />
      <BracketTeam match={match} side="visitante" winner={winner} />

      <p className="bracket-date">{limaDateText(match)}</p>

      {tieBreakerWinner && Number(match.goles_local) === Number(match.goles_visitante) && (
        <p className="bracket-tiebreak">Clasificó en desempate: {tieBreakerWinner}</p>
      )}
    </article>
  );
}

export default function BracketPage() {
  const { showToast } = useToast();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  const fetchMatches = useCallback(async () => {
    const { data } = await api.get('/matches');
    setMatches(data);
    setUpdatedAt(new Date());
  }, []);

  useEffect(() => {
    let active = true;

    fetchMatches()
      .catch((error) => {
        if (active) {
          showToast(getErrorMessage(error, 'No se pudieron cargar las llaves.'), 'error');
        }
      })
      .finally(() => active && setLoading(false));

    const refreshSilently = () => {
      fetchMatches().catch(() => undefined);
    };

    const intervalId = window.setInterval(refreshSilently, 30000);
    window.addEventListener('focus', refreshSilently);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshSilently);
    };
  }, [fetchMatches, showToast]);

  const matchesByStage = useMemo(() => {
    const grouped = Object.fromEntries(STAGES.map((stage) => [stage.key, []]));
    grouped.thirdPlace = [];

    matches
      .slice()
      .sort((a, b) => Number(a.id) - Number(b.id))
      .forEach((match) => {
        const stageKey = stageForPhase(match.fase);
        if (stageKey && grouped[stageKey]) grouped[stageKey].push(match);
      });

    return grouped;
  }, [matches]);

  const refresh = async () => {
    setRefreshing(true);

    try {
      await fetchMatches();
      showToast('Llaves actualizadas.', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'No se pudieron actualizar las llaves.'), 'error');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section>
      <div className="page-heading split-heading bracket-heading">
        <div>
          <p className="eyebrow">Clasificados y cruces eliminatorios</p>
          <h1>Llaves del torneo</h1>
          <p className="muted">
            Los equipos cambian automáticamente cuando el administrador registra los resultados.
            La vista también se actualiza al volver a la pestaña y cada 30 segundos.
          </p>
          {updatedAt && (
            <small className="muted">
              Última actualización: {updatedAt.toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </small>
          )}
        </div>

        <button type="button" className="secondary-button refresh-bracket" onClick={refresh} disabled={refreshing}>
          {refreshing ? 'Actualizando…' : 'Actualizar llaves'}
        </button>
      </div>

      {loading ? (
        <div className="panel">Cargando llaves…</div>
      ) : (
        <>
          <div className="bracket-scroll" aria-label="Llaves eliminatorias">
            <div className="bracket-stage-labels">
              {STAGES.map((stage) => (
                <div key={stage.key}>
                  <span>{stage.shortTitle}</span>
                  <small>{matchesByStage[stage.key].length} partidos</small>
                </div>
              ))}
            </div>

            <div className="bracket-board">
              {STAGES.flatMap((stage) => (
                matchesByStage[stage.key].map((match, index) => (
                  <BracketMatch
                    key={match.id}
                    match={match}
                    stage={stage}
                    index={index}
                  />
                ))
              ))}
            </div>
          </div>

          {matchesByStage.thirdPlace.length > 0 && (
            <div className="panel third-place-panel">
              <div>
                <p className="eyebrow">Partido adicional</p>
                <h2>Tercer puesto</h2>
              </div>

              <div className="third-place-list">
                {matchesByStage.thirdPlace.map((match) => {
                  const winner = winnerSide(match);

                  return (
                    <article className="third-place-card" key={match.id}>
                      <div className="bracket-match-meta">
                        <span>Partido N.º {match.id}</span>
                        <span className={`status ${match.estado}`}>{matchStatusText(match)}</span>
                      </div>
                      <BracketTeam match={match} side="local" winner={winner} />
                      <BracketTeam match={match} side="visitante" winner={winner} />
                      <p className="bracket-date">{limaDateText(match)}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
