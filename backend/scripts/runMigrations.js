import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import pool from '../src/config/database.js';

try {
  const schemaPath = path.resolve(process.cwd(), 'database/schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');
  await pool.query(sql);
  console.log('Esquema de Neon actualizado correctamente.');
} finally {
  await pool.end();
}
