import 'dotenv/config';
import pool, { withTransaction } from '../src/config/database.js';
import { hashPassword } from '../src/services/passwordService.js';

const seedAccounts = [
  { username: 'admin', password: 'Admin123!' },
  { username: 'sergio', password: 'Familia123!' }
];

try {
  await withTransaction(async (client) => {
    for (const account of seedAccounts) {
      const { rowCount } = await client.query(
        `UPDATE usuarios
         SET password_hash = $2,
             activo = TRUE,
             actualizado_en = NOW()
         WHERE LOWER(username) = LOWER($1)`,
        [account.username, hashPassword(account.password)]
      );

      if (!rowCount) {
        throw new Error(`No se encontró el usuario inicial: ${account.username}`);
      }
    }
  });

  console.log('Contraseñas restablecidas correctamente.');
  console.log('Cámbialas después de iniciar sesión.');
} finally {
  await pool.end();
}
