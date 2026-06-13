import jwt from 'jsonwebtoken';
import { readSheet } from '../services/excelStore.js';
import { verifyPassword } from '../services/passwordService.js';

function publicUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

export async function login(req, res) {
  const { username, password } = req.body;
  const users = await readSheet('Usuarios');
  const user = users.find((u) => String(u.username).toLowerCase() === String(username).toLowerCase() && String(u.activo).toLowerCase() !== 'no');
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
  }
  const token = jwt.sign({ id: user.id, rol: user.rol, nombre: user.nombre }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ token, user: publicUser(user) });
}

export async function me(req, res) {
  const users = await readSheet('Usuarios');
  const user = users.find((u) => String(u.id) === String(req.user.id));
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json(publicUser(user));
}
