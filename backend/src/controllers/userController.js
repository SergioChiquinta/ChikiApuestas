import {
  findUserById,
  updateOwnProfile,
  updateUserPhoto
} from '../repositories/userRepository.js';
import { hashPassword } from '../services/passwordService.js';
import { uploadProfileImage } from '../services/cloudinaryService.js';

function publicUser(user) {
  const { password_hash, foto_perfil_public_id, ...safe } = user;
  return {
    ...safe,
    activo: user.activo ? 'si' : 'no'
  };
}

export async function updateProfile(req, res) {
  const cleanName = String(req.body.nombre || '').trim();
  const password = req.body.password ? String(req.body.password) : '';

  if (!cleanName) {
    return res.status(400).json({ message: 'El nombre es obligatorio.' });
  }
  if (password && password.length < 8) {
    return res.status(400).json({
      message: 'La contraseña debe tener al menos 8 caracteres.'
    });
  }

  const current = await findUserById(req.user.id);
  if (!current) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  const updated = await updateOwnProfile(req.user.id, {
    nombre: cleanName,
    passwordHash: password ? hashPassword(password) : current.password_hash
  });

  res.json(publicUser(updated));
}

export async function updatePhoto(req, res) {
  if (!req.file?.buffer) {
    return res.status(400).json({ message: 'Selecciona una imagen.' });
  }

  const current = await findUserById(req.user.id);
  if (!current) {
    return res.status(404).json({ message: 'Usuario no encontrado.' });
  }

  const uploaded = await uploadProfileImage(req.file.buffer, req.user.id);
  const updated = await updateUserPhoto(req.user.id, uploaded);

  res.json(publicUser(updated));
}
