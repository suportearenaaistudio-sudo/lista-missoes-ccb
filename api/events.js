import { neon } from '@neondatabase/serverless';

// GET /api/events?month=7&year=2026
// POST /api/events  { body: event }
// PUT /api/events   { body: { id, ...event } }
// DELETE /api/events?id=xxx

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'GET') {
      const { month, year } = req.query;
      if (!month || !year) return res.status(400).json({ error: 'month and year are required' });
      const rows = await sql`
        SELECT * FROM events 
        WHERE month = ${parseInt(month)} AND year = ${parseInt(year)}
        ORDER BY event_date ASC, id ASC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { event_date, time, local, event_type, is_parcial, observation, section, year, month } = req.body;
      const rows = await sql`
        INSERT INTO events (event_date, time, local, event_type, is_parcial, observation, section, year, month)
        VALUES (${event_date}, ${time}, ${local}, ${event_type}, ${is_parcial ?? false}, ${observation ?? ''}, ${section}, ${parseInt(year)}, ${parseInt(month)})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, event_date, time, local, event_type, is_parcial, observation, section } = req.body;
      const rows = await sql`
        UPDATE events 
        SET event_date = ${event_date}, time = ${time}, local = ${local}, 
            event_type = ${event_type}, is_parcial = ${is_parcial ?? false}, 
            observation = ${observation ?? ''}, section = ${section}
        WHERE id = ${id}
        RETURNING *
      `;
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM events WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
