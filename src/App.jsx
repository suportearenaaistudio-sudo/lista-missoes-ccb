import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { MONTHS, SECTION_ORDER, SECTIONS, EVENT_TYPES, LOCAIS, YEAR as CURRENT_YEAR,
         formatDate, buildEventLabel, buildEventDescription, getSectionBadge, getBadgeLabel, checkRuleViolations, cleanLocalName } from './constants';
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
const ChevronRight = () => <Icon d="M9 18l6-6-6-6" />;
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

const ZapIcon = ({ size = 16 }) => <Icon size={size} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
const BarChartIcon = ({ size = 16 }) => <Icon size={size} d="M18 20V10M12 20V4M6 20v-6" />;
const CheckCircleIcon = ({ size = 16 }) => <Icon size={size} d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" />;
const SparklesIcon = ({ size = 16 }) => <Icon size={size} d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />;
const MusicIcon = ({ size = 16 }) => <Icon size={size} d="M9 18V5l12-2v13M9 9l12-2" />;
const ShareIcon = ({ size = 16 }) => <Icon size={size} d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98" />;
const TextSizeIcon = ({ size = 16 }) => <Icon size={size} d="M4 7V4h16v3M9 4v16M15 4v16" />;
const RotateCcwIcon = ({ size = 16 }) => <Icon size={size} d="M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />;

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

