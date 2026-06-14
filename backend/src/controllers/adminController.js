import crypto from 'crypto';
import { withTransaction } from '../config/database.js';
import {
  createUser as insertUser,
  findUserById,
  listUsers as findUsers,
  updateUser as saveUser
} from '../repositories/userRepository.js';
import { listMatches, saveMatch } from '../repositories/matchRepository.js';
import { createAudit } from '../repositories/auditRepository.js';
import { hashPassword } from '../services/passwordService.js';
import { enrichMatch } from '../services/matchTimeService.js';
import {
  isKnockoutMatch,
  recomputeBracketParticipants
} from '../services/bracketService.js';

const VALID_ROLES = new Set(['admin', 'participante']);
const VALID_STATES = new Set(['pendiente', 'cerrado', 'finalizado']);

function safeUser(user) {
  const { password_hash, foto_perfil_public_id, ...safe } = user;
  return {
    ...safe,
    activo: user.activo ? 'si' : 'no'
  };
}

function parseActive(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return !['no', 'false', '0', 'inactivo'].includes(
    String(value).trim().toLowerCase()
  );
}

export async function listUsers(_req, res) {
  const users = await findUsers();
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
    return res.status(400).json({
      message: 'La contraseña debe tener al menos 8 caracteres.'
    });
  }
  if (!VALID_ROLES.has(rol)) {
    return res.status(400).json({ message: 'Rol inválido.' });
  }

  try {
    const created = await insertUser({
      id: crypto.randomUUID(),
      username,
      nombre,
      passwordHash: hashPassword(password),
      rol,
      activo: true
    });
    res.status(201).json(safeUser(created));
  } catch (error) {
    if (error.code === '23505') {
      throw Object.assign(new Error('El usuario ya existe.'), { status: 409 });
    }
    throw error;
  }
}

export async function updateUser(req, res) {
  const id = String(req.params.id);
  const current = await findUserById(id);
  if (!current) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  const nombre = req.body.nombre === undefined
    ? current.nombre
    : String(req.body.nombre).trim();
  const rol = String(req.body.rol ?? current.rol);
  const password = req.body.password ? String(req.body.password) : '';

  if (!nombre) {
    return res.status(400).json({ message: 'El nombre es obligatorio.' });
  }
  if (!VALID_ROLES.has(rol)) {
    return res.status(400).json({ message: 'Rol inválido.' });
  }
  if (password && password.length < 8) {
    return res.status(400).json({
      message: 'La contraseña debe tener al menos 8 caracteres.'
    });
  }

  const updated = await saveUser(id, {
    nombre,
    rol,
    activo: parseActive(req.body.activo, current.activo),
    passwordHash: password ? hashPassword(password) : current.password_hash
  });

  res.json(safeUser(updated));
}

export async function updateMatch(req, res) {
  const id = String(req.params.id);

  const result = await withTransaction(async (client) => {
    const matches = await listMatches(client);
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
      throw Object.assign(
        new Error('Los nombres de ambos equipos son obligatorios.'),
        { status: 400 }
      );
    }
    if (
      !Number.isInteger(homeGoals) ||
      !Number.isInteger(awayGoals) ||
      homeGoals < 0 ||
      awayGoals < 0 ||
      homeGoals > 30 ||
      awayGoals > 30
    ) {
      throw Object.assign(new Error('Marcador inválido.'), { status: 400 });
    }
    if (
      state === 'finalizado' &&
      isKnockoutMatch(current) &&
      homeGoals === awayGoals &&
      !['local', 'visitante'].includes(shootoutWinner)
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

    let updatedTarget = null;
    for (const match of matches) {
      const saved = await saveMatch(match, client);
      if (String(saved.id) === id) updatedTarget = saved;
    }

    await createAudit(
      {
        userId: req.user.id,
        action: 'ACTUALIZAR_PARTIDO',
        entity: 'Partidos',
        entityId: id
      },
      client
    );

    return updatedTarget;
  });

  res.json(enrichMatch(result));
}
