import { SEED_EVENTS } from './mockEvents.js';

const BASE = import.meta.env.VITE_API_URL || '/api';
const IS_DEV = import.meta.env.DEV && !import.meta.env.VITE_API_URL;

function getLocalEvents() {
  const stored = localStorage.getItem('local_events_db');
  if (!stored) {
    localStorage.setItem('local_events_db', JSON.stringify(SEED_EVENTS));
    return SEED_EVENTS;
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : SEED_EVENTS;
  } catch (_e) {
    localStorage.setItem('local_events_db', JSON.stringify(SEED_EVENTS));
    return SEED_EVENTS;
  }
}

function saveLocalEvents(events) {
  localStorage.setItem('local_events_db', JSON.stringify(events));
}

export async function fetchEvents(month, year) {
  if (IS_DEV) {
    const all = getLocalEvents();
    return all.filter(e => e.month === month && e.year === year);
  }

  try {
    const res = await fetch(`${BASE}/events?month=${month}&year=${year}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (_e) {
    const all = getLocalEvents();
    return all.filter(e => e.month === month && e.year === year);
  }
}

export async function fetchAllEvents(year) {
  if (IS_DEV) {
    const all = getLocalEvents();
    return all.filter(e => e.year === year);
  }

  try {
    const res = await fetch(`${BASE}/events?year=${year}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (_e) {
    const all = getLocalEvents();
    return all.filter(e => e.year === year);
  }
}

function getHeaders() {
  const token = localStorage.getItem('admin_token') || 'mock-admin-token';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

export async function createEvent(event) {
  if (IS_DEV) {
    const all = getLocalEvents();
    const newEv = {
      ...event,
      id: Date.now() + Math.floor(Math.random() * 1000)
    };
    all.push(newEv);
    saveLocalEvents(all);
    return newEv;
  }

  try {
    const res = await fetch(`${BASE}/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (_e) {
    const all = getLocalEvents();
    const newEv = {
      ...event,
      id: Date.now() + Math.floor(Math.random() * 1000)
    };
    all.push(newEv);
    saveLocalEvents(all);
    return newEv;
  }
}

export async function updateEvent(event) {
  if (IS_DEV) {
    const all = getLocalEvents();
    const idx = all.findIndex(e => e.id === event.id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...event };
      saveLocalEvents(all);
      return all[idx];
    }
    return event;
  }

  try {
    const res = await fetch(`${BASE}/events`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (_e) {
    const all = getLocalEvents();
    const idx = all.findIndex(e => e.id === event.id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...event };
      saveLocalEvents(all);
      return all[idx];
    }
    return event;
  }
}

export async function deleteEvent(id) {
  if (IS_DEV) {
    const all = getLocalEvents();
    const filtered = all.filter(e => e.id !== id);
    saveLocalEvents(filtered);
    return { success: true };
  }

  try {
    const token = localStorage.getItem('admin_token') || 'mock-admin-token';
    const res = await fetch(`${BASE}/events?id=${id}`, { 
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (_e) {
    const all = getLocalEvents();
    const filtered = all.filter(e => e.id !== id);
    saveLocalEvents(filtered);
    return { success: true };
  }
}

export async function runSetup() {
  if (IS_DEV) {
    saveLocalEvents(SEED_EVENTS);
    return { success: true, seeded: SEED_EVENTS.length };
  }

  try {
    const token = localStorage.getItem('admin_token') || 'mock-admin-token';
    const res = await fetch(`${BASE}/setup`, { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (_e) {
    saveLocalEvents(SEED_EVENTS);
    return { success: true, seeded: SEED_EVENTS.length };
  }
}
