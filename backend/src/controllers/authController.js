import jwt from 'jsonwebtoken';
import { findUserById, findUserByUsername } from '../repositories/userRepository.js';
import { verifyPassword } from '../services/passwordService.js';

function publicUser(user) {
  const { password_hash, foto_perfil_public_id, ...safe } = user;
  return {
    ...safe,
    activo: user.activo ? 'si' : 'no'
  };
}

export async function login(req, res) {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  const user = username ? await findUserByUsername(username) : null;
  if (!user || !user.activo || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
  }

  const token = jwt.sign(
    { id: user.id, rol: user.rol, nombre: user.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  res.json({ token, user: publicUser(user) });
}

export async function me(req, res) {
  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json(publicUser(user));
}
