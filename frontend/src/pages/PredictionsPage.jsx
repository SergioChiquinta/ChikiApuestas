import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api, assetUrl } from '../api/client';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import {
  flagFor,
  selectionFlag,
  selectionTeam,
  selectionText
} from '../utils/flags';
import {
  limaDateText,
  matchHeading,
  matchStatusText
} from '../utils/matchFormat';

function unresolvedTeam(team) {
  return /^(Ganador|Perdedor|Segundo|Mejor tercero)\b/i.test(String(team || '').trim());
}

function groupFor(match) {
  return String(match?.grupo || '').trim().toUpperCase();
}

function ChoiceButton({ selected, disabled, onClick, flag, label, value }) {
  return (
    <button
      type="button"
      className={`choice-option ${selected === value ? 'selected' : ''}`}
      onClick={() => onClick(value)}
      disabled={disabled}
      aria-pressed={selected === value}
    >
      <span className="choice-flag">{flag}</span>
      <span>{label}</span>
    </button>
  );
}

export default function PredictionsPage() {
  const { showToast } = useToast();
  const [matches, setMatches] = useState([]);
  const [savedSelections, setSavedSelections] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [filter, setFilter] = useState('disponibles');
  const [groupFilter, setGroupFilter] = useState('todos');
  const [modalMatch, setModalMatch] = useState(null);
  const [community, setCommunity] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const communityRequestId = useRef(0);

  const load = useCallback(async () => {
    const [matchesResponse, selectionsResponse] = await Promise.all([
      api.get('/matches'),
      api.get('/predictions/me')
    ]);

    setMatches(matchesResponse.data);
    setSavedSelections(selectionsResponse.data);
    setDrafts(Object.fromEntries(
      selectionsResponse.data.map((item) => [String(item.partido_id), item.seleccion])
    ));
  }, []);

  useEffect(() => {
    let active = true;

    load()
      .catch((error) => {
        if (active) {
          showToast(getErrorMessage(error, 'No se pudieron cargar las encuestas.'), 'error');
        }
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
      communityRequestId.current += 1;
    };
  }, [load, showToast]);

  const savedByMatch = useMemo(
    () => Object.fromEntries(savedSelections.map((item) => [String(item.partido_id), item])),
    [savedSelections]
  );

  const groups = useMemo(() => (
    [...new Set(matches.map(groupFor).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es'))
  ), [matches]);

  const visibleMatches = useMemo(() => {
    let filteredMatches;

    if (filter === 'todas') {
      filteredMatches = matches;
    } else if (filter === 'guardadas') {
      filteredMatches = matches.filter((match) => Boolean(savedByMatch[String(match.id)]));
    } else {
      filteredMatches = matches.filter((match) => (
        match.estado === 'pendiente'
        && !match.bloqueado
        && !unresolvedTeam(match.local)
        && !unresolvedTeam(match.visitante)
      ));
    }

    if (groupFilter === 'todos') return filteredMatches;

    return filteredMatches.filter((match) => groupFor(match) === groupFilter);
  }, [filter, groupFilter, matches, savedByMatch]);

  const choose = (matchId, selection) => {
    setDrafts((current) => ({ ...current, [String(matchId)]: selection }));
  };

  const save = async (match) => {
    const selection = drafts[String(match.id)];

    if (!selection) {
      showToast('Selecciona una opción antes de guardar.', 'info');
      return;
    }

    setSavingId(match.id);

    try {
      const { data } = await api.put(`/predictions/${match.id}`, {
        seleccion: selection
      });

      setSavedSelections((current) => [
        ...current.filter((item) => String(item.partido_id) !== String(match.id)),
        data
      ]);

      showToast(`Elección guardada para el partido N.º ${match.id}.`, 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'No se pudo guardar la elección.'), 'error');
      await load().catch(() => undefined);
    } finally {
      setSavingId(null);
    }
  };

  const closeCommunity = useCallback(() => {
    communityRequestId.current += 1;
    setModalMatch(null);
    setCommunity([]);
    setCommunityLoading(false);
  }, []);

  const openCommunity = async (match) => {
    const requestId = communityRequestId.current + 1;
    communityRequestId.current = requestId;

    setModalMatch(match);
    setCommunity([]);
    setCommunityLoading(true);

    try {
      const { data } = await api.get(`/predictions/${match.id}/community`);

      if (communityRequestId.current === requestId) {
        setCommunity(data);
      }
    } catch (error) {
      if (communityRequestId.current === requestId) {
        showToast(
          getErrorMessage(error, 'No se pudieron cargar las elecciones familiares.'),
          'error'
        );
        closeCommunity();
      }
    } finally {
      if (communityRequestId.current === requestId) {
        setCommunityLoading(false);
      }
    }
  };

  return (
    <section>
      <div className="page-heading split-heading predictions-heading">
        <div>
          <p className="eyebrow">Pronósticos familiares por resultado</p>
          <h1>Mis elecciones</h1>
          <p className="muted">
            Elige quién gana o marca empate. Cada acierto suma 1 punto y la elección se cierra al comenzar el partido.
          </p>
        </div>

        <div className="prediction-filters">
          <label className="compact-control">
            Mostrar
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="disponibles">Disponibles</option>
              <option value="guardadas">Con elección guardada</option>
              <option value="todas">Todas</option>
            </select>
          </label>

          <label className="compact-control">
            Grupo
            <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
              <option value="todos">Todos los grupos</option>
              {groups.map((group) => (
                <option key={group} value={group}>Grupo {group}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="panel">Cargando encuestas…</div>
      ) : visibleMatches.length === 0 ? (
        <div className="panel empty-state">
          <strong>No hay partidos en este filtro.</strong>
          <span className="muted">Cambia el estado o el grupo para revisar otros partidos.</span>
        </div>
      ) : (
        <div className="match-grid poll-grid">
          {visibleMatches.map((match) => {
            const selected = drafts[String(match.id)] || '';
            const saved = savedByMatch[String(match.id)]?.seleccion || '';
            const unavailableTeams = unresolvedTeam(match.local) || unresolvedTeam(match.visitante);
            const locked = match.bloqueado || match.estado !== 'pendiente' || unavailableTeams;

            return (
              <article className={`match-card poll-card ${locked ? 'is-locked' : ''}`} key={match.id}>
                <div className="match-meta">
                  <span>{matchHeading(match)}</span>
                  <span className={`status ${match.estado} ${match.bloqueado ? 'locked' : ''}`}>
                    {matchStatusText(match)}
                  </span>
                </div>

                <p className="match-date">{limaDateText(match)}</p>

                <div className="poll-teams">
                  <div>
                    <span className="flag-large">{flagFor(match.local)}</span>
                    <strong>{match.local}</strong>
                  </div>

                  <span className="versus-badge">VS</span>

                  <div>
                    <span className="flag-large">{flagFor(match.visitante)}</span>
                    <strong>{match.visitante}</strong>
                  </div>
                </div>

                <div className="choice-grid" aria-label={`Elección del partido ${match.id}`}>
                  <ChoiceButton
                    selected={selected}
                    disabled={locked}
                    onClick={(value) => choose(match.id, value)}
                    flag={flagFor(match.local)}
                    label={match.local}
                    value="local"
                  />

                  <ChoiceButton
                    selected={selected}
                    disabled={locked}
                    onClick={(value) => choose(match.id, value)}
                    flag="🤝"
                    label="Empate"
                    value="empate"
                  />

                  <ChoiceButton
                    selected={selected}
                    disabled={locked}
                    onClick={(value) => choose(match.id, value)}
                    flag={flagFor(match.visitante)}
                    label={match.visitante}
                    value="visitante"
                  />
                </div>

                {saved && (
                  <p className="saved-choice">
                    Guardado: {selectionFlag(saved, match)} {selectionText(saved, match)}
                  </p>
                )}

                {unavailableTeams && (
                  <p className="lock-message">Los equipos todavía no están confirmados.</p>
                )}

                {!unavailableTeams && locked && (
                  <p className="lock-message">La encuesta ya está cerrada para este partido.</p>
                )}

                <div className="card-actions">
                  <button
                    type="button"
                    onClick={() => save(match)}
                    disabled={locked || savingId === match.id}
                  >
                    {savingId === match.id
                      ? 'Guardando…'
                      : saved
                        ? 'Guardar cambios'
                        : 'Guardar elección'}
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => openCommunity(match)}
                  >
                    Ver elecciones familiares
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(modalMatch)}
        title={modalMatch ? `Elecciones · ${modalMatch.local} vs ${modalMatch.visitante}` : ''}
        onClose={closeCommunity}
      >
        {communityLoading ? (
          <p>Cargando elecciones…</p>
        ) : community.length === 0 ? (
          <p className="muted">No hay participantes activos.</p>
        ) : (
          <div className="community-list">
            {community.map((participant) => {
              const photo = assetUrl(participant.foto_perfil);
              const selectedTeam = participant.seleccion
                ? selectionTeam(participant.seleccion, modalMatch)
                : '';

              return (
                <article className="community-row" key={participant.id}>
                  <div className="profile-avatar community-avatar">
                    {photo
                      ? <img src={photo} alt={`Foto de ${participant.nombre}`} />
                      : <span>{participant.nombre?.charAt(0)?.toUpperCase() || '?'}</span>}
                  </div>

                  <strong>{participant.nombre}</strong>

                  <span className={participant.seleccion ? 'community-selection' : 'community-empty'}>
                    {participant.seleccion ? (
                      <>
                        {selectedTeam ? flagFor(selectedTeam) : '🤝'}
                        {' '}
                        {selectionText(participant.seleccion, modalMatch)}
                      </>
                    ) : '-- --'}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </Modal>
    </section>
  );
}
