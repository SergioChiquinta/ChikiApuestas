import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import pool from '../src/config/database.js';
import { listUsers, updateUserPhoto } from '../src/repositories/userRepository.js';
import { uploadProfileImage } from '../src/services/cloudinaryService.js';

try {
  const users = await listUsers();
  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    const currentPhoto = String(user.foto_perfil || '').trim();
    if (!currentPhoto || /^https?:\/\//i.test(currentPhoto)) {
      skipped += 1;
      continue;
    }

    const relativePath = currentPhoto.replace(/^\/+/, '');
    const absolutePath = path.resolve(process.cwd(), relativePath);

    try {
      const buffer = await fs.readFile(absolutePath);
      const uploaded = await uploadProfileImage(buffer, user.id);
      await updateUserPhoto(user.id, uploaded);
      migrated += 1;
      console.log(`Foto migrada: ${user.username}`);
    } catch (error) {
      console.warn(`No se migró la foto de ${user.username}: ${error.message}`);
    }
  }

  console.log({ migrated, skipped });
} finally {
  await pool.end();
}
