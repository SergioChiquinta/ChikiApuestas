import crypto from 'crypto';
import { mutateWorkbook, readSheet } from '../services/excelStore.js';

export async function mine(req, res) {
  const predictions = await readSheet('Pronosticos');
  res.json(predictions.filter((p) => String(p.usuario_id) === String(req.user.id)));
}

export async function upsert(req, res) {
  const matchId = String(req.params.matchId);
  const home = Number(req.body.goles_local);
  const away = Number(req.body.goles_visitante);
  if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 20 || away > 20) {
    return res.status(400).json({ message: 'Marcador inválido' });
  }

  const saved = await mutateWorkbook(({ get, set }) => {
    const matches = get('Partidos');
    const match = matches.find((m) => String(m.id) === matchId);
    if (!match) throw Object.assign(new Error('Partido no encontrado'), { status: 404 });
    if (match.estado !== 'pendiente') throw Object.assign(new Error('El pronóstico ya está cerrado'), { status: 409 });

    const predictions = get('Pronosticos');
    const now = new Date().toISOString();
    const index = predictions.findIndex((p) => String(p.usuario_id) === String(req.user.id) && String(p.partido_id) === matchId);
    const row = {
      id: index >= 0 ? predictions[index].id : crypto.randomUUID(),
      usuario_id: req.user.id,
      partido_id: matchId,
      goles_local: home,
      goles_visitante: away,
      puntos_obtenidos: index >= 0 ? predictions[index].puntos_obtenidos || 0 : 0,
      creado_en: index >= 0 ? predictions[index].creado_en : now,
      actualizado_en: now
    };
    if (index >= 0) predictions[index] = row; else predictions.push(row);
    set('Pronosticos', predictions);
    return row;
  });
  res.json(saved);
}
