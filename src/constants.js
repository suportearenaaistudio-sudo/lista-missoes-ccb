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
  // Trata formato ISO (ex: 2026-07-03T00:00:00.000Z) extraindo apenas a data YYYY-MM-DD
  const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [y, m, d] = cleanDateStr.split('-');
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
    } else if (ev.local === 'Iporã') {
      // Diferencia meses ímpares (Ensaio Local) e meses pares (Ensaio de Iporã e Região)
      const cleanDateStr = ev.event_date.includes('T') ? ev.event_date.split('T')[0] : ev.event_date;
      const month = parseInt(cleanDateStr.split('-')[1]);
      if (month % 2 === 0) {
        label += `Ensaio de Iporã e Região`;
      } else {
        label += `Ensaio Local em Iporã`;
      }
    } else {
      label += `Ensaio Local em ${ev.local}`;
    }
  } else {
    label += type;
    if (ev.local) label += ` em ${ev.local}`;
  }

  label += ` ${ev.time} h`;

  if (ev.observation && ev.observation !== '__seeded__') {
    label += ` - ${ev.observation}`;
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

export function checkRuleViolations(event, allEvents) {
  const violations = [];
  if (!event || !event.event_date) return violations;

  const [y, m, d] = event.event_date.split('-');
  const month = parseInt(m);
  const local = event.local;
  const type = event.event_type;

  // Regra de Rodízio para Ensaios (Nova Santa Helena nos meses ímpares, Vila Nilza nos meses pares)
  if (type === 'Ensaio' || type === 'Ensaio Regional') {
    if (local === 'Nova Santa Helena' && month % 2 === 0) {
      violations.push('Nova Santa Helena deve realizar ensaios apenas em meses ímpares.');
    }
    if (local === 'Vila Nilza' && month % 2 !== 0) {
      violations.push('Vila Nilza deve realizar ensaios apenas em meses pares.');
    }
  }

  // Regra de Conflito de Horário (mesmo local, data e horário)
  if (allEvents && allEvents.length > 0) {
    const conflict = allEvents.find(e => 
      e.id !== event.id && 
      e.event_date === event.event_date && 
      e.time === event.time && 
      e.local === local
    );
    if (conflict) {
      violations.push(`Conflito de horário: já existe o evento "${conflict.event_type}" neste mesmo local e horário.`);
    }
  }

  return violations;
}
