import crypto from 'crypto';
import { mutateWorkbook, readSheet } from '../services/excelStore.js';
import { isMatchLocked } from '../services/matchTimeService.js';
import { isPlaceholderTeam } from '../services/bracketService.js';

const VALID_SELECTIONS = new Set(['local', 'empate', 'visitante']);

function normalizeSelection(row) {
  const current = String(row.seleccion || '').toLowerCase();
  if (VALID_SELECTIONS.has(current)) return current;

  const home = Number(row.goles_local);
  const away = Number(row.goles_visitante);
  if (Number.isFinite(home) && Number.isFinite(away)) {
    if (home > away) return 'local';
    if (away > home) return 'visitante';
    return 'empate';
  }

  return '';
}

function normalizeRow(row) {
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    partido_id: row.partido_id,
    seleccion: normalizeSelection(row),
    creado_en: row.creado_en || '',
    actualizado_en: row.actualizado_en || ''
  };
}

export async function mine(req, res) {
  const rows = await readSheet('Pronosticos');
  res.json(
    rows
      .filter((row) => String(row.usuario_id) === String(req.user.id))
      .map(normalizeRow)
  );
}

export async function community(req, res) {
  const matchId = String(req.params.matchId);
  const [matches, users, rows] = await Promise.all([
    readSheet('Partidos'),
    readSheet('Usuarios'),
    readSheet('Pronosticos')
  ]);

  if (!matches.some((match) => String(match.id) === matchId)) {
    return res.status(404).json({ message: 'Partido no encontrado.' });
  }

  const selections = new Map(
    rows
      .filter((row) => String(row.partido_id) === matchId)
      .map((row) => [String(row.usuario_id), normalizeSelection(row)])
  );

  const participants = users
    .filter((user) => user.rol === 'participante' && String(user.activo).toLowerCase() !== 'no')
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'))
    .map((user) => ({
      id: user.id,
      nombre: user.nombre,
      foto_perfil: user.foto_perfil || '',
      seleccion: selections.get(String(user.id)) || ''
    }));

  res.json(participants);
}

export async function upsert(req, res) {
  const matchId = String(req.params.matchId);
  const selection = String(req.body.seleccion || '').toLowerCase();

  if (!VALID_SELECTIONS.has(selection)) {
    return res.status(400).json({ message: 'Selecciona al equipo local, empate o al equipo visitante.' });
  }

  const saved = await mutateWorkbook(({ get, set }) => {
    const matches = get('Partidos');
    const match = matches.find((item) => String(item.id) === matchId);

    if (!match) {
      throw Object.assign(new Error('Partido no encontrado.'), { status: 404 });
    }
    if (isMatchLocked(match)) {
      throw Object.assign(
        new Error('La encuesta se cerró porque el partido ya comenzó o fue cerrado por el administrador.'),
        { status: 409 }
      );
    }
    if (isPlaceholderTeam(match.local) || isPlaceholderTeam(match.visitante)) {
      throw Object.assign(
        new Error('Los equipos de este partido todavía no están confirmados.'),
        { status: 409 }
      );
    }

    const rows = get('Pronosticos').map(normalizeRow);
    const now = new Date().toISOString();
    const index = rows.findIndex(
      (row) => String(row.usuario_id) === String(req.user.id)
        && String(row.partido_id) === matchId
    );

    const row = {
      id: index >= 0 ? rows[index].id : crypto.randomUUID(),
      usuario_id: req.user.id,
      partido_id: matchId,
      seleccion: selection,
      creado_en: index >= 0 ? rows[index].creado_en : now,
      actualizado_en: now
    };

    if (index >= 0) rows[index] = row;
    else rows.push(row);

    set('Pronosticos', rows);
    return row;
  });

  res.json(saved);
}
