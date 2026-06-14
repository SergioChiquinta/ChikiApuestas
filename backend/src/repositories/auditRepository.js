import pool from '../config/database.js';

export async function createAudit(
  { userId, action, entity, entityId, detail = null },
  executor = pool
) {
  const { rows } = await executor.query(
    `INSERT INTO auditoria (
       usuario_id, accion, entidad, entidad_id, detalle, creado_en
     )
     VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
     RETURNING *`,
    [
      userId || null,
      action,
      entity || null,
      entityId === undefined || entityId === null ? null : String(entityId),
      JSON.stringify(detail)
    ]
  );
  return rows[0];
}
