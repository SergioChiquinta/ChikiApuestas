import { listUsers } from '../repositories/userRepository.js';
import { listMatches as findMatches } from '../repositories/matchRepository.js';
import { listChoices } from '../repositories/choiceRepository.js';
import { enrichMatches } from '../services/matchTimeService.js';

const VALID_SELECTIONS = new Set(['local', 'empate', 'visitante']);

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getMatchOutcome(match) {
  const homeGoals = Number(match.goles_local);
  const awayGoals = Number(match.goles_visitante);
  if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) return null;
  if (homeGoals > awayGoals) return 'local';
  if (homeGoals < awayGoals) return 'visitante';

  const tieBreakerWinner = normalize(match.ganador_desempate);
  const homeTeam = normalize(match.local);
  const awayTeam = normalize(match.visitante);
  if (tieBreakerWinner === 'local' || tieBreakerWinner === homeTeam) return 'local';
  if (tieBreakerWinner === 'visitante' || tieBreakerWinner === awayTeam) {
    return 'visitante';
  }
  return 'empate';
}

function choiceTimestamp(choice) {
  const timestamp = Date.parse(choice.actualizado_en || choice.creado_en || '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export async function listMatches(_req, res) {
  const matches = await findMatches();
  res.json(enrichMatches(matches));
}

export async function participation(_req, res) {
  const [users, matches, rows] = await Promise.all([
    listUsers(),
    findMatches(),
    listChoices()
  ]);

  const totalPolls = matches.length;
  const counts = new Map();
  for (const row of rows) {
    if (!row.usuario_id || !row.partido_id) continue;
    const key = String(row.usuario_id);
    const unique = counts.get(key) || new Set();
    unique.add(String(row.partido_id));
    counts.set(key, unique);
  }

  const participants = users
    .filter((user) => user.rol === 'participante' && user.activo)
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'))
    .map((user) => {
      const completed = counts.get(String(user.id))?.size || 0;
      return {
        id: user.id,
        nombre: user.nombre,
        foto_perfil: user.foto_perfil || '',
        completadas: completed,
        pendientes: Math.max(totalPolls - completed, 0),
        total: totalPolls,
        porcentaje: totalPolls ? Math.round((completed / totalPolls) * 100) : 0
      };
    });

  res.json(participants);
}

export async function ranking(_req, res) {
  const [users, matches, choiceRows] = await Promise.all([
    listUsers(),
    findMatches(),
    listChoices()
  ]);

  const finalizedMatches = matches
    .filter((match) => normalize(match.estado) === 'finalizado')
    .map((match) => ({ ...match, resultado_seleccion: getMatchOutcome(match) }))
    .filter((match) => match.resultado_seleccion);

  const finalizedById = new Map(
    finalizedMatches.map((match) => [String(match.id), match])
  );

  const latestChoices = new Map();
  for (const choice of choiceRows) {
    const userId = String(choice.usuario_id || '');
    const matchId = String(choice.partido_id || '');
    const selection = normalize(choice.seleccion);
    if (!userId || !matchId || !VALID_SELECTIONS.has(selection)) continue;
    if (!finalizedById.has(matchId)) continue;

    const key = `${userId}:${matchId}`;
    const current = latestChoices.get(key);
    if (!current || choiceTimestamp(choice) >= choiceTimestamp(current)) {
      latestChoices.set(key, {
        ...choice,
        usuario_id: userId,
        partido_id: matchId,
        seleccion: selection
      });
    }
  }

  const choicesByUser = new Map();
  for (const choice of latestChoices.values()) {
    const rows = choicesByUser.get(choice.usuario_id) || [];
    rows.push(choice);
    choicesByUser.set(choice.usuario_id, rows);
  }

  const rankingRows = users
    .filter((user) => user.rol === 'participante' && user.activo)
    .map((user) => {
      const userChoices = choicesByUser.get(String(user.id)) || [];
      let hits = 0;
      for (const choice of userChoices) {
        const match = finalizedById.get(choice.partido_id);
        if (match && choice.seleccion === match.resultado_seleccion) hits += 1;
      }

      const evaluated = userChoices.length;
      const misses = Math.max(evaluated - hits, 0);
      return {
        id: user.id,
        nombre: user.nombre,
        foto_perfil: user.foto_perfil || '',
        puntos: hits,
        aciertos: hits,
        fallos: misses,
        evaluados: evaluated,
        sin_responder: Math.max(finalizedMatches.length - evaluated, 0),
        porcentaje_aciertos: evaluated ? Math.round((hits / evaluated) * 100) : 0
      };
    })
    .sort(
      (a, b) =>
        b.puntos - a.puntos ||
        b.porcentaje_aciertos - a.porcentaje_aciertos ||
        b.evaluados - a.evaluados ||
        String(a.nombre).localeCompare(String(b.nombre), 'es')
    );

  let previousPoints = null;
  let previousPosition = 0;
  const positionedRanking = rankingRows.map((participant, index) => {
    const position =
      participant.puntos === previousPoints ? previousPosition : index + 1;
    previousPoints = participant.puntos;
    previousPosition = position;
    return { ...participant, posicion: position };
  });

  res.json({
    resumen: {
      participantes: positionedRanking.length,
      partidos_finalizados: finalizedMatches.length,
      puntos_maximos: finalizedMatches.length,
      lider: positionedRanking[0] || null
    },
    ranking: positionedRanking
  });
}
