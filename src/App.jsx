import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { MONTHS, SECTION_ORDER, SECTIONS, EVENT_TYPES, LOCAIS, YEAR as CURRENT_YEAR,
         formatDate, buildEventLabel, getSectionBadge, checkRuleViolations } from './constants';
import { fetchAllEvents, createEvent, updateEvent, deleteEvent, runSetup } from './api';
 
// ─── Icons (inline SVG components) ──────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = 'currentColor', fill = 'none', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    {d ? <path d={d} /> : children}
  </svg>
);
 
const HomeIcon = () => <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" />;
const CalendarIcon = () => <Icon d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18" />;
const ChevronLeft = () => <Icon d="M15 18l-6-6 6-6" />;
const Plus = () => <Icon d="M12 5v14M5 12h14" />;
const Pencil = () => <Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />;
const Trash = () => <Icon d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />;
const Printer = () => <Icon d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 12-2h16a2 2 0 0 12 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />;
const X = () => <Icon d="M18 6L6 18M6 6l12 12" />;
const MenuIcon = () => <Icon d="M4 6h16M4 12h16M4 18h16" />;
const SearchIcon = () => <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
const AlertIcon = () => <Icon d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />;
const SunIcon = () => <Icon d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />;
const DownloadIcon = () => <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />;
const MoonIcon = () => <Icon d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />;

// Custom icons for stats
const TotalEventsIcon = () => (
  <Icon stroke="currentColor">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </Icon>
);
const EnsaioIcon = () => (
  <Icon stroke="currentColor">
    <path d="M9 18V5l12-2v13M9 9l12-2" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </Icon>
);
const CultoIcon = () => (
  <Icon stroke="currentColor">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" />
  </Icon>
);
const MocidadeIcon = () => (
  <Icon stroke="currentColor">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return <div className="toast"><span>✓</span> {message}</div>;
}

