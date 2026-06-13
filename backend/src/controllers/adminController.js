import crypto from 'crypto';
import { mutateWorkbook, readSheet } from '../services/excelStore.js';
import { hashPassword } from '../services/passwordService.js';
import { predictionPoints, recalculateUserTotals } from '../services/scoringService.js';

export async function listUsers(_req, res) {
  const users = await readSheet('Usuarios');
  res.json(users.map(({ password_hash, ...u }) => u));
}

export async function createUser(req, res) {
  const { username, nombre, password, rol = 'participante', puntos_iniciales = 0 } = req.body;
  if (!username || !nombre || !password) return res.status(400).json({ message: 'Faltan datos obligatorios' });
  const created = await mutateWorkbook(({ get, set }) => {
    const users = get('Usuarios');
    if (users.some((u) => String(u.username).toLowerCase() === String(username).toLowerCase())) {
      throw Object.assign(new Error('El usuario ya existe'), { status: 409 });
    }
    const row = {
      id: crypto.randomUUID(), username, nombre, password_hash: hashPassword(password), rol,
      puntos_iniciales: Number(puntos_iniciales || 0), puntos_ganados: 0,
      foto_perfil: '', activo: 'si', creado_en: new Date().toISOString()
    };
    users.push(row); set('Usuarios', users);
    const { password_hash, ...safe } = row; return safe;
  });
  res.status(201).json(created);
}

export async function updateUser(req, res) {
  const id = String(req.params.id);
  const updated = await mutateWorkbook(({ get, set }) => {
    const users = get('Usuarios');
    const index = users.findIndex((u) => String(u.id) === id);
    if (index < 0) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    const current = users[index];
    users[index] = {
      ...current,
      nombre: req.body.nombre ?? current.nombre,
      rol: req.body.rol ?? current.rol,
      activo: req.body.activo ?? current.activo,
      puntos_iniciales: req.body.puntos_iniciales === undefined ? current.puntos_iniciales : Number(req.body.puntos_iniciales),
      password_hash: req.body.password ? hashPassword(req.body.password) : current.password_hash
    };
    set('Usuarios', users);
    const { password_hash, ...safe } = users[index]; return safe;
  });
  res.json(updated);
}

export async function updateMatch(req, res) {
  const id = String(req.params.id);
  const result = await mutateWorkbook(({ get, set }) => {
    const matches = get('Partidos');
    const matchIndex = matches.findIndex((m) => String(m.id) === id);
    if (matchIndex < 0) throw Object.assign(new Error('Partido no encontrado'), { status: 404 });

    const state = req.body.estado ?? matches[matchIndex].estado;
    const home = Number(req.body.goles_local ?? matches[matchIndex].goles_local ?? 0);
    const away = Number(req.body.goles_visitante ?? matches[matchIndex].goles_visitante ?? 0);
    matches[matchIndex] = { ...matches[matchIndex], estado: state, goles_local: home, goles_visitante: away };

    const predictions = get('Pronosticos').map((p) => {
      if (String(p.partido_id) !== id) return p;
      return { ...p, puntos_obtenidos: state === 'finalizado' ? predictionPoints(p, matches[matchIndex]) : 0 };
    });
    const users = recalculateUserTotals(get('Usuarios'), predictions);

    set('Partidos', matches);
    set('Pronosticos', predictions);
    set('Usuarios', users);
    return matches[matchIndex];
  });
  res.json(result);
}
