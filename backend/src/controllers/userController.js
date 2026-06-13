import fs from 'fs';
import { fileURLToPath } from 'url';
import { mutateWorkbook } from '../services/excelStore.js';
import { hashPassword } from '../services/passwordService.js';

const profilesDirectory = fileURLToPath(new URL('../../uploads/perfiles/', import.meta.url));

function safeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

export async function updateProfile(req, res) {
  const { nombre, password } = req.body;
  const cleanName = String(nombre || '').trim();

  if (!cleanName) {
    return res.status(400).json({ message: 'El nombre es obligatorio.' });
  }
  if (password && String(password).length < 8) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  const updated = await mutateWorkbook(({ get, set }) => {
    const users = get('Usuarios');
    const index = users.findIndex((user) => String(user.id) === String(req.user.id));
    if (index < 0) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });

    users[index] = {
      ...users[index],
      nombre: cleanName,
      password_hash: password ? hashPassword(String(password)) : users[index].password_hash
    };
    set('Usuarios', users);
    return safeUser(users[index]);
  });

  res.json(updated);
}

export async function updatePhoto(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Selecciona una imagen.' });

  let previousPhoto = '';
  try {
    const relativePath = `/uploads/perfiles/${req.file.filename}`;

    const updated = await mutateWorkbook(({ get, set }) => {
      const users = get('Usuarios');
      const index = users.findIndex((user) => String(user.id) === String(req.user.id));
      if (index < 0) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });

      previousPhoto = String(users[index].foto_perfil || '');
      users[index] = { ...users[index], foto_perfil: relativePath };
      set('Usuarios', users);
      return safeUser(users[index]);
    });

    if (previousPhoto.startsWith('/uploads/perfiles/')) {
      const previousFilename = previousPhoto.split('/').pop();
      const previousAbsolutePath = fileURLToPath(new URL(`../../uploads/perfiles/${previousFilename}`, import.meta.url));
      if (previousAbsolutePath.startsWith(profilesDirectory) && fs.existsSync(previousAbsolutePath)) {
        fs.unlinkSync(previousAbsolutePath);
      }
    }

    res.json(updated);
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw error;
  }
}
