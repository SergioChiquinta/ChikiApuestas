import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import { flagFor } from '../utils/flags';
import { isKnockout, limaDateText, matchHeading } from '../utils/matchFormat';

export default function AdminMatchesPage() {
  const { showToast } = useToast();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [phase, setPhase] = useState('Todas');
  const [status, setStatus] = useState('Todos');

  const load = useCallback(async () => {
    const { data } = await api.get('/matches');
    setMatches(data);
  }, []);

  useEffect(() => {
    let active = true;
    load()
      .catch((error) => active && showToast(getErrorMessage(error, 'No se pudieron cargar los partidos.'), 'error'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [load, showToast]);

  const phases = useMemo(
    () => ['Todas', ...new Set(matches.map((match) => match.fase))],
    [matches]
  );

  const visible = useMemo(() => matches.filter((match) => (
    (phase === 'Todas' || match.fase === phase)
    && (status === 'Todos' || match.estado === status)
  )), [matches, phase, status]);

  const save = async (match, event) => {
    event.preventDefault();
    setSavingId(match.id);

    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        local: formData.get('local'),
        visitante: formData.get('visitante'),
        goles_local: Number(formData.get('home')),
        goles_visitante: Number(formData.get('away')),
        estado: formData.get('estado'),
        ganador_desempate: formData.get('ganador_desempate') || ''
      };

      await api.put(`/admin/matches/${match.id}`, payload);
      showToast(`Partido N.º ${match.id} actualizado.`, 'success');
      await load();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section>
      <div className="page-heading split-heading admin-heading">
        <div>
          <p className="eyebrow">Resultados y llaves eliminatorias</p>
          <h1>Administrar partidos</h1>
          <p className="muted">Al finalizar un partido eliminatorio, el clasificado avanza automáticamente a la siguiente fase.</p>
        </div>
        <div className="filter-row">
          <label className="compact-control">
            Fase
            <select value={phase} onChange={(event) => setPhase(event.target.value)}>
              {phases.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="compact-control">
            Estado
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="cerrado">Cerrado</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="panel">Cargando partidos…</div>
      ) : (
        <div className="match-grid admin-match-grid">
          {visible.map((match) => (
            <form
              className="match-card admin-match-card"
              key={`${match.id}-${match.local}-${match.visitante}-${match.goles_local}-${match.goles_visitante}-${match.estado}-${match.ganador_desempate || ''}`}
              onSubmit={(event) => save(match, event)}
            >
              <div className="match-meta">
                <span>{matchHeading(match)}</span>
                <span className={`status ${match.estado}`}>{match.estado}</span>
              </div>
              <p className="match-date">{limaDateText(match)}</p>

              <div className="admin-team-field">
                <span className="choice-flag">{flagFor(match.local)}</span>
                <input name="local" defaultValue={match.local} aria-label="Equipo local" required />
              </div>
              <div className="admin-team-field">
                <span className="choice-flag">{flagFor(match.visitante)}</span>
                <input name="visitante" defaultValue={match.visitante} aria-label="Equipo visitante" required />
              </div>

              <div className="score-inputs">
                <input name="home" type="number" min="0" max="30" defaultValue={match.goles_local} required />
                <span>–</span>
                <input name="away" type="number" min="0" max="30" defaultValue={match.goles_visitante} required />
              </div>

              <label className="field-label">
                Estado
                <select name="estado" defaultValue={match.estado}>
                  <option value="pendiente">Pendiente</option>
                  <option value="cerrado">Cerrado</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </label>

              {isKnockout(match) && (
                <label className="field-label">
                  Clasificado si termina empatado
                  <select name="ganador_desempate" defaultValue={match.ganador_desempate || ''}>
                    <option value="">No aplica / por definir</option>
                    <option value="local">{match.local}</option>
                    <option value="visitante">{match.visitante}</option>
                  </select>
                </label>
              )}

              <button disabled={savingId === match.id}>
                {savingId === match.id ? 'Actualizando…' : 'Guardar resultado'}
              </button>
            </form>
          ))}
        </div>
      )}
    </section>
  );
}
