// API base URL — uses /api in production (Vercel), can be overridden for local dev
const BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchEvents(month, year) {
  const res = await fetch(`${BASE}/events?month=${month}&year=${year}`);
  if (!res.ok) throw new Error('Erro ao carregar eventos');
  return res.json();
}

export async function createEvent(event) {
  const res = await fetch(`${BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error('Erro ao criar evento');
  return res.json();
}

export async function updateEvent(event) {
  const res = await fetch(`${BASE}/events`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error('Erro ao atualizar evento');
  return res.json();
}

export async function deleteEvent(id) {
  const res = await fetch(`${BASE}/events?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir evento');
  return res.json();
}

export async function runSetup() {
  const res = await fetch(`${BASE}/setup`, { method: 'POST' });
  if (!res.ok) throw new Error('Erro no setup');
  return res.json();
}
