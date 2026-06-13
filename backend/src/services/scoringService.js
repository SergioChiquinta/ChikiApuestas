export function predictionPoints(prediction, match) {
  const pHome = Number(prediction.goles_local);
  const pAway = Number(prediction.goles_visitante);
  const rHome = Number(match.goles_local);
  const rAway = Number(match.goles_visitante);

  if (pHome === rHome && pAway === rAway) return 3;
  const predictedOutcome = Math.sign(pHome - pAway);
  const realOutcome = Math.sign(rHome - rAway);
  return predictedOutcome === realOutcome ? 1 : 0;
}

export function recalculateUserTotals(users, predictions) {
  const totals = new Map();
  for (const p of predictions) {
    totals.set(String(p.usuario_id), (totals.get(String(p.usuario_id)) || 0) + Number(p.puntos_obtenidos || 0));
  }
  return users.map((u) => ({ ...u, puntos_ganados: totals.get(String(u.id)) || 0 }));
}
