import pool from '../config/database.js';

const CHOICE_COLUMNS = `
  id,
  usuario_id,
  partido_id,
  LOWER(eleccion) AS seleccion,
  creado_en,
  actualizado_en
`;

export async function listChoices(executor = pool) {
  const { rows } = await executor.query(
    `SELECT ${CHOICE_COLUMNS}
     FROM elecciones
     ORDER BY actualizado_en ASC`
  );
  return rows;
}

export async function listChoicesByUser(userId, executor = pool) {
  const { rows } = await executor.query(
    `SELECT ${CHOICE_COLUMNS}
     FROM elecciones
     WHERE usuario_id = $1::bigint
     ORDER BY actualizado_en ASC`,
    [userId]
  );
  return rows;
}

export async function listCommunityChoices(matchId, executor = pool) {
  const { rows } = await executor.query(
    `SELECT
       u.id,
       u.nombre,
       COALESCE(u.foto_perfil_url, '') AS foto_perfil,
       COALESCE(LOWER(e.eleccion), '') AS seleccion
     FROM usuarios u
     LEFT JOIN elecciones e
       ON e.usuario_id = u.id
      AND e.partido_id = $1::integer
     WHERE u.activo = TRUE
       AND u.rol = 'participante'
     ORDER BY u.nombre ASC`,
    [matchId]
  );
  return rows;
}

export async function upsertChoice(
  { userId, matchId, selection },
  executor = pool
) {
  const { rows } = await executor.query(
    `INSERT INTO elecciones (
       usuario_id, partido_id, eleccion, creado_en, actualizado_en
     )
     VALUES ($1::bigint, $2::integer, UPPER($3), NOW(), NOW())
     ON CONFLICT (usuario_id, partido_id)
     DO UPDATE SET
       eleccion = EXCLUDED.eleccion,
       actualizado_en = NOW()
     RETURNING ${CHOICE_COLUMNS}`,
    [userId, matchId, selection]
  );
  return rows[0];
}
