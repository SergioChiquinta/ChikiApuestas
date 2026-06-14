import {
  listChoicesByUser,
  listCommunityChoices,
  upsertChoice
} from '../repositories/choiceRepository.js';
import { findMatchById } from '../repositories/matchRepository.js';
import { isMatchLocked } from '../services/matchTimeService.js';
import { isPlaceholderTeam } from '../services/bracketService.js';

const VALID_SELECTIONS = new Set(['local', 'empate', 'visitante']);

export async function mine(req, res) {
  const rows = await listChoicesByUser(req.user.id);
  res.json(rows);
}

export async function community(req, res) {
  const matchId = String(req.params.matchId);
  const match = await findMatchById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado.' });
  }

  const participants = await listCommunityChoices(matchId);
  res.json(participants);
}

export async function upsert(req, res) {
  const matchId = String(req.params.matchId);
  const selection = String(req.body.seleccion || '').toLowerCase();

  if (!VALID_SELECTIONS.has(selection)) {
    return res.status(400).json({
      message: 'Selecciona al equipo local, empate o al equipo visitante.'
    });
  }

  const match = await findMatchById(matchId);
  if (!match) {
    return res.status(404).json({ message: 'Partido no encontrado.' });
  }
  if (isMatchLocked(match)) {
    return res.status(409).json({
      message:
        'La encuesta se cerró porque el partido ya comenzó o fue cerrado por el administrador.'
    });
  }
  if (isPlaceholderTeam(match.local) || isPlaceholderTeam(match.visitante)) {
    return res.status(409).json({
      message: 'Los equipos de este partido todavía no están confirmados.'
    });
  }

  const saved = await upsertChoice({
    userId: req.user.id,
    matchId,
    selection
  });

  res.json(saved);
}
