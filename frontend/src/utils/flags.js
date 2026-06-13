import { createElement } from 'react';

const COUNTRY_CODES = {
  Alemania: 'de',
  'Arabia Saudita': 'sa',
  Argelia: 'dz',
  Argentina: 'ar',
  Australia: 'au',
  Austria: 'at',
  'Bosnia y Herzegovina': 'ba',
  Brasil: 'br',
  Bélgica: 'be',
  'Cabo Verde': 'cv',
  Canadá: 'ca',
  Catar: 'qa',
  Chequia: 'cz',
  Colombia: 'co',
  'Corea del Sur': 'kr',
  'Costa de Marfil': 'ci',
  Croacia: 'hr',
  Curazao: 'cw',
  Ecuador: 'ec',
  Egipto: 'eg',
  Escocia: 'gb-sct',
  España: 'es',
  'Estados Unidos': 'us',
  Francia: 'fr',
  Ghana: 'gh',
  Haití: 'ht',
  Inglaterra: 'gb-eng',
  Irak: 'iq',
  Irán: 'ir',
  Japón: 'jp',
  Jordania: 'jo',
  Marruecos: 'ma',
  México: 'mx',
  Noruega: 'no',
  'Nueva Zelanda': 'nz',
  Panamá: 'pa',
  Paraguay: 'py',
  'Países Bajos': 'nl',
  Portugal: 'pt',
  'República Democrática del Congo': 'cd',
  Senegal: 'sn',
  Sudáfrica: 'za',
  Suecia: 'se',
  Suiza: 'ch',
  Turquía: 'tr',
  Túnez: 'tn',
  Uruguay: 'uy',
  Uzbekistán: 'uz'
};

const COUNTRY_ALIASES = {
  'bosnia-herzegovina': 'ba',
  'corea-republica': 'kr',
  'estados-unidos-de-america': 'us',
  'paises-bajos': 'nl',
  'republica-democratica-del-congo': 'cd',
  'rd-congo': 'cd',
  'r-d-del-congo': 'cd'
};

function normalizeCountryName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const NORMALIZED_CODES = Object.fromEntries(
  Object.entries(COUNTRY_CODES).map(([name, code]) => [normalizeCountryName(name), code])
);

export function countryCodeFor(team) {
  const normalized = normalizeCountryName(team);
  return NORMALIZED_CODES[normalized] || COUNTRY_ALIASES[normalized] || '';
}

export function flagFor(team, extraClassName = '') {
  const code = countryCodeFor(team);

  if (!code) return '⚽';

  return createElement('span', {
    className: `fi fi-${code} country-flag ${extraClassName}`.trim(),
    role: 'img',
    'aria-label': `Bandera de ${team}`,
    title: team
  });
}

export function selectionText(selection, match) {
  if (selection === 'local') return match?.local || '-- --';
  if (selection === 'visitante') return match?.visitante || '-- --';
  if (selection === 'empate') return 'Empate';
  return '-- --';
}

export function selectionTeam(selection, match) {
  if (selection === 'local') return match?.local || '';
  if (selection === 'visitante') return match?.visitante || '';
  return '';
}

export function selectionFlag(selection, match) {
  const team = selectionTeam(selection, match);
  if (team) return flagFor(team);
  if (selection === 'empate') return '🤝';
  return '—';
}
