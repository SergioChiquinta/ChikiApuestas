const WINNER_PATTERN = /^Ganador del Partido\s+(\d+)$/i;
const LOSER_PATTERN = /^Perdedor del Partido\s+(\d+)$/i;

export const KNOCKOUT_PHASES = new Set([
  'Ronda de 32',
  'Octavos de final',
  'Cuartos de final',
  'Semifinal',
  'Tercer puesto',
  'Final'
]);

export function isKnockoutMatch(match) {
  return KNOCKOUT_PHASES.has(String(match.fase || '').trim());
}

export function isPlaceholderTeam(team) {
  const value = String(team || '').trim();
  return /^(Ganador|Perdedor|Segundo|Mejor tercero)\b/i.test(value);
}

function getResultTeams(match) {
  if (String(match.estado).toLowerCase() !== 'finalizado') return null;

  const homeGoals = Number(match.goles_local);
  const awayGoals = Number(match.goles_visitante);
  if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return null;

  if (homeGoals > awayGoals) {
    return { winner: match.local, loser: match.visitante };
  }
  if (awayGoals > homeGoals) {
    return { winner: match.visitante, loser: match.local };
  }

  if (match.ganador_desempate === 'local') {
    return { winner: match.local, loser: match.visitante };
  }
  if (match.ganador_desempate === 'visitante') {
    return { winner: match.visitante, loser: match.local };
  }

  return null;
}

function resolveOrigin(origin, byId) {
  const text = String(origin || '').trim();
  const winnerMatch = text.match(WINNER_PATTERN);
  const loserMatch = text.match(LOSER_PATTERN);
  const referenceId = winnerMatch?.[1] || loserMatch?.[1];

  if (!referenceId) return null;

  const source = byId.get(String(referenceId));
  const result = source ? getResultTeams(source) : null;
  if (!result) return text;
  return winnerMatch ? result.winner : result.loser;
}

export function recomputeBracketParticipants(matches) {
  const sorted = [...matches].sort((a, b) => Number(a.id) - Number(b.id));
  const byId = new Map(sorted.map((match) => [String(match.id), match]));

  for (const match of sorted) {
    match.origen_local = String(match.origen_local || match.local || '').trim();
    match.origen_visitante = String(match.origen_visitante || match.visitante || '').trim();

    const resolvedHome = resolveOrigin(match.origen_local, byId);
    const resolvedAway = resolveOrigin(match.origen_visitante, byId);

    if (resolvedHome) match.local = resolvedHome;
    if (resolvedAway) match.visitante = resolvedAway;
  }

  return matches;
}
