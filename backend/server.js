import 'dotenv/config';
import app from './src/app.js';
import pool from './src/config/database.js';

const port = Number(process.env.PORT || 4000);

async function start() {
  await pool.query('SELECT 1');
  const server = app.listen(port, () => {
    console.log(`API disponible en http://localhost:${port}`);
    console.log('PostgreSQL conectado correctamente.');
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal}: cerrando servidor...`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch(async (error) => {
  console.error('No se pudo iniciar el backend:', error);
  await pool.end().catch(() => {});
  process.exit(1);
});
