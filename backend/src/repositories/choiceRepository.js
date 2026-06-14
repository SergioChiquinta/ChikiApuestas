const pool = require("../config/database");

async function guardarEleccion(usuarioId, partidoId, eleccion) {
  const query = `
    INSERT INTO elecciones (
      usuario_id,
      partido_id,
      eleccion
    )
    VALUES ($1, $2, $3)
    ON CONFLICT (usuario_id, partido_id)
    DO UPDATE SET
      eleccion = EXCLUDED.eleccion,
      actualizado_en = NOW()
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    usuarioId,
    partidoId,
    eleccion,
  ]);

  return rows[0];
}

async function obtenerEleccionesDelPartido(partidoId) {
  const query = `
    SELECT
      u.id AS usuario_id,
      u.nombre,
      u.foto_perfil_url,
      e.eleccion
    FROM usuarios u
    LEFT JOIN elecciones e
      ON e.usuario_id = u.id
      AND e.partido_id = $1
    WHERE u.activo = TRUE
      AND u.rol = 'participante'
    ORDER BY u.nombre ASC
  `;

  const { rows } = await pool.query(query, [partidoId]);
  return rows;
}

module.exports = {
  guardarEleccion,
  obtenerEleccionesDelPartido,
};
