import 'dotenv/config';
import path from 'path';
import XLSX from 'xlsx';
import pool, { withTransaction } from '../src/config/database.js';
import { getMatchStart } from '../src/services/matchTimeService.js';

const VALID_SELECTIONS = new Set(['LOCAL', 'EMPATE', 'VISITANTE']);
const VALID_STATES = new Set(['pendiente', 'cerrado', 'finalizado']);
const VALID_ROLES = new Set(['admin', 'participante']);

function sheetRows(workbook, name) {
  const sheet = workbook.Sheets[name];
  return sheet ? XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true }) : [];
}

function text(value) {
  return String(value ?? '').trim();
}

function nullableText(value, maxLength = null) {
  const valueText = text(value);
  if (!valueText) return null;
  return maxLength ? valueText.slice(0, maxLength) : valueText;
}

function asBoolean(value, fallback = true) {
  if (value === '' || value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  return !['no', 'false', '0', 'inactivo'].includes(text(value).toLowerCase());
}

function nullableInteger(value) {
  if (value === '' || value === undefined || value === null) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function positiveInteger(value) {
  const valueText = text(value);
  if (!/^\d+$/.test(valueText)) return null;
  const number = Number(valueText);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function normalizeRole(value) {
  const role = text(value || 'participante').toLowerCase();
  return VALID_ROLES.has(role) ? role : 'participante';
}

function normalizeState(value) {
  const state = text(value || 'pendiente').toLowerCase();
  return VALID_STATES.has(state) ? state : 'pendiente';
}

function normalizeSelection(row) {
  const direct = text(row.eleccion || row.seleccion).toUpperCase();
  if (VALID_SELECTIONS.has(direct)) return direct;

  const home = nullableInteger(row.goles_local);
  const away = nullableInteger(row.goles_visitante);
  if (home !== null && away !== null) {
    if (home > away) return 'LOCAL';
    if (away > home) return 'VISITANTE';
    return 'EMPATE';
  }

  return null;
}

function asTimestamp(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const valueText = text(value);
  if (!valueText) return null;
  const date = new Date(valueText);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getExcelMatchStart(row) {
  const direct = asTimestamp(row.fecha_inicio || row.inicio_iso);
  if (direct) return direct;

  return getMatchStart({
    fecha: row.fecha,
    hora_local: row.hora_local || row.hora,
    zona_horaria: row.zona_horaria,
    ciudad: row.ciudad
  });
}

function parseJsonDetail(value, fallbackRow) {
  if (value && typeof value === 'object') return value;
  const valueText = text(value);
  if (valueText) {
    try {
      return JSON.parse(valueText);
    } catch {
      return { texto: valueText };
    }
  }
  return { origen: 'Excel', datos: fallbackRow };
}

function registerUserMapping(map, row, username, databaseId) {
  const candidates = [row.id, row.usuario_id, row.user_id, username];
  for (const candidate of candidates) {
    const key = text(candidate);
    if (key) map.set(key.toLowerCase(), databaseId);
  }
}

function resolveUserId(map, row) {
  const candidates = [
    row.usuario_id,
    row.user_id,
    row.usuario,
    row.username,
    row.nombre_usuario
  ];

  for (const candidate of candidates) {
    const key = text(candidate).toLowerCase();
    if (key && map.has(key)) return map.get(key);
  }

  const numericId = positiveInteger(row.usuario_id || row.user_id);
  return numericId;
}

const excelPath = path.resolve(
  process.cwd(),
  process.env.EXCEL_PATH || './data/chiki_pronosticos.xlsx'
);

const workbook = XLSX.readFile(excelPath, { cellDates: true });
const users = sheetRows(workbook, 'Usuarios');
const matches = sheetRows(workbook, 'Partidos');
const choices = sheetRows(workbook, 'Pronosticos');
const audits = sheetRows(workbook, 'Auditoria');
const configRows = sheetRows(workbook, 'Config');

try {
  const result = await withTransaction(async (client) => {
    const userIdMap = new Map();
    let importedUsers = 0;
    let importedMatches = 0;
    let importedChoices = 0;
    let importedAudits = 0;
    let skippedUsers = 0;
    let skippedMatches = 0;
    let skippedChoices = 0;

    for (const row of users) {
      const username = text(row.username);
      const nombre = text(row.nombre);
      const passwordHash = text(row.password_hash);

      if (!username || !nombre || !passwordHash) {
        console.warn(`Usuario omitido por datos incompletos: ${username || row.id || '(sin id)'}`);
        skippedUsers += 1;
        continue;
      }

      const { rows } = await client.query(
        `INSERT INTO usuarios (
           username, nombre, password_hash, rol,
           foto_perfil_url, activo, creado_en, actualizado_en
         )
         VALUES (
           $1, $2, $3, $4, $5, $6,
           COALESCE($7::timestamptz, NOW()), NOW()
         )
         ON CONFLICT (username)
         DO UPDATE SET
           nombre = EXCLUDED.nombre,
           password_hash = EXCLUDED.password_hash,
           rol = EXCLUDED.rol,
           foto_perfil_url = EXCLUDED.foto_perfil_url,
           activo = EXCLUDED.activo,
           actualizado_en = NOW()
         RETURNING id`,
        [
          username,
          nombre,
          passwordHash,
          normalizeRole(row.rol),
          nullableText(row.foto_perfil_url || row.foto_perfil),
          asBoolean(row.activo),
          asTimestamp(row.creado_en)
        ]
      );

      const databaseId = rows[0].id;
      registerUserMapping(userIdMap, row, username, databaseId);
      importedUsers += 1;
    }

    for (const row of matches) {
      const id = positiveInteger(row.id || row.partido_id);
      const start = getExcelMatchStart(row);

      if (!id || !start) {
        console.warn(`Partido omitido: id=${row.id || row.partido_id || '(vacío)'}, fecha inválida.`);
        skippedMatches += 1;
        continue;
      }

      await client.query(
        `INSERT INTO partidos (
           id, fase, grupo, fecha_inicio,
           equipo_local, codigo_local,
           equipo_visitante, codigo_visitante,
           goles_local, goles_visitante, estado,
           origen_local, origen_visitante, ganador_desempate,
           creado_en, actualizado_en
         )
         VALUES (
           $1, $2, $3, $4,
           $5, $6, $7, $8,
           $9, $10, $11,
           $12, $13, $14,
           NOW(), NOW()
         )
         ON CONFLICT (id)
         DO UPDATE SET
           fase = EXCLUDED.fase,
           grupo = EXCLUDED.grupo,
           fecha_inicio = EXCLUDED.fecha_inicio,
           equipo_local = EXCLUDED.equipo_local,
           codigo_local = EXCLUDED.codigo_local,
           equipo_visitante = EXCLUDED.equipo_visitante,
           codigo_visitante = EXCLUDED.codigo_visitante,
           goles_local = EXCLUDED.goles_local,
           goles_visitante = EXCLUDED.goles_visitante,
           estado = EXCLUDED.estado,
           origen_local = EXCLUDED.origen_local,
           origen_visitante = EXCLUDED.origen_visitante,
           ganador_desempate = EXCLUDED.ganador_desempate,
           actualizado_en = NOW()`,
        [
          id,
          text(row.fase) || 'Sin fase',
          nullableText(row.grupo, 10),
          start,
          nullableText(row.equipo_local || row.local, 100),
          nullableText(row.codigo_local, 5),
          nullableText(row.equipo_visitante || row.visitante, 100),
          nullableText(row.codigo_visitante, 5),
          nullableInteger(row.goles_local),
          nullableInteger(row.goles_visitante),
          normalizeState(row.estado),
          nullableText(row.origen_local || row.local, 100),
          nullableText(row.origen_visitante || row.visitante, 100),
          nullableText(row.ganador_desempate, 100)
        ]
      );

      importedMatches += 1;
    }

    for (const row of choices) {
      const userId = resolveUserId(userIdMap, row);
      const matchId = positiveInteger(row.partido_id || row.match_id);
      const selection = normalizeSelection(row);

      if (!userId || !matchId || !selection) {
        console.warn(
          `Elección omitida: usuario=${row.usuario_id || row.username || '(vacío)'}, partido=${row.partido_id || '(vacío)'}`
        );
        skippedChoices += 1;
        continue;
      }

      await client.query(
        `INSERT INTO elecciones (
           usuario_id, partido_id, eleccion, creado_en, actualizado_en
         )
         VALUES (
           $1, $2, $3,
           COALESCE($4::timestamptz, NOW()),
           COALESCE($5::timestamptz, NOW())
         )
         ON CONFLICT (usuario_id, partido_id)
         DO UPDATE SET
           eleccion = EXCLUDED.eleccion,
           actualizado_en = EXCLUDED.actualizado_en`,
        [
          userId,
          matchId,
          selection,
          asTimestamp(row.creado_en),
          asTimestamp(row.actualizado_en)
        ]
      );

      importedChoices += 1;
    }

    for (const row of audits) {
      const action = text(row.accion);
      if (!action) continue;

      const userId = resolveUserId(userIdMap, row);
      const createdAt = asTimestamp(row.creado_en || row.fecha);

      await client.query(
        `INSERT INTO auditoria (
           usuario_id, accion, entidad, entidad_id, detalle, creado_en
         )
         VALUES (
           $1, $2, $3, $4, $5::jsonb,
           COALESCE($6::timestamptz, NOW())
         )`,
        [
          userId || null,
          action,
          nullableText(row.entidad, 50),
          nullableText(row.entidad_id, 50),
          JSON.stringify(parseJsonDetail(row.detalle, row)),
          createdAt
        ]
      );

      importedAudits += 1;
    }

    return {
      usuarios_importados: importedUsers,
      usuarios_omitidos: skippedUsers,
      partidos_importados: importedMatches,
      partidos_omitidos: skippedMatches,
      elecciones_importadas: importedChoices,
      elecciones_omitidas: skippedChoices,
      auditorias_importadas: importedAudits,
      config_omitida: configRows.length
    };
  });

  if (configRows.length) {
    console.warn(
      `La hoja Config contiene ${configRows.length} fila(s), pero tu esquema no tiene una tabla configuracion; no se importaron.`
    );
  }

  console.log('Importación completada:', result);
} finally {
  await pool.end();
}
