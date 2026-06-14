import pool from '../config/database.js';

const USER_COLUMNS = `
  id,
  username,
  nombre,
  password_hash,
  rol,
  COALESCE(foto_perfil_url, '') AS foto_perfil,
  ''::text AS foto_perfil_public_id,
  activo,
  creado_en,
  actualizado_en
`;

export async function findUserByUsername(username, executor = pool) {
  const { rows } = await executor.query(
    `SELECT ${USER_COLUMNS}
     FROM usuarios
     WHERE LOWER(username) = LOWER($1)
     LIMIT 1`,
    [username]
  );
  return rows[0] || null;
}

export async function findUserById(id, executor = pool) {
  const { rows } = await executor.query(
    `SELECT ${USER_COLUMNS}
     FROM usuarios
     WHERE id = $1::bigint
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function listUsers(executor = pool) {
  const { rows } = await executor.query(
    `SELECT ${USER_COLUMNS}
     FROM usuarios
     ORDER BY nombre ASC, username ASC`
  );
  return rows;
}

export async function createUser(
  { username, nombre, passwordHash, rol, fotoPerfil = '', activo = true },
  executor = pool
) {
  const { rows } = await executor.query(
    `INSERT INTO usuarios (
       username, nombre, password_hash, rol,
       foto_perfil_url, activo, creado_en, actualizado_en
     )
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING ${USER_COLUMNS}`,
    [username, nombre, passwordHash, rol, fotoPerfil || null, activo]
  );
  return rows[0];
}

export async function updateUser(
  id,
  { nombre, passwordHash, rol, activo },
  executor = pool
) {
  const { rows } = await executor.query(
    `UPDATE usuarios
     SET nombre = $2,
         password_hash = $3,
         rol = $4,
         activo = $5,
         actualizado_en = NOW()
     WHERE id = $1::bigint
     RETURNING ${USER_COLUMNS}`,
    [id, nombre, passwordHash, rol, activo]
  );
  return rows[0] || null;
}

export async function updateOwnProfile(
  id,
  { nombre, passwordHash },
  executor = pool
) {
  const { rows } = await executor.query(
    `UPDATE usuarios
     SET nombre = $2,
         password_hash = $3,
         actualizado_en = NOW()
     WHERE id = $1::bigint
     RETURNING ${USER_COLUMNS}`,
    [id, nombre, passwordHash]
  );
  return rows[0] || null;
}

export async function updateUserPhoto(id, { url }, executor = pool) {
  const { rows } = await executor.query(
    `UPDATE usuarios
     SET foto_perfil_url = $2,
         actualizado_en = NOW()
     WHERE id = $1::bigint
     RETURNING ${USER_COLUMNS}`,
    [id, url]
  );
  return rows[0] || null;
}