// ─── Event Modal ─────────────────────────────────────────────────────────────
function EventModal({ event, month, year, allEvents, onClose, onSave }) {
  const isEdit = !!event?.id;
  const defaultDate = `${year}-${String(month || 1).padStart(2,'0')}-01`;

  const cleanEventDate = event?.event_date 
    ? (event.event_date.includes('T') ? event.event_date.split('T')[0] : event.event_date) 
    : defaultDate;

  const [form, setForm] = useState({
    event_date: cleanEventDate,
    time: event?.time || '19:30',
    local: event?.local || LOCAIS[2],
    event_type: event?.event_type || 'Ensaio',
    is_parcial: event?.is_parcial ?? false,
    show_in_prev_month: event?.show_in_prev_month ?? false,
    observation: (event?.observation && event.observation !== '__seeded__') ? event.observation : '',
  });

  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const currentEventObject = {
    id: event?.id,
    event_date: form.event_date,
    time: form.time,
    local: form.local,
    event_type: form.event_type,
    is_parcial: form.is_parcial,
    observation: form.observation
  };
  const warnings = checkRuleViolations(currentEventObject, allEvents);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const section = SECTIONS[form.event_type] || 'ENSAIOS MENSAIS';
      const [y, m, d] = form.event_date.split('-');
      const eventMonth = parseInt(m);
      const eventYear = parseInt(y);

      if (isEdit) {
        await onSave({ ...form, id: event.id, section, month: eventMonth, year: eventYear });
      } else {
        await onSave({ ...form, section, month: eventMonth, year: eventYear });
      }
      onClose();
    } catch (err) {
      // O erro será capturado e exibido pelo pai
    } finally {
      setSaving(false);
    }
  };

  const dateParts = form.event_date ? form.event_date.split('-') : [];
  const eventDay = dateParts[2] ? parseInt(dateParts[2]) : 0;
  const eventMonth = dateParts[1] ? parseInt(dateParts[1]) : 0;
  const isEarlyInMonth = eventDay > 0 && eventDay <= 7;
  
  let prevMonthName = '';
  if (eventMonth > 0) {
    const idx = eventMonth === 1 ? 11 : eventMonth - 2;
    prevMonthName = MONTHS[idx];
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{isEdit ? 'Editar Evento' : 'Novo Evento'}</h2>
        
        {warnings.length > 0 && (
          <div className="validation-warning-banner">
            {warnings.map((w, idx) => (
              <div key={idx} className="validation-warning-item">
                <AlertIcon />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Data *</label>
              <input type="date" className="form-input" required
                value={form.event_date} onChange={e => set('event_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Horário *</label>
              <input type="time" className="form-input" required
                value={form.time} onChange={e => set('time', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Local *</label>
            <select className="form-select" value={form.local} onChange={e => set('local', e.target.value)}>
              {LOCAIS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Evento *</label>
            <select className="form-select" value={form.event_type}
              onChange={e => { set('event_type', e.target.value); if (e.target.value !== 'Ensaio') set('is_parcial', false); }}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {form.event_type === 'Ensaio' && (
            <div className="form-group">
              <label className="form-label">É Parcial?</label>
              <div className="toggle-group">
                <button type="button" className={`toggle-btn ${form.is_parcial ? 'active' : ''}`}
                  onClick={() => set('is_parcial', true)}>Sim</button>
                <button type="button" className={`toggle-btn ${!form.is_parcial ? 'active' : ''}`}
                  onClick={() => set('is_parcial', false)}>Não</button>
              </div>
            </div>
          )}

          {isEarlyInMonth && (
            <div className="form-group">
              <label className="form-label">Sair na lista de {prevMonthName}?</label>
              <div className="toggle-group">
                <button type="button" className={`toggle-btn ${form.show_in_prev_month ? 'active' : ''}`}
                  onClick={() => set('show_in_prev_month', true)}>Sim</button>
                <button type="button" className={`toggle-btn ${!form.show_in_prev_month ? 'active' : ''}`}
                  onClick={() => set('show_in_prev_month', false)}>Não</button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Observação <span style={{color:'var(--text-muted)'}}>— opcional</span></label>
            <textarea className="form-textarea" placeholder="Ex: Atendimento Irmão Leandro de Icaraíma"
              value={form.observation} onChange={e => set('observation', e.target.value)} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-blue" disabled={saving}>
              {saving ? '...' : isEdit ? 'Salvar alterações' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Print Preview ────────────────────────────────────────────────────────────
function PrintPreview({ events, month, year, onClose }) {
  const monthName = MONTHS[month - 1];

  const grouped = {};
  SECTION_ORDER.forEach(s => { grouped[s] = []; });
  events.forEach(ev => {
    const s = SECTIONS[ev.event_type] || 'ENSAIOS MENSAIS';
    if (grouped[s]) grouped[s].push(ev);
    else grouped[s] = [ev];
  });
  SECTION_ORDER.forEach(s => {
    grouped[s].sort((a, b) => a.event_date.localeCompare(b.event_date));
  });

  const handlePrint = () => {
    window.print();
  };

  const Col = () => (
    <div className="print-column">
      <div className="print-header">
        <div className="print-church">Congregação Cristã no Brasil</div>
        <div className="print-region">Região de Iporã-PR.</div>
        <div className="print-list-title">Lista de Missões - {monthName.toUpperCase()} {year}</div>
      </div>

      {SECTION_ORDER.map(section => {
        const evs = grouped[section];
        if (!evs || evs.length === 0) return null;
        return (
          <div key={section}>
            <div className="print-section-title">{section}</div>
            {evs.map(ev => (
              <div key={ev.id} className="print-event">{buildEventLabel(ev)}</div>
            ))}
          </div>
        );
      })}

      <div className="print-footer" style={{ textTransform: 'none', marginBottom: '4px' }}>Culto de Jovens todos os domingos às 10:00 em Iporã</div>
      <div className="print-footer">Coletas todos os dias de culto</div>
    </div>
  );

  return (
    <div className="print-preview-overlay">
      <div className="print-preview-bar no-print">
        <span>Visualização de Impressão — {monthName} {year}</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-blue" onClick={handlePrint}>
            <Printer /> Imprimir (Ctrl+P)
          </button>
          <button className="btn btn-outline" style={{ color: 'white', borderColor: '#475569', background: '#334155' }} onClick={onClose}>
            <X /> Fechar
          </button>
        </div>
      </div>

      <div className="print-page">
        <Col />
        <Col />
        <Col />
      </div>
    </div>
  );
}

// ─── Month Editor ─────────────────────────────────────────────────────────────
function MonthEditor({ month, year, events, allEvents, onSave, onDelete, onBack }) {
  const [modal, setModal] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [viewTab, setViewTab] = useState('list');
  const [copying, setCopying] = useState(false);
  const calendarRef = useRef(null);
 
  const handleDownloadImage = async () => {
    if (!calendarRef.current) return;
    try {
      const canvas = await html2canvas(calendarRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: document.body.className === 'dark' ? '#1e293b' : '#ffffff',
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `calendario_${monthName.toLowerCase()}_2026.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar imagem.');
    }
  };

  const monthName = MONTHS[month - 1];

  const grouped = {};
  SECTION_ORDER.forEach(s => { grouped[s] = []; });
  events.forEach(ev => {
    const s = SECTIONS[ev.event_type] || 'ENSAIOS MENSAIS';
    if (!grouped[s]) grouped[s] = [];
    grouped[s].push(ev);
  });

  SECTION_ORDER.forEach(s => {
    grouped[s].sort((a,b) => a.event_date.localeCompare(b.event_date));
  });

  const handleCopyPreviousMonth = async () => {
    const prevMonthEvents = allEvents.filter(e => e.month === month - 1);
    if (prevMonthEvents.length === 0) {
      alert('Nenhum evento encontrado no mês anterior para copiar.');
      return;
    }
    if (!confirm(`Deseja copiar ${prevMonthEvents.length} eventos de ${MONTHS[month - 2]} para este mês?`)) return;

    setCopying(true);
    try {
      const maxDays = new Date(year, month, 0).getDate();
      for (const ev of prevMonthEvents) {
        const [y, m, d] = ev.event_date.split('-');
        const targetDay = Math.min(parseInt(d), maxDays);
        const targetDate = `${year}-${String(month).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
        
        const section = SECTIONS[ev.event_type] || 'ENSAIOS MENSAIS';
        await onSave({
          event_date: targetDate,
          time: ev.time,
          local: ev.local,
          event_type: ev.event_type,
          is_parcial: ev.is_parcial,
          observation: ev.observation === '__seeded__' ? '' : ev.observation,
          section,
          month,
          year
        });
      }
    } catch (err) {
      alert('Erro ao copiar eventos: ' + err.message);
    } finally {
      setCopying(false);
    }
  };

  const renderCalendarGrid = () => {
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const cells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => {
        const clean = e.event_date.includes('T') ? e.event_date.split('T')[0] : e.event_date;
        return clean === dateStr;
      });
      const isToday = dateStr === todayStr;

      cells.push(
        <div 
          key={`day-${day}`} 
          className={`calendar-cell ${isToday ? 'today' : ''}`}
          onClick={() => setModal({ mode: 'add', event: { event_date: dateStr } })}
        >
          <div className="calendar-cell-header">
            <span className="calendar-day-num">{day}</span>
          </div>
          <div className="calendar-cell-events">
            {dayEvents.map(ev => {
              const badge = getSectionBadge(ev);
              return (
                <div 
                  key={ev.id} 
                  className={`calendar-event-tag tag-${badge || 'custom'}`}
                  title={`${ev.event_type} - ${ev.local} (${ev.time})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setModal({ mode: 'edit', event: ev });
                  }}
                >
                  {ev.time} {ev.local}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
          {weekdays.map(d => <div key={d} className="calendar-weekday-header">{d}</div>)}
        </div>
        <div className="calendar-grid">
          {cells}
        </div>
      </div>
    );
  };

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft /> Visão Geral
      </button>

      <div className="month-actions">
        <div>
          <h1 className="page-title">{monthName} {year}</h1>
          <p className="page-subtitle">{events.length} evento{events.length !== 1 ? 's' : ''} cadastrado{events.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="btn-group">
          {events.length === 0 && month > 1 && (
            <button className="btn btn-outline" onClick={handleCopyPreviousMonth} disabled={copying}>
              {copying ? 'Copiando...' : `Copiar de ${MONTHS[month - 2]}`}
            </button>
          )}
          <button className="btn btn-outline" onClick={() => setShowPrint(true)}>
            <Printer /> Visualizar Impressão
          </button>
          <button className="btn btn-primary" onClick={() => setModal({ mode: 'add', event: null })}>
            <Plus /> Novo Evento
          </button>
        </div>
      </div>

      {events.length > 0 && (
        <div className="view-tabs">
          <button className={`view-tab ${viewTab === 'list' ? 'active' : ''}`} onClick={() => setViewTab('list')}>
            Lista
          </button>
          <button className={`view-tab ${viewTab === 'calendar' ? 'active' : ''}`} onClick={() => setViewTab('calendar')}>
            Grade Mensal
          </button>
        </div>
      )}

      {viewTab === 'calendar' && events.length > 0 ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }} className="no-print">
            <button className="btn btn-outline" onClick={handleDownloadImage} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DownloadIcon /> Baixar Calendário (Imagem)
            </button>
          </div>
 
          <div ref={calendarRef} className="calendar-capture-container">
            <div className="calendar-capture-header">
              <div>
                <h2 className="calendar-capture-title">{monthName} {year}</h2>
                <div className="calendar-capture-subtitle">CCB Região de Iporã-PR — Agenda Mensal</div>
              </div>
              <div className="calendar-capture-legend">
                <div className="legend-item"><span className="legend-dot dot-local"></span> Ensaio Local</div>
                <div className="legend-item"><span className="legend-dot dot-parcial"></span> Ensaio Parcial</div>
                <div className="legend-item"><span className="legend-dot dot-regional"></span> Ensaio Regional</div>
                <div className="legend-item"><span className="legend-dot dot-culto"></span> Culto</div>
                <div className="legend-item"><span className="legend-dot dot-jovens"></span> Jovens / Mocidade</div>
              </div>
            </div>
            {renderCalendarGrid()}
          </div>
        </div>
      ) : (
        SECTION_ORDER.map(section => {
          const sectionEvents = grouped[section];
          if (!sectionEvents || sectionEvents.length === 0) return null;

          return (
            <div key={section} className="section-block">
              <div className="section-header">
                <span className="section-title">{section}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sectionEvents.length} evento{sectionEvents.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="event-list">
                {sectionEvents.map(ev => {
                  const badge = getSectionBadge(ev);
                  const label = buildEventLabel(ev);
                  const warnings = checkRuleViolations(ev, allEvents);
                  return (
                    <div key={ev.id} className="event-row">
                      <span className="event-date">{formatDate(ev.event_date)}</span>
                      <span className="event-time">{ev.time}</span>
                      <span className="event-desc">
                        {label.replace(formatDate(ev.event_date) + ' ', '').replace(` ${ev.time} h`, '').replace(` - ${ev.observation}`, '')}
                        {ev.observation && ev.observation !== '__seeded__' && (
                          <span className="event-obs"> - {ev.observation}</span>
                        )}
                        {warnings.length > 0 && (
                          <span className="event-row-warning-indicator" title={warnings.join('\n')}>
                            <AlertIcon size={14} />
                          </span>
                        )}
                      </span>
                      {badge && (
                        <span className={`event-badge badge-${badge}`}>
                          {badge === 'parcial' ? 'Parcial' : badge === 'regional' ? 'Regional' : ev.event_type}
                        </span>
                      )}
                      <div className="event-actions">
                        <button className="btn btn-ghost btn-sm btn-icon" title="Editar"
                          onClick={() => setModal({ mode: 'edit', event: ev })}>
                          <Pencil />
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" title="Excluir"
                          onClick={() => onDelete(ev.id)}>
                          <Trash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {events.length === 0 && (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p>Nenhum evento cadastrado neste mês.</p>
          <button className="btn btn-primary" style={{ marginTop: '12px' }}
            onClick={() => setModal({ mode: 'add', event: null })}>
            <Plus /> Adicionar primeiro evento
          </button>
        </div>
      )}

      {modal && (
        <EventModal
          event={modal.event}
          month={month}
          year={year}
          allEvents={allEvents}
          onClose={() => setModal(null)}
          onSave={onSave}
        />
      )}

      {showPrint && (
        <PrintPreview
          events={events}
          month={month}
          year={year}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}

// ─── Year Dashboard ────────────────────────────────────────────────────────────
function YearDashboard({ events, onSelectMonth, onResetSchedule }) {
  let countEnsaios = 0;
  let countCultos = 0;
  let countMocidade = 0;

  events.forEach(ev => {
    if (ev.event_type === 'Ensaio' || ev.event_type === 'Ensaio Regional') {
      countEnsaios++;
    } else if (ev.event_type === 'Culto Unificado' || ev.event_type === 'Culto de Evangelização') {
      countCultos++;
    } else if (ev.event_type === 'Reunião de Mocidade') {
      countMocidade++;
    }
  });

  const countsByMonth = {};
  Array.from({ length: 12 }, (_, i) => i + 1).forEach(m => { countsByMonth[m] = 0; });
  events.forEach(ev => {
    if (countsByMonth[ev.month] !== undefined) {
      countsByMonth[ev.month]++;
    }
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = events
    .filter(ev => ev.event_date >= todayStr)
    .slice(0, 5);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Painel Geral {CURRENT_YEAR}</h1>
          <p className="page-subtitle">Congregação Cristã no Brasil — Região de Iporã-PR</p>
        </div>
        <button className="btn btn-primary" onClick={onCreateEvent} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus /> Novo Evento
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{events.length}</span>
            <span className="stat-label">Total de Eventos</span>
          </div>
          <div className="stat-icon blue">
            <TotalEventsIcon />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{countEnsaios}</span>
            <span className="stat-label">Ensaios</span>
          </div>
          <div className="stat-icon amber">
            <EnsaioIcon />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{countCultos}</span>
            <span className="stat-label">Cultos</span>
          </div>
          <div className="stat-icon green">
            <CultoIcon />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{countMocidade}</span>
            <span className="stat-label">Mocidade</span>
          </div>
          <div className="stat-icon purple">
            <MocidadeIcon />
          </div>
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <div className="upcoming-events-section">
          <h2 className="upcoming-events-title">
            <CalendarIcon />
            Próximos Eventos
          </h2>
          <div className="upcoming-events-list">
            {upcomingEvents.map(ev => {
              const badge = getSectionBadge(ev);
              return (
                <div 
                  key={ev.id} 
                  className="upcoming-event-item"
                  onClick={() => onSelectMonth(ev.month)}
                >
                  <div className="upcoming-event-info">
                    <span className="upcoming-event-date-badge">
                      {formatDate(ev.event_date)}
                    </span>
                    <div className="upcoming-event-details">
                      <span className="upcoming-event-name">{ev.local}</span>
                      <span className="upcoming-event-meta">
                        {ev.event_type === 'Ensaio' ? (ev.is_parcial ? 'Ensaio Parcial' : 'Ensaio Local') : ev.event_type} às {ev.time} h
                        {ev.observation && ev.observation !== '__seeded__' && ` - ${ev.observation}`}
                      </span>
                    </div>
                  </div>
                  {badge && (
                    <span className={`event-badge badge-${badge}`}>
                      {badge === 'parcial' ? 'Parcial' : badge === 'regional' ? 'Regional' : ev.event_type}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="months-grid">
        {MONTHS.map((name, i) => {
          const m = i + 1;
          const count = countsByMonth[m] || 0;
          return (
            <div key={m} className="month-card" onClick={() => onSelectMonth(m)}>
              <div>
                <div className="month-card-name">{name}</div>
                <div className="month-card-count">
                  {count === 0 ? 'Nenhum evento cadastrado' : `${count} evento${count !== 1 ? 's' : ''}`}
                </div>
              </div>
              {count > 0 && (
                <div className="month-card-badge">Ativo</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Search Results View ───────────────────────────────────────────────────────
function SearchResults({ searchTerm, events, allEvents, onSelectMonth, onSave, onDelete, onClear }) {
  const filtered = events.filter(ev => {
    const term = searchTerm.toLowerCase();
    const typeStr = ev.event_type.toLowerCase();
    const localStr = ev.local.toLowerCase();
    const obsStr = (ev.observation || '').toLowerCase();
    return typeStr.includes(term) || localStr.includes(term) || obsStr.includes(term);
  });

  const [modal, setModal] = useState(null);

  const grouped = {};
  filtered.forEach(ev => {
    if (!grouped[ev.month]) grouped[ev.month] = [];
    grouped[ev.month].push(ev);
  });

  const sortedMonths = Object.keys(grouped).map(Number).sort((a,b) => a - b);

  return (
    <div>
      <div className="search-results-header">
        <button className="back-btn" onClick={onClear}>
          <ChevronLeft /> Voltar
        </button>
        <h1 className="page-title">Resultados de Busca</h1>
        <p className="page-subtitle">Exibindo {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{searchTerm}"</p>
      </div>

      {sortedMonths.length > 0 ? (
        sortedMonths.map(m => (
          <div key={m} className="section-block">
            <div className="section-header" style={{ cursor: 'pointer' }} onClick={() => onSelectMonth(m)}>
              <span className="section-title" style={{ color: 'var(--accent-blue)' }}>{MONTHS[m - 1]}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{grouped[m].length} evento{grouped[m].length !== 1 ? 's' : ''}</span>
            </div>
            <div className="event-list">
              {grouped[m].map(ev => {
                const badge = getSectionBadge(ev);
                const label = buildEventLabel(ev);
                const warnings = checkRuleViolations(ev, allEvents);
                return (
                  <div key={ev.id} className="event-row">
                    <span className="event-date">{formatDate(ev.event_date)}</span>
                    <span className="event-time">{ev.time}</span>
                    <span className="event-desc">
                      {label.replace(formatDate(ev.event_date) + ' ', '').replace(` ${ev.time} h`, '').replace(` - ${ev.observation}`, '')}
                      {ev.observation && ev.observation !== '__seeded__' && (
                        <span className="event-obs"> - {ev.observation}</span>
                      )}
                      {warnings.length > 0 && (
                        <span className="event-row-warning-indicator" title={warnings.join('\n')}>
                          <AlertIcon size={14} />
                        </span>
                      )}
                    </span>
                    {badge && (
                      <span className={`event-badge badge-${badge}`}>
                        {badge === 'parcial' ? 'Parcial' : badge === 'regional' ? 'Regional' : ev.event_type}
                      </span>
                    )}
                    <div className="event-actions">
                      <button className="btn btn-ghost btn-sm btn-icon" title="Editar"
                        onClick={() => setModal({ mode: 'edit', event: ev })}>
                        <Pencil />
                      </button>
                      <button className="btn btn-danger btn-sm btn-icon" title="Excluir"
                        onClick={() => onDelete(ev.id)}>
                        <Trash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p>Nenhum evento correspondente encontrado.</p>
        </div>
      )}

      {modal && (
        <EventModal
          event={modal.event}
          month={modal.event.month}
          year={modal.event.year}
          allEvents={allEvents}
          onClose={() => setModal(null)}
          onSave={onSave}
        />
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark' : '';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await fetchAllEvents(CURRENT_YEAR);
      setEvents(data);
    } catch (err) {
      setToast('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Rola para o topo sempre que mudar o mês selecionado ou houver alteração na busca
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const workspace = document.querySelector('.main-workspace');
    if (workspace) {
      workspace.scrollTo({ top: 0 });
    }
  }, [selectedMonth, searchTerm]);

  const handleSave = async (form) => {
    try {
      if (form.id) {
        const updated = await updateEvent(form);
        setEvents(prev => prev.map(e => e.id === updated.id ? updated : e).sort((a,b) => a.event_date.localeCompare(b.event_date)));
        setToast('Evento atualizado com sucesso!');
      } else {
        const created = await createEvent(form);
        setEvents(prev => [...prev, created].sort((a,b) => a.event_date.localeCompare(b.event_date)));
        setToast('Evento cadastrado com sucesso!');
      }
    } catch (err) {
      setToast('Erro: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    try {
      await deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      setToast('Evento excluído com sucesso!');
    } catch (err) {
      setToast('Erro: ' + err.message);
    }
  };

  const handleResetSchedule = async () => {
    if (!confirm('Esta ação redefinirá a agenda padrão regional de 2026. Deseja prosseguir?')) return;
    setLoading(true);
    try {
      await runSetup();
      const data = await fetchAllEvents(CURRENT_YEAR);
      setEvents(data);
      setToast('Calendário padrão restaurado!');
    } catch (err) {
      setToast('Erro ao restaurar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const countsByMonth = {};
  Array.from({ length: 12 }, (_, i) => i + 1).forEach(m => { countsByMonth[m] = 0; });
  events.forEach(ev => {
    if (countsByMonth[ev.month] !== undefined) {
      countsByMonth[ev.month]++;
    }
  });

  const activeMonthName = selectedMonth ? MONTHS[selectedMonth - 1] : '';

  return (
    <div className="app">
      <div className="main-workspace">
        <header className="workspace-header">
          <div className="header-left">
            <div className="header-search-wrapper no-print">
              <span className="header-search-icon">
                <SearchIcon size={14} />
              </span>
              <input 
                type="text" 
                placeholder="Buscar evento..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
 
          <div className="header-right no-print">
            <button 
              className="btn btn-ghost btn-sm btn-icon" 
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
            >
              {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
            </button>
            
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">Administrador</span>
                <span className="user-role">CCB Iporã-PR</span>
              </div>
              <div className="user-avatar">ADM</div>
            </div>
          </div>
        </header>
 
        <header className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                className="btn btn-ghost btn-sm btn-icon" 
                onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                style={{ padding: '4px' }}
              >
                {theme === 'light' ? <MoonIcon size={14} /> : <SunIcon size={14} />}
              </button>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>
                  {searchTerm ? 'Busca' : selectedMonth ? activeMonthName : 'Visão Geral'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  CCB Iporã-PR
                </div>
              </div>
            </div>
            {selectedMonth !== null && (
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMonth(null)} style={{ fontSize: '11px' }}>
                Painel
              </button>
            )}
          </div>
        </header>
 
        <main className="main-body">
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
              <div className="spinner" />
            </div>
          ) : searchTerm ? (
            <SearchResults
              searchTerm={searchTerm}
              events={events}
              allEvents={events}
              onSelectMonth={(m) => { setSelectedMonth(m); setSearchTerm(''); }}
              onSave={handleSave}
              onDelete={handleDelete}
              onClear={() => setSearchTerm('')}
            />
          ) : selectedMonth === null ? (
            <YearDashboard 
              events={events} 
              onSelectMonth={setSelectedMonth} 
              onResetSchedule={handleResetSchedule}
              onCreateEvent={() => setModal({ mode: 'add', event: { month: new Date().getMonth() + 1, year: CURRENT_YEAR, event_date: new Date().toISOString().split('T')[0] } })}
            />
          ) : (
            <MonthEditor 
              month={selectedMonth} 
              year={CURRENT_YEAR} 
              events={events.filter(e => {
                if (e.month === selectedMonth) return true;
                const isNextMonth = e.month === selectedMonth + 1 || (selectedMonth === 12 && e.month === 1);
                if (isNextMonth && e.show_in_prev_month) return true;
                return false;
              })}
              allEvents={events}
              onSave={handleSave}
              onDelete={handleDelete}
              onBack={() => setSelectedMonth(null)}
            />
          )
        }
      </main>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
