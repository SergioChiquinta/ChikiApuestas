import { readSheet } from '../services/excelStore.js';
import { enrichMatches } from '../services/matchTimeService.js';

export async function listMatches(_req, res) {
  const matches = await readSheet('Partidos');
  res.json(enrichMatches(matches));
}

export async function participation(_req, res) {
  const [users, matches, rows] = await Promise.all([
    readSheet('Usuarios'),
    readSheet('Partidos'),
    readSheet('Pronosticos')
  ]);

  const totalPolls = matches.length;
  const counts = new Map();

  for (const row of rows) {
    if (!row.usuario_id || !row.partido_id) continue;
    const key = String(row.usuario_id);
    const unique = counts.get(key) || new Set();
    unique.add(String(row.partido_id));
    counts.set(key, unique);
  }

  const participants = users
    .filter((user) => user.rol === 'participante' && String(user.activo).toLowerCase() !== 'no')
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'))
    .map((user) => {
      const completed = counts.get(String(user.id))?.size || 0;
      return {
        id: user.id,
        nombre: user.nombre,
        foto_perfil: user.foto_perfil || '',
        completadas: completed,
        pendientes: Math.max(totalPolls - completed, 0),
        total: totalPolls,
        porcentaje: totalPolls ? Math.round((completed / totalPolls) * 100) : 0
      };
    });

  res.json(participants);
}
