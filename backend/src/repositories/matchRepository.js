import pool from '../config/database.js';

const MATCH_COLUMNS = `
  id,
  fase,
  grupo,
  TO_CHAR(fecha_inicio AT TIME ZONE 'America/Lima', 'YYYY-MM-DD') AS fecha,
  TO_CHAR(fecha_inicio AT TIME ZONE 'America/Lima', 'HH24:MI') AS hora_local,
  equipo_local AS local,
  codigo_local,
  equipo_visitante AS visitante,
  codigo_visitante,
  ''::text AS estadio,
  ''::text AS ciudad,
  goles_local,
  goles_visitante,
  estado,
  ''::text AS fuente,
  'America/Lima'::text AS zona_horaria,
  origen_local,
  origen_visitante,
  ganador_desempate,
  fecha_inicio,
  creado_en,
  actualizado_en
`;

export async function listMatches(executor = pool) {
  const { rows } = await executor.query(
    `SELECT ${MATCH_COLUMNS}
     FROM partidos
     ORDER BY id ASC`
  );
  return rows;
}

export async function findMatchById(id, executor = pool) {
  const { rows } = await executor.query(
    `SELECT ${MATCH_COLUMNS}
     FROM partidos
     WHERE id = $1::integer
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function saveMatch(match, executor = pool) {
  const { rows } = await executor.query(
    `UPDATE partidos
     SET equipo_local = $2,
         equipo_visitante = $3,
         goles_local = $4,
         goles_visitante = $5,
         estado = $6,
         ganador_desempate = NULLIF($7, ''),
         origen_local = NULLIF($8, ''),
         origen_visitante = NULLIF($9, ''),
         actualizado_en = NOW()
     WHERE id = $1::integer
     RETURNING ${MATCH_COLUMNS}`,
    [
      match.id,
      match.local || null,
      match.visitante || null,
      match.goles_local ?? null,
      match.goles_visitante ?? null,
      match.estado,
      match.ganador_desempate || '',
      match.origen_local || match.local || '',
      match.origen_visitante || match.visitante || ''
    ]
  );
  return rows[0] || null;
}
