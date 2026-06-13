export function matchHeading(match) {
  if (match.grupo) return `N.º ${match.id} · Grupo ${match.grupo}`;
  return `N.º ${match.id} · ${match.fase}`;
}

export function limaDateText(match) {
  const date = match.fecha_lima || match.fecha || 'Fecha por confirmar';
  const time = match.hora_lima || match.hora_local || '--:--';
  return `${date} · ${time} (hora de Lima)`;
}

export function matchStatusText(match) {
  if (match.estado === 'finalizado') return 'Finalizado';
  if (match.bloqueado || match.estado === 'cerrado') return 'Cerrado';
  return 'Disponible';
}

export function isKnockout(match) {
  return ['Ronda de 32', 'Octavos de final', 'Cuartos de final', 'Semifinal', 'Tercer puesto', 'Final']
    .includes(match.fase);
}
