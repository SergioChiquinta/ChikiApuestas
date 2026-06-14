import 'dotenv/config';
import pool from '../src/config/database.js';
import cloudinary from '../src/config/cloudinary.js';

try {
  const database = await pool.query(`
    SELECT
      (SELECT COUNT(*)::integer FROM usuarios) AS usuarios,
      (SELECT COUNT(*)::integer FROM partidos) AS partidos,
      (SELECT COUNT(*)::integer FROM elecciones) AS elecciones
  `);
  const cloudinaryStatus = await cloudinary.api.ping();

  console.log('Neon:', database.rows[0]);
  console.log('Cloudinary:', cloudinaryStatus.status || 'ok');
  console.log('Integración verificada correctamente.');
} finally {
  await pool.end();
}
