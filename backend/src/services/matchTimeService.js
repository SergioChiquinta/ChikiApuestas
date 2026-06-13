const LIMA_TIME_ZONE = 'America/Lima';

const CITY_TIME_ZONES = new Map([
  ['Ciudad de México', 'America/Mexico_City'],
  ['Guadalajara', 'America/Mexico_City'],
  ['Monterrey', 'America/Monterrey'],
  ['Toronto', 'America/Toronto'],
  ['Vancouver', 'America/Vancouver'],
  ['Los Ángeles', 'America/Los_Angeles'],
  ['Boston', 'America/New_York'],
  ['Nueva York/Nueva Jersey', 'America/New_York'],
  ['Área de la Bahía de San Francisco', 'America/Los_Angeles'],
  ['Filadelfia', 'America/New_York'],
  ['Houston', 'America/Chicago'],
  ['Dallas', 'America/Chicago'],
  ['Atlanta', 'America/New_York'],
  ['Miami', 'America/New_York'],
  ['Seattle', 'America/Los_Angeles'],
  ['Kansas City', 'America/Chicago']
]);

function pad(value) {
  return String(value).padStart(2, '0');
}

export function normalizeDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const date = new Date(excelEpoch + Math.round(value * 86400000));
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  }

  const text = String(value || '').trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}`;
  }

  return '';
}

function normalizeTimeValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const totalMinutes = Math.round(value * 24 * 60);
    return `${pad(Math.floor(totalMinutes / 60) % 24)}:${pad(totalMinutes % 60)}`;
  }

  const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
  return match ? `${pad(match[1])}:${match[2]}` : '00:00';
}

function timeZoneOffsetMilliseconds(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
  );

  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return representedAsUtc - date.getTime();
}

function localDateTimeToUtc(dateText, timeText, timeZone) {
  const [year, month, day] = dateText.split('-').map(Number);
  const [hour, minute] = timeText.split(':').map(Number);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  let offset = timeZoneOffsetMilliseconds(new Date(wallClockAsUtc), timeZone);
  let result = new Date(wallClockAsUtc - offset);
  const correctedOffset = timeZoneOffsetMilliseconds(result, timeZone);

  if (correctedOffset !== offset) {
    offset = correctedOffset;
    result = new Date(wallClockAsUtc - offset);
  }

  return result;
}

export function getMatchStart(match) {
  const dateText = normalizeDateValue(match.fecha);
  const timeText = normalizeTimeValue(match.hora_local);
  if (!dateText) return null;

  const zone = String(match.zona_horaria || '').trim()
    || CITY_TIME_ZONES.get(String(match.ciudad || '').trim())
    || LIMA_TIME_ZONE;

  const start = localDateTimeToUtc(dateText, timeText, zone);
  return Number.isNaN(start.getTime()) ? null : start;
}

export function isMatchLocked(match, now = new Date()) {
  if (String(match.estado).toLowerCase() !== 'pendiente') return true;
  const start = getMatchStart(match);
  return Boolean(start && now.getTime() >= start.getTime());
}

export function enrichMatch(match, now = new Date()) {
  const start = getMatchStart(match);
  const dateText = normalizeDateValue(match.fecha);
  const timeText = normalizeTimeValue(match.hora_local);
  const zone = String(match.zona_horaria || '').trim()
    || CITY_TIME_ZONES.get(String(match.ciudad || '').trim())
    || LIMA_TIME_ZONE;

  const limaDateFormatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const limaTimeFormatter = new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return {
    ...match,
    fecha: dateText,
    hora_local: timeText,
    zona_horaria: zone,
    inicio_iso: start?.toISOString() || '',
    fecha_lima: start ? limaDateFormatter.format(start) : dateText,
    hora_lima: start ? limaTimeFormatter.format(start) : timeText,
    bloqueado: isMatchLocked(match, now)
  };
}

export function enrichMatches(matches, now = new Date()) {
  return matches
    .map((match) => enrichMatch(match, now))
    .sort((a, b) => Number(a.id) - Number(b.id));
}
