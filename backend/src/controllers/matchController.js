import { readSheet } from '../services/excelStore.js';

export async function listMatches(req, res) {
  const matches = await readSheet('Partidos');
  res.json(matches.sort((a, b) => Number(a.id) - Number(b.id)));
}

export async function ranking(_req, res) {
  const users = await readSheet('Usuarios');
  res.json(users
    .filter((u) => u.rol === 'participante' && String(u.activo).toLowerCase() !== 'no')
    .map(({ password_hash, ...u }) => ({ ...u, puntos_totales: Number(u.puntos_iniciales || 0) + Number(u.puntos_ganados || 0) }))
    .sort((a, b) => b.puntos_totales - a.puntos_totales));
}