// ─── Custom Modal de Confirmação & Alerta ──────────────────────────────────────
function ConfirmModal({ 
  title = "Confirmação", 
  message, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar", 
  isDanger = false,
  onConfirm, 
  onClose 
}) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '420px', textAlign: 'center', padding: '28px 24px' }}>
        <div style={{ 
          width: '52px', 
          height: '52px', 
          borderRadius: '50%', 
          background: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
          color: isDanger ? 'var(--accent-red)' : 'var(--accent-blue)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 16px auto' 
        }}>
          {isDanger ? <AlertIcon size={26} /> : <ZapIcon size={26} />}
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
          {title}
        </h3>

        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 24px 0' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          {cancelText && (
            <button className="btn btn-outline" onClick={onClose} style={{ flex: 1, padding: '10px 14px' }}>
              {cancelText}
            </button>
          )}
          <button 
            className="btn" 
            onClick={() => { if (onConfirm) onConfirm(); onClose(); }}
            style={{ 
              flex: 1, 
              padding: '10px 14px',
              background: isDanger ? 'var(--accent-red)' : 'var(--accent-blue)',
              borderColor: isDanger ? 'var(--accent-red)' : 'var(--accent-blue)',
              color: '#fff',
              fontWeight: 600
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
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
// ─── Print Preview ────────────────────────────────────────────────────────────
function PrintPreview({ events, month, year, onClose }) {
  const monthName = MONTHS[month - 1];
  const [copies, setCopies] = useState(1);

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

  const pageCopies = Array.from({ length: Math.max(1, copies) });

  return (
    <div className="print-preview-overlay">
      <div className="print-preview-bar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>Impressão — {monthName} {year}</span>
          
          {/* Seletor de Quantidade de Folhas */}
          <div className="copies-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#334155', padding: '4px 12px', borderRadius: '10px', border: '1px solid #475569' }}>
            <span style={{ fontSize: '12.5px', color: '#cbd5e1', fontWeight: 600 }}>Quantidade de Folhas:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button 
                type="button"
                className="btn btn-ghost btn-sm" 
                onClick={() => setCopies(c => Math.max(1, c - 1))}
                style={{ color: '#fff', padding: '2px 8px', fontSize: '14px', fontWeight: 700, minWidth: '28px', background: '#1e293b' }}
                title="Diminuir 1 folha"
              >
                -
              </button>
              <input 
                type="number" 
                min="1" 
                max="50" 
                value={copies} 
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: '48px', textAlign: 'center', background: '#0f172a', color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '4px 0', fontSize: '13.5px', fontWeight: 700 }}
              />
              <button 
                type="button"
                className="btn btn-ghost btn-sm" 
                onClick={() => setCopies(c => Math.min(50, c + 1))}
                style={{ color: '#fff', padding: '2px 8px', fontSize: '14px', fontWeight: 700, minWidth: '28px', background: '#1e293b' }}
                title="Aumentar 1 folha"
              >
                +
              </button>
            </div>
            <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
              <button type="button" className={`btn btn-sm ${copies === 5 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCopies(5)} style={{ fontSize: '11px', padding: '2px 6px', color: '#fff' }}>5x</button>
              <button type="button" className={`btn btn-sm ${copies === 10 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCopies(10)} style={{ fontSize: '11px', padding: '2px 6px', color: '#fff' }}>10x</button>
              <button type="button" className={`btn btn-sm ${copies === 15 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCopies(15)} style={{ fontSize: '11px', padding: '2px 6px', color: '#fff' }}>15x</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn btn-blue" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, padding: '8px 16px' }}>
            <Printer /> Imprimir {copies} {copies === 1 ? 'Folha' : 'Folhas'}
          </button>
          <button className="btn btn-outline" style={{ color: 'white', borderColor: '#475569', background: '#334155' }} onClick={onClose}>
            <X /> Fechar
          </button>
        </div>
      </div>

      <div className="print-pages-container">
        {pageCopies.map((_, index) => (
          <div key={index} className="print-page">
            <Col />
            <Col />
            <Col />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal para Clonar Agenda de Qualquer Mês para Qualquer Mês ───────────
function CloneMonthModal({ defaultTargetMonth, targetYear, allEvents, onClose, onClone }) {
  const [sourceMonth, setSourceMonth] = useState((defaultTargetMonth === 1 ? 12 : (defaultTargetMonth || 1) - 1) || 1);
  const [sourceYear, setSourceYear] = useState(defaultTargetMonth === 1 ? targetYear - 1 : targetYear);
  
  const [targetMonth, setTargetMonth] = useState(defaultTargetMonth || 1);
  const [targetYearVal, setTargetYearVal] = useState(targetYear);

  const [cloning, setCloning] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const sourceEvents = allEvents.filter(e => e.month === sourceMonth && e.year === sourceYear);

  const handleExecuteClone = async () => {
    if (sourceEvents.length === 0) return;
    setCloning(true);
    try {
      await onClone(sourceMonth, sourceYear, targetMonth, targetYearVal, sourceEvents);
      onClose();
    } catch (err) {
      setConfirmDialog({
        title: 'Erro ao Clonar',
        message: err.message,
        confirmText: 'OK',
        cancelText: null,
        isDanger: true
      });
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Clonar Agenda entre Meses</h2>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
          Escolha o mês de <strong>origem</strong> e o mês de <strong>destino</strong> para duplicar a agenda:
        </p>

        {/* Origem */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Copiar De (Origem):
          </span>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Mês</label>
              <select className="form-select" value={sourceMonth} onChange={e => setSourceMonth(parseInt(e.target.value))}>
                {MONTHS.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Ano</label>
              <select className="form-select" value={sourceYear} onChange={e => setSourceYear(parseInt(e.target.value))}>
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Destino */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Copiar Para (Destino):
          </span>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Mês</label>
              <select className="form-select" value={targetMonth} onChange={e => setTargetMonth(parseInt(e.target.value))}>
                {MONTHS.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Ano</label>
              <select className="form-select" value={targetYearVal} onChange={e => setTargetYearVal(parseInt(e.target.value))}>
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ 
          background: 'var(--surface-hover)', 
          border: '1px solid var(--border)', 
          borderRadius: '12px', 
          padding: '14px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {sourceEvents.length > 0 ? (
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--accent-green)' }}>
              ✓ {sourceEvents.length} evento{sourceEvents.length !== 1 ? 's' : ''} em {MONTHS[sourceMonth - 1]}/{sourceYear} → {MONTHS[targetMonth - 1]}/{targetYearVal}
            </span>
          ) : (
            <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              Nenhum evento encontrado em {MONTHS[sourceMonth - 1]} {sourceYear}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={cloning}>
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleExecuteClone} 
            disabled={cloning || sourceEvents.length === 0}
          >
            {cloning ? 'Clonando...' : `Clonar para ${MONTHS[targetMonth - 1]}`}
          </button>
        </div>

        {confirmDialog && (
          <ConfirmModal
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmText={confirmDialog.confirmText}
            cancelText={confirmDialog.cancelText}
            isDanger={confirmDialog.isDanger}
            onConfirm={confirmDialog.onConfirm}
            onClose={() => setConfirmDialog(null)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Modal de Automação de Agenda por Regras Recorrentes em Texto ────────────
const DEFAULT_RULES_ARRAY = [
  'Ensaio em Francisco Alves (1ª Sexta-feira do Mês)',
  'Ensaio Parcial em Nova Santa Helena (2ª Sexta-feira dos Meses Ímpares)',
  'Ensaio Parcial em Vila Nilza (3º Sábado dos Meses Pares)',
  'Ensaio Local em Iporã (3ª Sexta-feira dos Meses Ímpares)',
  'Ensaio de Região em Iporã (3ª Sexta-feira dos Meses Pares)',
  'Ensaio Parcial em Cafezal do Sul (3ª Quinta-feira do Mês)',
  'Ensaio Parcial em Guaiporã (Última Terça-feira do Mês)'
];

function AutoScheduleModal({ targetYear, onClose, onGenerate }) {
  const [ruleInput, setRuleInput] = useState('');
  const [rulesList, setRulesList] = useState(() => {
    try {
      const saved = localStorage.getItem('saved_schedule_rules_array');
      return saved ? JSON.parse(saved) : DEFAULT_RULES_ARRAY;
    } catch (_e) {
      return DEFAULT_RULES_ARRAY;
    }
  });
  const [clearExisting, setClearExisting] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState(null);

  const saveRulesToStorage = (newList) => {
    setRulesList(newList);
    localStorage.setItem('saved_schedule_rules_array', JSON.stringify(newList));
  };

  const handleAddRule = (e) => {
    if (e) e.preventDefault();
    const trimmed = ruleInput.trim();
    if (!trimmed) return;
    const newList = [...rulesList, trimmed];
    saveRulesToStorage(newList);
    setRuleInput('');
  };

  const handleRemoveRule = (indexToRemove) => {
    const newList = rulesList.filter((_, idx) => idx !== indexToRemove);
    saveRulesToStorage(newList);
  };

  const handleResetToDefault = () => {
    setConfirmDialog({
      title: 'Restaurar Modelo Padrão?',
      message: 'Deseja restaurar as 7 regras de modelo padrão da região de Iporã-PR?',
      confirmText: 'Restaurar',
      cancelText: 'Cancelar',
      isDanger: false,
      onConfirm: () => saveRulesToStorage(DEFAULT_RULES_ARRAY)
    });
  };

  const calculateDateForRule = (yearVal, monthVal, freqKey) => {
    const parts = freqKey.split('_');
    const nthMap = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, 'last': -1 };
    const dayMap = { 'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6 };
    
    const nth = nthMap[parts[0]];
    const weekday = dayMap[parts[1]];

    if (nth === undefined || weekday === undefined) return null;

    const daysInMonth = new Date(yearVal, monthVal, 0).getDate();
    const matching = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(yearVal, monthVal - 1, d).getDay() === weekday) {
        matching.push(d);
      }
    }
    const day = nth === -1 ? matching[matching.length - 1] : matching[nth - 1];
    if (!day) return null;
    return `${yearVal}-${String(monthVal).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const parseRuleToEvents = (line, yearVal) => {
    const lower = line.toLowerCase().trim();
    if (!lower) return [];

    let type = 'Ensaio';
    if (lower.includes('culto de jovens') || lower.includes('culto de jovem')) {
      type = 'Culto de Jovens';
    } else if (lower.includes('culto de evangelização') || lower.includes('culto de evangelizacao')) {
      type = 'Culto de Evangelização';
    } else if (lower.includes('culto unificado') || (lower.includes('culto') && !lower.includes('mocidade') && !lower.includes('jovens') && !lower.includes('jovem'))) {
      type = 'Culto Unificado';
    } else if (lower.includes('mocidade') || lower.includes('reunião de mocidade') || lower.includes('reuniao de mocidade')) {
      type = 'Reunião de Mocidade';
    } else if (lower.includes('técnico') || lower.includes('tecnico')) {
      type = 'Ensaio Técnico';
    } else if (lower.includes('regional')) {
      type = 'Ensaio Regional';
    }

    const isParcial = lower.includes('parcial');

    let time = '19:30';
    if (type === 'Culto de Jovens' || type === 'Reunião de Mocidade' || lower.includes('jovens')) time = '19:00';
    const timeMatch = lower.match(/(\d{1,2})[:h](\d{2})?/);
    if (timeMatch) {
      const hh = String(timeMatch[1]).padStart(2, '0');
      const mm = timeMatch[2] || '00';
      time = `${hh}:${mm}`;
    }

    let local = 'Iporã';
    const foundLocal = LOCAIS.find(l => lower.includes(l.toLowerCase()));
    if (foundLocal) {
      local = foundLocal;
    } else {
      const emMatch = lower.match(/\bem ([a-zà-ú\s]+?)(?:\(|\d|$|às|nos|no)/);
      if (emMatch && emMatch[1].trim()) {
        local = cleanLocalName(emMatch[1].trim());
      }
    }

    let weekday = 5; // default friday
    if (lower.includes('domingo')) weekday = 0;
    else if (lower.includes('segunda')) weekday = 1;
    else if (lower.includes('terça') || lower.includes('terca')) weekday = 2;
    else if (lower.includes('quarta')) weekday = 3;
    else if (lower.includes('quinta')) weekday = 4;
    else if (lower.includes('sexta')) weekday = 5;
    else if (lower.includes('sábado') || lower.includes('sabado')) weekday = 6;

    let nth = 1;
    if (lower.includes('2º') || lower.includes('2ª') || lower.includes('segund') || lower.includes('2a') || lower.includes('2o')) nth = 2;
    else if (lower.includes('3º') || lower.includes('3ª') || lower.includes('terceir') || lower.includes('3a') || lower.includes('3o')) nth = 3;
    else if (lower.includes('4º') || lower.includes('4ª') || lower.includes('quart') || lower.includes('4a') || lower.includes('4o')) nth = 4;
    else if (lower.includes('últim') || lower.includes('ultim')) nth = -1;
    else if (lower.includes('todo') || lower.includes('cada')) nth = 0; // every matching weekday

    let monthType = 'all';
    if (/\bímpar(?:es)?\b|\bimpar(?:es)?\b/.test(lower)) {
      monthType = 'odd';
    } else if (/\bpar(?:es)?\b/.test(lower)) {
      monthType = 'even';
    }

    const dayNames = ['sun','mon','tue','wed','thu','fri','sat'];
    const generatedEvents = [];

    for (let m = 1; m <= 12; m++) {
      if (monthType === 'odd' && m % 2 === 0) continue;
      if (monthType === 'even' && m % 2 !== 0) continue;

      if (nth === 0) {
        const daysInMonth = new Date(yearVal, m, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          if (new Date(yearVal, m - 1, d).getDay() === weekday) {
            const eventDate = `${yearVal}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            generatedEvents.push({
              event_date: eventDate,
              time,
              local,
              event_type: type,
              is_parcial: isParcial,
              section: SECTIONS[type] || 'ENSAIOS MENSAIS',
              observation: '',
              month: m,
              year: yearVal
            });
          }
        }
      } else {
        const nthStr = nth === -1 ? 'last' : (nth === 1 ? '1st' : nth === 2 ? '2nd' : nth === 3 ? '3rd' : '4th');
        const freqKey = `${nthStr}_${dayNames[weekday]}`;
        const eventDate = calculateDateForRule(yearVal, m, freqKey);
        if (eventDate) {
          generatedEvents.push({
            event_date: eventDate,
            time,
            local,
            event_type: type,
            is_parcial: isParcial,
            section: SECTIONS[type] || 'ENSAIOS MENSAIS',
            observation: '',
            month: m,
            year: yearVal
          });
        }
      }
    }
    return generatedEvents;
  };

  const allParsedEvents = rulesList.flatMap(ruleText => parseRuleToEvents(ruleText, targetYear));

  const handleExecuteGenerate = async () => {
    if (allParsedEvents.length === 0) return;
    setGenerating(true);
    try {
      await onGenerate(allParsedEvents, clearExisting);
      onClose();
    } catch (err) {
      setConfirmDialog({
        title: 'Erro ao Gerar Agenda',
        message: err.message,
        confirmText: 'Entendido',
        cancelText: null,
        isDanger: true
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ZapIcon size={20} />
            <h2 className="modal-title" style={{ margin: 0 }}>Gerador Automático por Regras ({targetYear})</h2>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
          Digite uma regra em português e pressione <strong>Enter</strong> (ou clique em Adicionar):
        </p>

        {/* Input de Adicionar Regra com Enter */}
        <form onSubmit={handleAddRule} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input 
            type="text" 
            className="form-input" 
            value={ruleInput} 
            onChange={e => setRuleInput(e.target.value)}
            placeholder="Ex: Todo domingo às 10:00 tem culto de jovens em Iporã"
            style={{ flex: 1, fontSize: '13px', padding: '10px 14px' }}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" style={{ fontSize: '13px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={15} /> Adicionar
          </button>
        </form>

        {/* Cabeçalho da Lista de Regras */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Regras na Lista ({rulesList.length}):
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleResetToDefault} style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            Restaurar Modelo Padrão
          </button>
        </div>

        {/* Lista Visual de Regras */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          maxHeight: '220px', 
          overflowY: 'auto', 
          marginBottom: '16px', 
          paddingRight: '4px' 
        }}>
          {rulesList.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '8px' }}>
              Nenhuma regra adicionada ainda. Digite uma regra acima e pressione Enter!
            </div>
          ) : (
            rulesList.map((ruleText, idx) => {
              const ruleEventsCount = parseRuleToEvents(ruleText, targetYear).length;
              return (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justify: 'space-between', 
                  background: 'var(--surface-hover)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  padding: '8px 12px',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                      {ruleText}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                      {ruleEventsCount} eventos
                    </span>
                    <button 
                      className="btn btn-ghost btn-sm btn-icon" 
                      onClick={() => handleRemoveRule(idx)} 
                      style={{ color: 'var(--accent-red)', padding: '4px' }}
                      title="Remover esta regra"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Opção de Substituição de Agenda */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', userSelect: 'none' }}>
          <input 
            type="checkbox" 
            checked={clearExisting} 
            onChange={e => setClearExisting(e.target.checked)} 
            style={{ width: '16px', height: '16px' }}
          />
          <span>Apagar eventos anteriores de {targetYear} antes de gerar os novos (Agenda Limpa)</span>
        </label>

        {/* Resumo do Cálculo ao Vivo */}
        <div style={{ 
          background: 'var(--surface-hover)', 
          border: '1px solid var(--border)', 
          borderRadius: '12px', 
          padding: '14px', 
          marginBottom: '20px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChartIcon size={16} />
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Total: {allParsedEvents.length} eventos calculados para {targetYear}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
              {rulesList.length} regra(s) ativa(s) na lista
            </span>
          </div>
          {allParsedEvents.length > 0 && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-green)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircleIcon size={13} /> Pronto para criar
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={generating}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleExecuteGenerate} disabled={generating || allParsedEvents.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {generating ? 'Criando Eventos...' : <> <SparklesIcon size={15} /> Criar {allParsedEvents.length} Eventos em {targetYear} </>}
          </button>
        </div>

        {confirmDialog && (
          <ConfirmModal
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmText={confirmDialog.confirmText}
            cancelText={confirmDialog.cancelText}
            isDanger={confirmDialog.isDanger}
            onConfirm={confirmDialog.onConfirm}
            onClose={() => setConfirmDialog(null)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Month Editor ─────────────────────────────────────────────────────────────
function MonthEditor({ month, year, events, allEvents, onSave, onDelete, onBack, isAdmin = true, onToast, publicToolbar = null }) {
  const [modal, setModal] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [viewTab, setViewTab] = useState('list');
  const calendarRef = useRef(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [selectedDay, setSelectedDay] = useState(1);

  const handleShareList = async () => {
    const publicUrl = window.location.origin;
    const shareData = {
      title: `Lista de Missões — CCB Região de Iporã-PR`,
      text: `Confira a Lista de Missões oficial da CCB na Região de Iporã-PR:`,
      url: publicUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (_e) {
        try {
          await navigator.clipboard.writeText(publicUrl);
          if (onToast) onToast('Link da Lista de Missões copiado com sucesso!');
        } catch (_err) {
          // fallback
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(publicUrl);
        if (onToast) onToast('Link da Lista de Missões copiado com sucesso!');
      } catch (_err) {
        // fallback
      }
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const today = new Date();
    if (today.getMonth() + 1 === month && today.getFullYear() === year) {
      setSelectedDay(today.getDate());
    } else {
      setSelectedDay(1);
    }
  }, [month, year]);

  const [exportingImage, setExportingImage] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const handleDownloadImage = async () => {
    if (!calendarRef.current) {
      setConfirmDialog({
        title: 'Aviso',
        message: 'Aguarde um instante e tente novamente.',
        confirmText: 'OK',
        cancelText: null
      });
      return;
    }
    setExportingImage(true);
    try {
      const canvas = await html2canvas(calendarRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `agenda_ccb_${monthName.toLowerCase()}_${year}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error(err);
      setConfirmDialog({
        title: 'Erro na Imagem',
        message: 'Erro ao gerar imagem para WhatsApp: ' + err.message,
        confirmText: 'OK',
        cancelText: null,
        isDanger: true
      });
    } finally {
      setExportingImage(false);
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

  const handleCloneFromAnyMonth = async (srcMonth, srcYear, srcEvents) => {
    const maxDays = new Date(year, month, 0).getDate();
    for (const ev of srcEvents) {
      const cleanDate = ev.event_date.includes('T') ? ev.event_date.split('T')[0] : ev.event_date;
      const d = cleanDate.split('-')[2];
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
  };

  const renderDesktopCalendarGrid = () => {
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
          onClick={() => isAdmin && setModal({ mode: 'add', event: { event_date: dateStr } })}
          style={{ cursor: isAdmin ? 'pointer' : 'default' }}
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
                    if (!isAdmin) return;
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

  const renderCalendarGrid = () => {
    if (!isMobile) {
      return renderDesktopCalendarGrid();
    }

    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const cells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell mobile-cell empty" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => {
        const clean = e.event_date.includes('T') ? e.event_date.split('T')[0] : e.event_date;
        return clean === dateStr;
      });
      const isToday = dateStr === todayStr;
      const isSelected = day === selectedDay;

      cells.push(
        <div 
          key={`day-${day}`} 
          className={`calendar-cell mobile-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => setSelectedDay(day)}
        >
          <span className="calendar-day-num">{day}</span>
          {dayEvents.length > 0 && (
            <div className="calendar-cell-dots">
              {dayEvents.slice(0, 3).map((ev) => {
                const badge = getSectionBadge(ev);
                return <span key={ev.id} className={`cell-dot dot-${badge || 'custom'}`} />;
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="mobile-calendar-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {weekdays.map((d, index) => <div key={index} className="calendar-weekday-header mobile-weekday">{d}</div>)}
        </div>
        <div className="calendar-grid-mobile">
          {cells}
        </div>
      </div>
    );
  };

  const selectedDateStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const selectedDayEvents = events.filter(e => {
    const clean = e.event_date.includes('T') ? e.event_date.split('T')[0] : e.event_date;
    return clean === selectedDateStr;
  });

  const isOnCurrentMonth = publicToolbar
    && month === publicToolbar.currentMonth
    && year === publicToolbar.currentYear;
  const isOnNextMonth = publicToolbar
    && month === publicToolbar.nextMonth
    && year === publicToolbar.nextYear;

  return (
    <div>
      {isAdmin && (
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft /> Visão Geral
        </button>
      )}

      <div className="month-actions">
        <div>
          <h1 className="page-title">{monthName} {year}</h1>
          <p className="page-subtitle">{events.length} evento{events.length !== 1 ? 's' : ''} cadastrado{events.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-outline" onClick={handleShareList} title="Compartilhar link público da Lista de Missões">
            <ShareIcon size={14} /> Compartilhar
          </button>
          {isAdmin && (
            <button className="btn btn-outline" onClick={() => setShowCloneModal(true)} title="Copiar agenda de qualquer mês/ano">
              <DownloadIcon size={14} /> Clonar Agenda
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-outline" onClick={handleDownloadImage} disabled={exportingImage} title="Baixar calendário formatado em imagem PNG para WhatsApp">
              <DownloadIcon size={14} /> {exportingImage ? 'Gerando Imagem...' : 'Imagem WhatsApp'}
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-outline" onClick={() => setShowPrint(true)} title="Gerar visualização e ata para impressão em PDF">
              <Printer size={14} /> Impressão PDF
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setModal({ mode: 'add', event: null })}>
              <Plus size={14} /> Novo Evento
            </button>
          )}
        </div>
      </div>

      {publicToolbar && (
        <div className="public-mobile-toolbar">
          <p className="public-mobile-toolbar-label">Período</p>
          <div className="public-mobile-month-nav">
            <button
              type="button"
              className="public-mobile-month-nav-btn"
              disabled={isOnCurrentMonth}
              onClick={() => publicToolbar.onSelectMonth(publicToolbar.currentMonth, publicToolbar.currentYear)}
              aria-label="Mês atual"
            >
              <ChevronLeft />
            </button>
            <div className="public-mobile-month-nav-center">
              <span className="public-mobile-month-nav-title">{monthName} {year}</span>
              <span className="public-mobile-month-nav-sub">
                {isOnCurrentMonth ? 'Mês atual' : isOnNextMonth ? 'Próximo mês' : ''}
              </span>
            </div>
            <button
              type="button"
              className="public-mobile-month-nav-btn"
              disabled={isOnNextMonth}
              onClick={() => publicToolbar.onSelectMonth(publicToolbar.nextMonth, publicToolbar.nextYear)}
              aria-label="Próximo mês"
            >
              <ChevronRight />
            </button>
          </div>

          {events.length > 0 && (
            <>
              <div className="public-mobile-toolbar-divider" />
              <p className="public-mobile-toolbar-label">Visualização</p>
              <div className="view-tabs public-mobile-view-tabs">
                <button className={`view-tab ${viewTab === 'list' ? 'active' : ''}`} onClick={() => setViewTab('list')}>
                  Lista
                </button>
                <button className={`view-tab ${viewTab === 'calendar' ? 'active' : ''}`} onClick={() => setViewTab('calendar')}>
                  Grade Mensal
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {events.length > 0 && !publicToolbar && (
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
            <button className="btn btn-outline" onClick={handleDownloadImage} disabled={exportingImage} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DownloadIcon /> {exportingImage ? 'Gerando...' : 'Baixar Calendário (Imagem)'}
            </button>
          </div>

          <div className="mobile-calendar-container">
            {renderCalendarGrid()}
          </div>

          {isMobile && (
            <div className="mobile-day-events-container">
              <div className="mobile-day-header">
                <h3>Eventos de {selectedDay} de {monthName}</h3>
                {isAdmin && (
                  <button className="btn btn-primary btn-sm btn-icon" title="Novo Evento"
                    onClick={() => setModal({ mode: 'add', event: { event_date: selectedDateStr } })}>
                    <Plus size={16} />
                  </button>
                )}
              </div>
              <div className="mobile-day-events-list">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map(ev => {
                    const badge = getSectionBadge(ev);
                    const warnings = checkRuleViolations(ev, allEvents);
                    return (
                      <div key={ev.id} className="mobile-event-card">
                        <div className="mobile-event-time-badge">
                          <span className="time">{ev.time}</span>
                          {badge && <span className={`event-badge badge-${badge}`}>{getBadgeLabel(badge, ev.event_type)}</span>}
                        </div>
                        <div className="mobile-event-info">
                          <span className="location">{ev.local}</span>
                          <span className="type">{ev.event_type === 'Ensaio' ? (ev.is_parcial ? 'Ensaio Parcial' : 'Ensaio Local') : ev.event_type}</span>
                          {ev.observation && ev.observation !== '__seeded__' && (
                            <span className="observation">{ev.observation}</span>
                          )}
                          {warnings.length > 0 && (
                            <div className="mobile-event-warning">
                              <AlertIcon size={12} />
                              <span>{warnings.join(', ')}</span>
                            </div>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="mobile-event-actions">
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal({ mode: 'edit', event: ev })}>
                              <Pencil size={14} />
                            </button>
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDelete(ev.id)}>
                              <Trash size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="mobile-no-events">
                    Nenhum evento cadastrado neste dia.
                  </div>
                )}
              </div>
            </div>
          )}
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
                  const warnings = checkRuleViolations(ev, allEvents);
                  return (
                    <div key={ev.id} className="event-row">
                      <div className="event-row-meta">
                        <span className="event-date">{formatDate(ev.event_date)}</span>
                        <span className="event-time">{ev.time}</span>
                      </div>
                      <span className="event-desc">
                        {buildEventDescription(ev)}
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
                          {getBadgeLabel(badge, ev.event_type)}
                        </span>
                      )}
                      {isAdmin && (
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
                      )}
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
          {isAdmin && (
            <button className="btn btn-primary" style={{ marginTop: '12px' }}
              onClick={() => setModal({ mode: 'add', event: null })}>
              <Plus /> Adicionar primeiro evento
            </button>
          )}
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

      {showCloneModal && (
        <CloneMonthModal
          targetMonth={month}
          targetYear={year}
          allEvents={allEvents}
          onClose={() => setShowCloneModal(false)}
          onClone={handleCloneFromAnyMonth}
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

      {/* Container invisível para geração de imagem HD (WhatsApp) independente da aba ativa */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', pointerEvents: 'none', zIndex: -9999 }}>
        <div ref={calendarRef} className="calendar-capture-container" style={{ width: '1024px', minWidth: '1024px', background: '#ffffff', color: '#0f172a', padding: '28px', borderRadius: '16px' }}>
          <div className="calendar-capture-header" style={{ minWidth: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
            <div>
              <h2 className="calendar-capture-title" style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#0f172a' }}>{monthName} {year}</h2>
              <div className="calendar-capture-subtitle" style={{ fontSize: '14px', color: '#475569', fontWeight: 600, marginTop: '4px' }}>Congregação Cristã no Brasil — Região de Iporã-PR</div>
            </div>
            <div className="calendar-capture-legend" style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: 600, color: '#475569' }}>
              <div className="legend-item"><span className="legend-dot dot-local"></span> Ensaio Local</div>
              <div className="legend-item"><span className="legend-dot dot-parcial"></span> Ensaio Parcial</div>
              <div className="legend-item"><span className="legend-dot dot-tecnico"></span> Ensaio Técnico</div>
              <div className="legend-item"><span className="legend-dot dot-regional"></span> Ensaio Regional</div>
              <div className="legend-item"><span className="legend-dot dot-culto"></span> Culto</div>
              <div className="legend-item"><span className="legend-dot dot-jovens"></span> Jovens / Mocidade</div>
            </div>
          </div>
          {renderDesktopCalendarGrid()}
        </div>
      </div>

      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          isDanger={confirmDialog.isDanger}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

// ─── Year Dashboard ────────────────────────────────────────────────────────────
function YearDashboard({ events, allEvents, onSave, onDelete, onClearYear, onSelectMonth, onResetSchedule, onCreateEvent, year, onYearChange, onToast }) {
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const handleShareList = async () => {
    const publicUrl = window.location.origin;
    const shareData = {
      title: `Lista de Missões — CCB Região de Iporã-PR`,
      text: `Confira a Lista de Missões oficial da CCB na Região de Iporã-PR (${year}):`,
      url: publicUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (_e) {
        try {
          await navigator.clipboard.writeText(publicUrl);
          if (onToast) onToast('Link da Lista de Missões copiado com sucesso!');
        } catch (_err) {
          // fallback
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(publicUrl);
        if (onToast) onToast('Link da Lista de Missões copiado com sucesso!');
      } catch (_err) {
        // fallback
      }
    }
  };

  let countEnsaios = 0;
  let countCultos = 0;
  let countMocidade = 0;

  events.forEach(ev => {
    if (ev.event_type === 'Ensaio' || ev.event_type === 'Ensaio Regional' || ev.event_type === 'Ensaio Técnico') {
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

  const handleCloneFromAnyMonth = async (srcMonth, srcYear, tgtMonth, tgtYear, srcEvents) => {
    const maxDays = new Date(tgtYear, tgtMonth, 0).getDate();
    for (const ev of srcEvents) {
      const cleanDate = ev.event_date.includes('T') ? ev.event_date.split('T')[0] : ev.event_date;
      const d = cleanDate.split('-')[2];
      const targetDay = Math.min(parseInt(d), maxDays);
      const targetDate = `${tgtYear}-${String(tgtMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
      
      const section = SECTIONS[ev.event_type] || 'ENSAIOS MENSAIS';
      await onSave({
        event_date: targetDate,
        time: ev.time,
        local: ev.local,
        event_type: ev.event_type,
        is_parcial: ev.is_parcial,
        observation: ev.observation === '__seeded__' ? '' : ev.observation,
        section,
        month: tgtMonth,
        year: tgtYear
      });
    }
  };

  const handleAutoGenerateBatch = async (generatedList, clearExisting = true) => {
    if (clearExisting && onClearYear) {
      await onClearYear(year);
    }
    for (const ev of generatedList) {
      await onSave(ev);
    }
  };

  const handleClearYearEvents = () => {
    setConfirmDialog({
      title: `Apagar Agenda de ${year}?`,
      message: `Tem certeza que deseja APAGAR TODOS os eventos da agenda de ${year}? Esta ação não poderá ser desfeita.`,
      confirmText: `Sim, Apagar Agenda`,
      cancelText: `Cancelar`,
      isDanger: true,
      onConfirm: () => {
        if (onClearYear) onClearYear(year);
      }
    });
  };

  // Check for rule violations across all events
  const ruleViolationsList = [];
  const currentEventsList = allEvents || events;
  currentEventsList.forEach(ev => {
    const warnings = checkRuleViolations(ev, currentEventsList);
    if (warnings.length > 0) {
      ruleViolationsList.push({ event: ev, warnings });
    }
  });

  const totalEventsCount = events.length || 1;
  const pctEnsaios = Math.round((countEnsaios / totalEventsCount) * 100);
  const pctCultos = Math.round((countCultos / totalEventsCount) * 100);
  const pctMocidade = Math.round((countMocidade / totalEventsCount) * 100);

  return (
    <div>
      {/* Cabeçalho de Ações Principais do Painel */}
      <div className="admin-page-header" style={{ 
        display: 'flex', 
        justify: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px', 
        flexWrap: 'wrap', 
        gap: '16px',
        background: 'var(--surface)',
        padding: '18px 24px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <button className="btn btn-ghost btn-sm btn-icon no-print" onClick={() => onYearChange(year - 1)} style={{ padding: '6px' }} title="Ano Anterior">
              <ChevronLeft size={18} />
            </button>
            <h1 className="page-title" style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Painel Geral {year}
            </h1>
            <button className="btn btn-ghost btn-sm btn-icon no-print" onClick={() => onYearChange(year + 1)} style={{ padding: '6px' }} title="Próximo Ano">
              <ChevronRight size={18} />
            </button>
          </div>
          <p className="page-subtitle" style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            Congregação Cristã no Brasil — Região de Iporã-PR
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Grupo de Ações de Criação e Automação */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-primary" onClick={onCreateEvent} style={{ fontSize: '13px', fontWeight: 600, padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}>
              <Plus size={16} /> Novo Evento
            </button>

            <button className="btn" onClick={() => setShowAutoScheduleModal(true)} style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              padding: '9px 14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.08)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }} title="Gerar agenda do ano todo automaticamente por regras recorrentes">
              <ZapIcon size={15} /> Gerar por Regras
            </button>

            <button className="btn btn-outline" onClick={() => setShowCloneModal(true)} style={{ fontSize: '13px', fontWeight: 500, padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }} title="Clonar agenda de qualquer mês para outro mês">
              <DownloadIcon size={15} /> Clonar Agenda
            </button>

            <button className="btn btn-outline" onClick={handleShareList} style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              padding: '9px 14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              borderRadius: '10px',
              color: 'var(--accent-blue)',
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }} title="Compartilhar link público da Lista de Missões no WhatsApp ou redes">
              <ShareIcon size={15} /> Compartilhar Lista
            </button>
          </div>

          {/* Divisor de Grupo de Ações */}
          <div style={{ width: '1px', height: '28px', background: 'var(--border)', margin: '0 2px' }} />

          {/* Grupo de Manutenção da Agenda */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {year === 2026 && (
              <button className="btn btn-outline" onClick={onResetSchedule} style={{ fontSize: '12.5px', fontWeight: 500, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }} title="Restaurar a agenda oficial original de 60 eventos de 2026">
                <RotateCcwIcon size={14} /> Restaurar 2026
              </button>
            )}

            <button className="btn btn-outline" onClick={handleClearYearEvents} style={{ 
              fontSize: '12.5px', 
              fontWeight: 500, 
              padding: '9px 12px', 
              color: 'var(--accent-red)', 
              borderColor: 'rgba(239, 68, 68, 0.25)', 
              background: 'rgba(239, 68, 68, 0.04)',
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              borderRadius: '10px' 
            }} title="Apagar todos os eventos do ano selecionado">
              <Trash size={14} /> Limpar {year}
            </button>
          </div>
        </div>
      </div>

      {/* Cartões de Métricas KPIs */}
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
            <span className="stat-label">Ensaios ({pctEnsaios}%)</span>
          </div>
          <div className="stat-icon amber">
            <EnsaioIcon />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{countCultos}</span>
            <span className="stat-label">Cultos ({pctCultos}%)</span>
          </div>
          <div className="stat-icon green">
            <CultoIcon />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-value">{countMocidade}</span>
            <span className="stat-label">Mocidade ({pctMocidade}%)</span>
          </div>
          <div className="stat-icon purple">
            <MocidadeIcon />
          </div>
        </div>
      </div>

      {/* Seção de KPIs e Alertas de Conformidade */}
      <div className="kpi-section">
        {events.length > 0 && (
          <div className="kpi-distribution-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MusicIcon size={16} />
                <span className="kpi-health-title">Distribuição de Eventos por Tipo ({year})</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {events.length} evento{events.length !== 1 ? 's' : ''} no total
              </span>
            </div>

            <div className="kpi-distribution-bar">
              <div className="kpi-segment ensaios" style={{ width: `${pctEnsaios}%` }} title={`Ensaios: ${pctEnsaios}%`} />
              <div className="kpi-segment cultos" style={{ width: `${pctCultos}%` }} title={`Cultos: ${pctCultos}%`} />
              <div className="kpi-segment mocidade" style={{ width: `${pctMocidade}%` }} title={`Mocidade: ${pctMocidade}%`} />
            </div>

            <div className="kpi-legend">
              <div className="kpi-legend-item">
                <span className="kpi-legend-dot" style={{ background: 'var(--accent-amber)' }} />
                <span>Ensaios ({countEnsaios} - {pctEnsaios}%)</span>
              </div>
              <div className="kpi-legend-item">
                <span className="kpi-legend-dot" style={{ background: 'var(--accent-green)' }} />
                <span>Cultos ({countCultos} - {pctCultos}%)</span>
              </div>
              <div className="kpi-legend-item">
                <span className="kpi-legend-dot" style={{ background: 'var(--accent-purple)' }} />
                <span>Mocidade ({countMocidade} - {pctMocidade}%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Alertas Automáticos de Conflitos e Regras da Igreja */}
        <div className={`kpi-health-card ${ruleViolationsList.length > 0 ? 'has-warnings' : 'clean'}`}>
          <div className="kpi-health-header">
            {ruleViolationsList.length > 0 ? <AlertIcon size={18} /> : <CheckCircleIcon size={18} />}
            <span className="kpi-health-title">
              {ruleViolationsList.length > 0 
                ? `Alertas de Conformidade e Conflitos (${ruleViolationsList.length} ${ruleViolationsList.length === 1 ? 'alerta detectado' : 'alertas detectados'})` 
                : 'Conformidade Geral da Agenda'}
            </span>
          </div>

          {ruleViolationsList.length > 0 ? (
            <div className="kpi-health-list">
              {ruleViolationsList.map(({ event, warnings }, idx) => (
                <div key={idx} className="kpi-health-item">
                  <div>
                    <strong>{formatDate(event.event_date)} em {event.local} ({event.event_type}):</strong>{' '}
                    <span style={{ color: 'var(--accent-red)' }}>{warnings.join(', ')}</span>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => onSelectMonth(event.month)} style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                    Ver em {MONTHS[event.month - 1]}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Todos os eventos cadastrados atendem perfeitamente às regras de rodízio e horários sem conflitos.
            </p>
          )}
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
                      {getBadgeLabel(badge, ev.event_type)}
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

      {showCloneModal && (
        <CloneMonthModal
          defaultTargetMonth={1}
          targetYear={year}
          allEvents={allEvents || events}
          onClose={() => setShowCloneModal(false)}
          onClone={handleCloneFromAnyMonth}
        />
      )}

      {showAutoScheduleModal && (
        <AutoScheduleModal
          targetYear={year}
          allEvents={allEvents || events}
          onClose={() => setShowAutoScheduleModal(false)}
          onGenerate={handleAutoGenerateBatch}
        />
      )}

      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          isDanger={confirmDialog.isDanger}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(null)}
        />
      )}
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
                const warnings = checkRuleViolations(ev, allEvents);
                return (
                  <div key={ev.id} className="event-row">
                    <div className="event-row-meta">
                      <span className="event-date">{formatDate(ev.event_date)}</span>
                      <span className="event-time">{ev.time}</span>
                    </div>
                    <span className="event-desc">
                      {buildEventDescription(ev)}
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
                        {getBadgeLabel(badge, ev.event_type)}
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
  const [isAdminMode, setIsAdminMode] = useState(window.location.pathname.startsWith('/dev-admin'));
  const [adminUser, setAdminUser] = useState(() => {
    const cached = localStorage.getItem('admin_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [emailInput, setEmailInput] = useState('');

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;



  const [selectedMonth, setSelectedMonth] = useState(() => {
    const isAdm = window.location.pathname.startsWith('/dev-admin');
    return isAdm ? null : (new Date().getMonth() + 1);
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear();
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const [fontScale, setFontScale] = useState(() => {
    return localStorage.getItem('accessibility_font_scale') || 'normal';
  });

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isPublicMobile = !isAdminMode && isMobile;

  useEffect(() => {
    const root = document.documentElement;
    const topColor = theme === 'dark' ? '#2F3C46' : '#1e4d8c';

    root.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('dark', theme === 'dark');
    document.body.classList.toggle('font-scale-lg', fontScale === 'large');
    document.body.classList.toggle('font-scale-xl', fontScale === 'xlarge');
    root.classList.toggle('public-mobile-view', isPublicMobile);
    document.body.classList.toggle('public-mobile-view', isPublicMobile);

    if (isPublicMobile) {
      root.style.backgroundColor = topColor;
      document.body.style.backgroundColor = topColor;
    } else {
      root.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
    }

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', isPublicMobile ? topColor : (theme === 'dark' ? '#151c22' : '#F2F5F6'));
    }

    localStorage.setItem('theme', theme);
    localStorage.setItem('accessibility_font_scale', fontScale);
  }, [theme, fontScale, isPublicMobile]);

  // Handle simple client-side routing
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setIsAdminMode(path.startsWith('/dev-admin'));
  };

  useEffect(() => {
    const handlePop = () => {
      setIsAdminMode(window.location.pathname.startsWith('/dev-admin'));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Initialize selected month/year based on route
  useEffect(() => {
    if (!isAdminMode) {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
    } else {
      setSelectedMonth(null); // Admin panel dashboard view
      setSelectedYear(CURRENT_YEAR);
    }
  }, [isAdminMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdminMode) {
        const data = await fetchAllEvents(selectedYear);
        setEvents(data);
      } else {
        // Public list loads only current year (and next year if crossing boundary)
        const currentData = await fetchAllEvents(currentYear);
        let combined = [...currentData];
        if (nextYear !== currentYear) {
          const nextData = await fetchAllEvents(nextYear);
          combined = [...combined, ...nextData];
        }
        setEvents(combined);
      }
    } catch (err) {
      setToast('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, isAdminMode]);

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

  const [confirmDialog, setConfirmDialog] = useState(null);

  const handleDelete = (id) => {
    setConfirmDialog({
      title: 'Excluir Evento?',
      message: 'Tem certeza que deseja excluir este evento da agenda?',
      confirmText: 'Sim, Excluir',
      cancelText: 'Cancelar',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteEvent(id);
          setEvents(prev => prev.filter(e => e.id !== id));
          setToast('Evento excluído com sucesso!');
        } catch (err) {
          setToast('Erro: ' + err.message);
        }
      }
    });
  };

  const handleClearYear = async (targetYear) => {
    try {
      const toDelete = events.filter(e => e.year === targetYear);
      for (const ev of toDelete) {
        await deleteEvent(ev.id);
      }
      setEvents(prev => prev.filter(e => e.year !== targetYear));
      setToast(`Agenda de ${targetYear} limpa com sucesso!`);
    } catch (err) {
      setToast('Erro ao limpar agenda: ' + err.message);
    }
  };

  const handleResetSchedule = () => {
    setConfirmDialog({
      title: 'Redefinir Agenda 2026?',
      message: 'Esta ação redefinirá a agenda padrão regional de 2026 com os 60 eventos oficiais. Deseja prosseguir?',
      confirmText: 'Redefinir',
      cancelText: 'Cancelar',
      isDanger: true,
      onConfirm: async () => {
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
      }
    });
  };

  const handleEmailLogin = (e) => {
    e.preventDefault();
    if (emailInput.trim().toLowerCase() === 'vitorpradotamos@gmail.com') {
      const authorizedUser = { email: 'vitorpradotamos@gmail.com', name: 'Vitor Prado', picture: '' };
      localStorage.setItem('admin_token', 'vitor-authorized-token');
      localStorage.setItem('admin_user', JSON.stringify(authorizedUser));
      setAdminUser(authorizedUser);
      setToast('Login efetuado com sucesso!');
      setEmailInput('');
    } else {
      setToast('Acesso negado: E-mail não autorizado.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdminUser(null);
    setToast('Sessão encerrada com sucesso.');
  };

  const handleMockLogin = () => {
    const mockUser = { email: 'vitorpradotamos@gmail.com', name: 'Administrador (Local)', picture: '' };
    localStorage.setItem('admin_token', 'mock-admin-token');
    localStorage.setItem('admin_user', JSON.stringify(mockUser));
    setAdminUser(mockUser);
    setToast('Acesso administrativo de desenvolvimento autorizado!');
  };

  // Render RESTRICTED Admin Login Card
  if (isAdminMode && !adminUser) {
    return (
      <div className="admin-login-overlay">
        <div className="admin-login-card">
          <img src="/logo.png" alt="CCB" className="admin-login-logo" />
          <h1 className="admin-login-title">Área Administrativa</h1>
          <p className="admin-login-subtitle">Apenas para administradores autorizados (vitorpradotamos@gmail.com)</p>
          
          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
            <input 
              type="email" 
              placeholder="Digite seu e-mail cadastrado" 
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#333',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px' }}>
              Entrar
            </button>
          </form>

          <button className="btn btn-ghost" onClick={() => navigateTo('/')} style={{ marginTop: '16px', fontSize: '12px' }}>
            ← Voltar para a lista pública
          </button>
        </div>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </div>
    );
  }

  const activeMonthName = selectedMonth ? MONTHS[selectedMonth - 1] : '';

  const handlePublicShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast('Link copiado para a área de transferência!');
    } catch {
      setToast('Não foi possível copiar o link.');
    }
  };

  const publicMonthEvents = events.filter(e => {
    if (e.month === selectedMonth && e.year === selectedYear) return true;
    const isNextMonth = e.month === selectedMonth + 1 || (selectedMonth === 12 && e.month === 1);
    if (isNextMonth && e.show_in_prev_month) return true;
    return false;
  });

  // Render normal layout (Admin Panel or Public Area)
  return (
    <div className={`app${isPublicMobile ? ' is-public-mobile' : ''}`}>
      <div className="main-workspace">
        {/* Header Desktop (Telas Grandes) */}
        <header className="workspace-header">
          <div className="header-left">
            <div className="app-brand no-print" style={{ cursor: 'pointer' }} onClick={() => navigateTo('/')}>
              <img src="/logo.png" alt="CCB" className="app-brand-logo" />
              <div className="app-brand-text">
                <span className="app-brand-title">Lista de Missões</span>
                <span className="app-brand-subtitle">CCB — Região de Iporã-PR</span>
              </div>
            </div>
          </div>

          <div className="header-right no-print">
            {/* Seletor Rápido de Tamanho de Fonte (Acessibilidade) */}
            <div className="font-scale-header-toggle" title="Acessibilidade: Ajustar Tamanho do Texto">
              <button 
                className={`font-scale-btn ${fontScale === 'normal' ? 'active' : ''}`} 
                onClick={() => setFontScale('normal')}
              >
                A
              </button>
              <button 
                className={`font-scale-btn ${fontScale === 'large' ? 'active' : ''}`} 
                onClick={() => setFontScale('large')}
              >
                A+
              </button>
              <button 
                className={`font-scale-btn ${fontScale === 'xlarge' ? 'active' : ''}`} 
                onClick={() => setFontScale('xlarge')}
              >
                A++
              </button>
            </div>

            {/* Alternador Tema Escuro / Claro */}
            <button 
              className="btn btn-ghost btn-sm btn-icon theme-toggle-btn" 
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
            >
              {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            </button>
            
            {isAdminMode && adminUser && (
              <div className="user-profile">
                <div className="user-info">
                  <span className="user-name">{adminUser.name || 'Administrador'}</span>
                  <span className="user-role-badge" onClick={handleLogout} title="Encerrar Sessão">
                    Sair (Logout)
                  </span>
                </div>
                {adminUser.picture ? (
                  <img src={adminUser.picture} alt="Avatar" className="user-avatar" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="user-avatar">ADM</div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Header Mobile — layout público (hero) ou admin (barra compacta) */}
        {isPublicMobile ? (
          <header className="public-mobile-hero">
            <div className="public-mobile-hero-top">
              <div className="public-mobile-hero-brand" onClick={() => navigateTo('/')} role="button" tabIndex={0}>
                <img src="/logo.png" alt="CCB" className="public-mobile-hero-logo" />
                <div>
                  <p className="public-mobile-hero-eyebrow">Congregação Cristã no Brasil</p>
                  <h1 className="public-mobile-hero-title">Lista de Missões</h1>
                  <p className="public-mobile-hero-sub">Região de Iporã-PR</p>
                </div>
              </div>
              <div className="public-mobile-hero-actions">
                <button
                  type="button"
                  className="public-mobile-hero-btn"
                  onClick={handlePublicShare}
                  title="Compartilhar link"
                >
                  <ShareIcon size={14} />
                </button>
              </div>
            </div>
            <div className="public-mobile-hero-toolbar">
              <div className="public-mobile-font-pills">
                {[
                  { key: 'normal', label: 'A' },
                  { key: 'large', label: 'A+' },
                  { key: 'xlarge', label: 'A++' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`public-mobile-font-pill${fontScale === key ? ' active' : ''}`}
                    onClick={() => setFontScale(key)}
                    title={key === 'normal' ? 'Normal' : key === 'large' ? 'Grande' : 'Extra grande'}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="public-mobile-theme-toggle"
                onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              >
                {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
              </button>
            </div>
          </header>
        ) : (
          <header className="mobile-header">
            <div className="mobile-header-row">
              <div className="mobile-brand" onClick={() => navigateTo('/')} style={{ cursor: 'pointer' }}>
                <img src="/logo.png" alt="CCB" className="app-brand-logo app-brand-logo--mobile" />
                <div>
                  <div className="mobile-brand-title">Lista de Missões</div>
                  <div className="mobile-brand-sub">CCB Iporã-PR</div>
                </div>
              </div>

              <div className="mobile-header-actions">
                <button
                  className="btn btn-ghost btn-sm font-toggle-mobile-btn"
                  onClick={() => setFontScale(s => s === 'normal' ? 'large' : s === 'large' ? 'xlarge' : 'normal')}
                  title="Ajustar tamanho da fonte"
                >
                  {fontScale === 'normal' ? 'A' : fontScale === 'large' ? 'A+' : 'A++'}
                </button>

                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
                  style={{ padding: '6px' }}
                  title="Alternar tema"
                >
                  {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
                </button>

                {isAdminMode && adminUser && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleLogout}
                    style={{ fontSize: '11px', color: 'var(--accent-red)', padding: '4px 8px', fontWeight: 700 }}
                  >
                    Sair
                  </button>
                )}
              </div>
            </div>
          </header>
        )}
  
        <main className="main-body">
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
              <div className="spinner" />
            </div>
          ) : !isAdminMode ? (
            /* Public View: Only shows events of current month and next month with monthly switcher */
            <div className={isPublicMobile ? 'public-mobile-content' : ''}>
              {!isPublicMobile && (
                <>
                  <div className="public-welcome-header" style={{ marginBottom: '16px' }}>
                    <h1 className="page-title">Lista de Missões</h1>
                    <p className="page-subtitle">Exibindo eventos oficiais da Congregação Cristã no Brasil para a região de Iporã-PR.</p>
                  </div>

                  <div className="senior-font-bar">
                    <span className="senior-font-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TextSizeIcon size={15} /> Tamanho da Letra:
                    </span>
                    <div className="senior-font-segmented">
                      <button
                        className={`senior-font-btn ${fontScale === 'normal' ? 'active' : ''}`}
                        onClick={() => setFontScale('normal')}
                      >
                        A <small style={{ fontWeight: 400, opacity: 0.8 }}>(Normal)</small>
                      </button>
                      <button
                        className={`senior-font-btn ${fontScale === 'large' ? 'active' : ''}`}
                        onClick={() => setFontScale('large')}
                      >
                        A+ <small style={{ fontWeight: 400, opacity: 0.8 }}>(Grande)</small>
                      </button>
                      <button
                        className={`senior-font-btn ${fontScale === 'xlarge' ? 'active' : ''}`}
                        onClick={() => setFontScale('xlarge')}
                      >
                        A++ <small style={{ fontWeight: 400, opacity: 0.8 }}>(Extra)</small>
                      </button>
                    </div>
                  </div>

                  <div className="senior-month-tabs">
                    <button
                      className={`senior-month-btn ${selectedMonth === currentMonth && selectedYear === currentYear ? 'active' : ''}`}
                      onClick={() => { setSelectedMonth(currentMonth); setSelectedYear(currentYear); }}
                    >
                      <span className="month-title">{MONTHS[currentMonth - 1]} {currentYear}</span>
                      <span className="month-badge">Mês Atual</span>
                    </button>
                    <button
                      className={`senior-month-btn ${selectedMonth === nextMonth && selectedYear === nextYear ? 'active' : ''}`}
                      onClick={() => { setSelectedMonth(nextMonth); setSelectedYear(nextYear); }}
                    >
                      <span className="month-title">{MONTHS[nextMonth - 1]} {nextYear}</span>
                      <span className="month-badge">Próximo Mês</span>
                    </button>
                  </div>
                </>
              )}

              <MonthEditor
                month={selectedMonth}
                year={selectedYear}
                events={publicMonthEvents}
                allEvents={events}
                onSave={handleSave}
                onDelete={handleDelete}
                onBack={() => {}}
                isAdmin={false}
                onToast={setToast}
                publicToolbar={isPublicMobile ? {
                  currentMonth,
                  currentYear,
                  nextMonth,
                  nextYear,
                  onSelectMonth: (m, y) => { setSelectedMonth(m); setSelectedYear(y); },
                } : null}
              />
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
              allEvents={events}
              onSave={handleSave}
              onDelete={handleDelete}
              onClearYear={handleClearYear}
              onSelectMonth={setSelectedMonth} 
              onResetSchedule={handleResetSchedule}
              onCreateEvent={() => setModal({ mode: 'add', event: { month: new Date().getMonth() + 1, year: selectedYear, event_date: `${selectedYear}-${String(new Date().getMonth() + 1).padStart(2,'0')}-01` } })}
              year={selectedYear}
              onYearChange={setSelectedYear}
              onToast={setToast}
            />
          ) : (
            <MonthEditor 
              month={selectedMonth} 
              year={selectedYear} 
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
              isAdmin={true}
              onToast={setToast}
            />
          )}
        </main>
      </div>



      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {confirmDialog && (
        <ConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          isDanger={confirmDialog.isDanger}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
