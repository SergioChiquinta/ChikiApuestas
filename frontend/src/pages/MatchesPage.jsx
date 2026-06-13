import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import { flagFor } from '../utils/flags';
import { limaDateText, matchHeading, matchStatusText } from '../utils/matchFormat';

export default function MatchesPage() {
  const { showToast } = useToast();
  const [matches, setMatches] = useState([]);
  const [phase, setPhase] = useState('Todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get('/matches')
      .then(({ data }) => active && setMatches(data))
      .catch((error) => showToast(getErrorMessage(error, 'No se pudo cargar el calendario.'), 'error'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [showToast]);

  const phases = useMemo(
    () => ['Todas', ...new Set(matches.map((match) => match.fase))],
    [matches]
  );
  const visible = phase === 'Todas' ? matches : matches.filter((match) => match.fase === phase);

  return (
    <section>
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">Calendario oficial cargado en el Excel</p>
          <h1>Partidos</h1>
        </div>
        <label className="compact-control">
          Fase
          <select value={phase} onChange={(event) => setPhase(event.target.value)}>
            {phases.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="panel">Cargando calendario…</div>
      ) : (
        <div className="match-grid">
          {visible.map((match) => (
            <article className="match-card calendar-card" key={match.id}>
              <div className="match-meta">
                <span>{matchHeading(match)}</span>
                <span className={`status ${match.estado} ${match.bloqueado ? 'locked' : ''}`}>
                  {matchStatusText(match)}
                </span>
              </div>

              <p className="match-date">{limaDateText(match)}</p>

              <div className="teams-display">
                <div className="team-display">
                  <span className="flag-large">{flagFor(match.local)}</span>
                  <strong>{match.local}</strong>
                </div>
                <div className="score-display">
                  {match.estado === 'finalizado'
                    ? <strong>{match.goles_local} – {match.goles_visitante}</strong>
                    : <strong>VS</strong>}
                </div>
                <div className="team-display">
                  <span className="flag-large">{flagFor(match.visitante)}</span>
                  <strong>{match.visitante}</strong>
                </div>
              </div>

              <p className="venue-line">{match.estadio} · {match.ciudad}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
