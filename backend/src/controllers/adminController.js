import crypto from 'crypto';
import { mutateWorkbook, readSheet } from '../services/excelStore.js';
import { hashPassword } from '../services/passwordService.js';
import { enrichMatch } from '../services/matchTimeService.js';
import {
  isKnockoutMatch,
  recomputeBracketParticipants
} from '../services/bracketService.js';

const VALID_ROLES = new Set(['admin', 'participante']);
const VALID_STATES = new Set(['pendiente', 'cerrado', 'finalizado']);

function safeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

export async function listUsers(_req, res) {
  const users = await readSheet('Usuarios');
  res.json(users.map(safeUser));
}

export async function createUser(req, res) {
  const username = String(req.body.username || '').trim();
  const nombre = String(req.body.nombre || '').trim();
  const password = String(req.body.password || '');
  const rol = String(req.body.rol || 'participante');

  if (!username || !nombre || !password) {
    return res.status(400).json({ message: 'Faltan datos obligatorios.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
  }
  if (!VALID_ROLES.has(rol)) {
    return res.status(400).json({ message: 'Rol inválido.' });
  }

  const created = await mutateWorkbook(({ get, set }) => {
    const users = get('Usuarios');
    if (users.some((user) => String(user.username).toLowerCase() === username.toLowerCase())) {
      throw Object.assign(new Error('El usuario ya existe.'), { status: 409 });
    }

    const row = {
      id: crypto.randomUUID(),
      username,
      nombre,
      password_hash: hashPassword(password),
      rol,
      foto_perfil: '',
      activo: 'si',
      creado_en: new Date().toISOString()
    };

    users.push(row);
    set('Usuarios', users);
    return safeUser(row);
  });

  res.status(201).json(created);
}

export async function updateUser(req, res) {
  const id = String(req.params.id);
  const updated = await mutateWorkbook(({ get, set }) => {
    const users = get('Usuarios');
    const index = users.findIndex((user) => String(user.id) === id);
    if (index < 0) {
      throw Object.assign(new Error('Usuario no encontrado.'), { status: 404 });
    }

    const current = users[index];
    const nextRole = req.body.rol ?? current.rol;
    if (!VALID_ROLES.has(String(nextRole))) {
      throw Object.assign(new Error('Rol inválido.'), { status: 400 });
    }

    users[index] = {
      ...current,
      nombre: req.body.nombre === undefined ? current.nombre : String(req.body.nombre).trim(),
      rol: nextRole,
      activo: req.body.activo ?? current.activo,
      password_hash: req.body.password
        ? hashPassword(String(req.body.password))
        : current.password_hash
    };

    set('Usuarios', users);
    return safeUser(users[index]);
  });

  res.json(updated);
}

export async function updateMatch(req, res) {
  const id = String(req.params.id);

  const result = await mutateWorkbook(({ get, set }) => {
    const matches = get('Partidos');
    const index = matches.findIndex((match) => String(match.id) === id);
    if (index < 0) {
      throw Object.assign(new Error('Partido no encontrado.'), { status: 404 });
    }

    const current = matches[index];
    const state = String(req.body.estado ?? current.estado);
    const homeGoals = Number(req.body.goles_local ?? current.goles_local ?? 0);
    const awayGoals = Number(req.body.goles_visitante ?? current.goles_visitante ?? 0);
    const homeTeam = String(req.body.local ?? current.local ?? '').trim();
    const awayTeam = String(req.body.visitante ?? current.visitante ?? '').trim();
    const shootoutWinner = String(req.body.ganador_desempate || '').toLowerCase();

    if (!VALID_STATES.has(state)) {
      throw Object.assign(new Error('Estado inválido.'), { status: 400 });
    }
    if (!homeTeam || !awayTeam) {
      throw Object.assign(new Error('Los nombres de ambos equipos son obligatorios.'), { status: 400 });
    }
    if (
      !Number.isInteger(homeGoals)
      || !Number.isInteger(awayGoals)
      || homeGoals < 0
      || awayGoals < 0
      || homeGoals > 30
      || awayGoals > 30
    ) {
      throw Object.assign(new Error('Marcador inválido.'), { status: 400 });
    }

    if (
      state === 'finalizado'
      && isKnockoutMatch(current)
      && homeGoals === awayGoals
      && !['local', 'visitante'].includes(shootoutWinner)
    ) {
      throw Object.assign(
        new Error('En un empate eliminatorio debes indicar quién clasificó.'),
        { status: 400 }
      );
    }

    matches[index] = {
      ...current,
      local: homeTeam,
      visitante: awayTeam,
      goles_local: homeGoals,
      goles_visitante: awayGoals,
      estado: state,
      ganador_desempate:
        state === 'finalizado' && homeGoals === awayGoals ? shootoutWinner : '',
      origen_local: current.origen_local || current.local,
      origen_visitante: current.origen_visitante || current.visitante
    };

    recomputeBracketParticipants(matches);
    set('Partidos', matches);

    const auditRows = get('Auditoria');
    auditRows.push({
      id: crypto.randomUUID(),
      usuario_id: req.user.id,
      accion: 'ACTUALIZAR_PARTIDO',
      entidad: 'Partidos',
      entidad_id: id,
      fecha: new Date().toISOString()
    });
    set('Auditoria', auditRows);

    return matches[index];
  });

  res.json(enrichMatch(result));
}
