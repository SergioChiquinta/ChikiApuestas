const COUNTRY_CODES = {
  Alemania: 'DE',
  'Arabia Saudita': 'SA',
  Argelia: 'DZ',
  Argentina: 'AR',
  Australia: 'AU',
  Austria: 'AT',
  'Bosnia y Herzegovina': 'BA',
  Brasil: 'BR',
  Bélgica: 'BE',
  'Cabo Verde': 'CV',
  Canadá: 'CA',
  Catar: 'QA',
  Chequia: 'CZ',
  Colombia: 'CO',
  'Corea del Sur': 'KR',
  'Costa de Marfil': 'CI',
  Croacia: 'HR',
  Curazao: 'CW',
  Ecuador: 'EC',
  Egipto: 'EG',
  Escocia: 'GB-SCT',
  España: 'ES',
  'Estados Unidos': 'US',
  Francia: 'FR',
  Ghana: 'GH',
  Haití: 'HT',
  Inglaterra: 'GB-ENG',
  Irak: 'IQ',
  Irán: 'IR',
  Japón: 'JP',
  Jordania: 'JO',
  Marruecos: 'MA',
  México: 'MX',
  Noruega: 'NO',
  'Nueva Zelanda': 'NZ',
  Panamá: 'PA',
  Paraguay: 'PY',
  'Países Bajos': 'NL',
  Portugal: 'PT',
  'República Democrática del Congo': 'CD',
  Senegal: 'SN',
  Sudáfrica: 'ZA',
  Suecia: 'SE',
  Suiza: 'CH',
  Turquía: 'TR',
  Túnez: 'TN',
  Uruguay: 'UY',
  Uzbekistán: 'UZ'
};

const SPECIAL_FLAGS = {
  Escocia: '🏴',
  Inglaterra: '🏴'
};

export function flagFor(team) {
  if (SPECIAL_FLAGS[team]) return SPECIAL_FLAGS[team];
  const code = COUNTRY_CODES[team];
  if (!code || code.includes('-')) return '⚽';
  return code
    .toUpperCase()
    .split('')
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join('');
}

export function selectionText(selection, match) {
  if (selection === 'local') return match.local;
  if (selection === 'visitante') return match.visitante;
  if (selection === 'empate') return 'Empate';
  return '-- --';
}

export function selectionFlag(selection, match) {
  if (selection === 'local') return flagFor(match.local);
  if (selection === 'visitante') return flagFor(match.visitante);
  if (selection === 'empate') return '🤝';
  return '—';
}
