import { useState, useEffect } from 'react';
import { MONTHS, YEAR, SECTION_ORDER, SECTIONS, EVENT_TYPES, LOCAIS, YEAR as CURRENT_YEAR,
         formatDate, buildEventLabel, getSectionBadge } from './constants';
import { fetchEvents, createEvent, updateEvent, deleteEvent } from './api';

// ─── Icons (inline SVG components) ──────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ChevronLeft = () => <Icon d="M15 18l-6-6 6-6" />;
const Plus = () => <Icon d="M12 5v14M5 12h14" />;
const Pencil = () => <Icon d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />;
const Trash = () => <Icon d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />;
const Printer = () => <Icon d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />;
const X = () => <Icon d="M18 6L6 18M6 6l12 12" />;
const Calendar = () => <Icon d="M3 4h18v18H3zM16 2v4M8 2v4M3 10h18" />;

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return <div className="toast">{message}</div>;
}

// ─── Event Modal ─────────────────────────────────────────────────────────────
function EventModal({ event, month, year, onClose, onSave }) {
  const isEdit = !!event?.id;
  const defaultDate = `${year}-${String(month).padStart(2,'0')}-01`;

  const [form, setForm] = useState({
    event_date: event?.event_date || defaultDate,
    time: event?.time || '19:30',
    local: event?.local || LOCAIS[2],
    event_type: event?.event_type || 'Ensaio',
    is_parcial: event?.is_parcial ?? false,
    observation: (event?.observation && event.observation !== '__seeded__') ? event.observation : '',
  });

  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const section = SECTIONS[form.event_type] || 'ENSAIOS MENSAIS';
      if (isEdit) {
        await onSave({ ...form, id: event.id, section });
      } else {
        await onSave({ ...form, section, month, year });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{isEdit ? 'Editar Evento' : 'Novo Evento'}</h2>
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
        <div className="print-list-title">Lista de Missões- {monthName.toUpperCase()} {year}</div>
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
          <button className="btn btn-outline" style={{ color: 'white', borderColor: '#666' }} onClick={onClose}>
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
function MonthEditor({ month, year, onBack }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', event }
  const [showPrint, setShowPrint] = useState(false);
  const [toast, setToast] = useState(null);

  const monthName = MONTHS[month - 1];

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchEvents(month, year);
      setEvents(data);
    } catch (err) {
      setToast('Erro ao carregar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]);

  const handleSave = async (form) => {
    try {
      if (form.id) {
        const updated = await updateEvent(form);
        setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
        setToast('Evento atualizado!');
      } else {
        const created = await createEvent(form);
        setEvents(prev => [...prev, created].sort((a,b) => a.event_date.localeCompare(b.event_date)));
        setToast('Evento adicionado!');
      }
      setModal(null);
    } catch (err) {
      setToast('Erro: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir este evento?')) return;
    try {
      await deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
      setToast('Evento excluído!');
    } catch (err) {
      setToast('Erro: ' + err.message);
    }
  };

  // Group events by section
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

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft /> Voltar
      </button>

      <div className="month-actions">
        <div>
          <h1 className="page-title">{monthName} {year}</h1>
          <p className="page-subtitle">{events.length} evento{events.length !== 1 ? 's' : ''} cadastrado{events.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-outline" onClick={() => setShowPrint(true)}>
            <Printer /> Visualizar Impressão
          </button>
          <button className="btn btn-primary" onClick={() => setModal({ mode: 'add', event: null })}>
            <Plus /> Novo Evento
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner" /></div>}

      {!loading && SECTION_ORDER.map(section => {
        const sectionEvents = grouped[section];
        if (!sectionEvents || sectionEvents.length === 0) return null;

        return (
          <div key={section} className="section-block">
            <div className="section-header">
              <span className="section-title">{section}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sectionEvents.length} evento{sectionEvents.length !== 1 ? 's' : ''}</span>
            </div>

            {sectionEvents.map(ev => {
              const badge = getSectionBadge(ev);
              const label = buildEventLabel(ev);
              return (
                <div key={ev.id} className="event-row">
                  <span className="event-date">{formatDate(ev.event_date)}</span>
                  <span className="event-time">{ev.time}</span>
                  <span className="event-desc">
                    {label.replace(formatDate(ev.event_date) + ' ', '').replace(` ${ev.time} h`, '').replace(` — ${ev.observation}`, '')}
                    {ev.observation && ev.observation !== '__seeded__' && (
                      <span className="event-obs"> — {ev.observation}</span>
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
                      onClick={() => handleDelete(ev.id)}>
                      <Trash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {!loading && events.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
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
          onClose={() => setModal(null)}
          onSave={handleSave}
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

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── Year Dashboard ────────────────────────────────────────────────────────────
function YearDashboard({ onSelectMonth }) {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      const results = {};
      await Promise.all(
        Array.from({ length: 12 }, (_, i) => i + 1).map(async (m) => {
          try {
            const data = await fetchEvents(m, CURRENT_YEAR);
            results[m] = data.length;
          } catch {
            results[m] = 0;
          }
        })
      );
      setCounts(results);
      setLoading(false);
    };
    loadAll();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Listas de Missões {CURRENT_YEAR}</h1>
        <p className="page-subtitle">Congregação Cristã no Brasil — Região de Iporã-PR</p>
      </div>

      <div className="months-grid">
        {MONTHS.map((name, i) => {
          const m = i + 1;
          const count = counts[m] ?? 0;
          return (
            <div key={m} className="month-card" onClick={() => onSelectMonth(m)}>
              <div className="month-card-name">{name}</div>
              <div className="month-card-count">
                {loading ? '...' : `${count} evento${count !== 1 ? 's' : ''}`}
              </div>
              {!loading && count > 0 && (
                <div className="month-card-badge">{count}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedMonth, setSelectedMonth] = useState(null);

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">CCB</div>
          <div>
            <div className="header-title">Lista de Missões</div>
            <div className="header-subtitle">Região de Iporã-PR</div>
          </div>
        </div>
        {selectedMonth && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMonth(null)}>
            <ChevronLeft /> Todos os meses
          </button>
        )}
      </header>

      <main className="main">
        {selectedMonth === null
          ? <YearDashboard onSelectMonth={setSelectedMonth} />
          : <MonthEditor month={selectedMonth} year={CURRENT_YEAR} onBack={() => setSelectedMonth(null)} />
        }
      </main>
    </div>
  );
}
