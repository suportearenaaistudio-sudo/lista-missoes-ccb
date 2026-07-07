export const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

export const MONTH_ABBR = [
  'jan','fev','mar','abr','mai','jun',
  'jul','ago','set','out','nov','dez'
];

export const LOCAIS = [
  'Vila Nilza',
  'Nova Santa Helena',
  'Iporã',
  'Francisco Alves',
  'Rio Bonito',
  'Cafezal do Sul',
  'Guaiporã',
];

export const SECTIONS = {
  'Ensaio': 'ENSAIOS MENSAIS',
  'Ensaio Regional': 'ENSAIOS MENSAIS',
  'Culto Unificado': 'CULTO UNIFICADO',
  'Culto de Evangelização': 'CULTO DE EVANGELIZAÇÃO',
  'Reunião de Mocidade': 'REUNIÃO DE MOCIDADE',
};

export const SECTION_ORDER = [
  'ENSAIOS MENSAIS',
  'CULTO UNIFICADO',
  'CULTO DE EVANGELIZAÇÃO',
  'REUNIÃO DE MOCIDADE',
];

export const EVENT_TYPES = Object.keys(SECTIONS);

export const YEAR = 2026;

// Format a date string (YYYY-MM-DD) as DD/MM/YYYY
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// Build the text label for a printed event line
export function buildEventLabel(ev) {
  const dateStr = formatDate(ev.event_date);
  const type = ev.event_type;
  const parcial = ev.is_parcial;

  let label = dateStr + ' ';

  if (type === 'Ensaio' || type === 'Ensaio Regional') {
    if (type === 'Ensaio Regional') {
      label += `Ensaio Regional em ${ev.local}`;
    } else if (parcial) {
      label += `Ensaio Parcial em ${ev.local}`;
    } else {
      label += `Ensaio Local em ${ev.local}`;
    }
  } else {
    label += type;
    if (ev.local) label += ` em ${ev.local}`;
  }

  label += ` ${ev.time} h`;

  if (ev.observation && ev.observation !== '__seeded__') {
    label += ` — ${ev.observation}`;
  }

  return label;
}

export function getSectionBadge(ev) {
  const type = ev.event_type;
  if (type === 'Ensaio Regional') return 'regional';
  if (ev.is_parcial) return 'parcial';
  if (type === 'Culto Unificado' || type === 'Culto de Evangelização') return 'culto';
  if (type === 'Reunião de Mocidade') return 'mocidade';
  return null;
}
