import { neon } from '@neondatabase/serverless';

// GET /api/events?month=7&year=2026
// POST /api/events  { body: event }
// PUT /api/events   { body: { id, ...event } }
// DELETE /api/events?id=xxx

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Para POST, PUT, DELETE, exige autenticação do admin
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Não autorizado. Token ausente.' });
      }
      const token = authHeader.split(' ')[1];
      
      let emailAuthorized = false;
      if (process.env.NODE_ENV === 'development' && token === 'mock-admin-token') {
        emailAuthorized = true;
      } else {
        try {
          const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
          if (verifyRes.ok) {
            const payload = await verifyRes.json();
            if (payload.email === 'vitorpradotamos@gmail.com') {
              emailAuthorized = true;
            }
          }
        } catch (e) {
          console.error('Erro ao verificar token com o Google:', e);
        }
      }

      if (!emailAuthorized) {
        return res.status(403).json({ error: 'Acesso negado. Apenas o e-mail vitorpradotamos@gmail.com possui autorização.' });
      }
    }

    if (req.method === 'GET') {
      const { month, year } = req.query;
      if (!year) return res.status(400).json({ error: 'year is required' });
      
      let rows;
      if (month) {
        // Retorna eventos do proprio mes E eventos do mes seguinte marcados com show_in_prev_month = true
        rows = await sql`
          SELECT * FROM events 
          WHERE (month = ${parseInt(month)} AND year = ${parseInt(year)})
             OR (
               show_in_prev_month = TRUE 
               AND (
                 (month = ${parseInt(month)} + 1 AND year = ${parseInt(year)})
                 OR (month = 1 AND ${parseInt(month)} = 12 AND year = ${parseInt(year)} + 1)
               )
             )
          ORDER BY event_date ASC, id ASC
        `;
      } else {
        rows = await sql`
          SELECT * FROM events 
          WHERE year = ${parseInt(year)}
          ORDER BY event_date ASC, id ASC
        `;
      }
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { event_date, time, local, event_type, is_parcial, show_in_prev_month, observation, section, year, month } = req.body;
      const rows = await sql`
        INSERT INTO events (event_date, time, local, event_type, is_parcial, show_in_prev_month, observation, section, year, month)
        VALUES (${event_date}, ${time}, ${local}, ${event_type}, ${is_parcial ?? false}, ${show_in_prev_month ?? false}, ${observation ?? ''}, ${section}, ${parseInt(year)}, ${parseInt(month)})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, event_date, time, local, event_type, is_parcial, show_in_prev_month, observation, section } = req.body;
      const [y, m, d] = event_date.split('-');
      const monthVal = parseInt(m);
      const yearVal = parseInt(y);
      const rows = await sql`
        UPDATE events 
        SET event_date = ${event_date}, time = ${time}, local = ${local}, 
            event_type = ${event_type}, is_parcial = ${is_parcial ?? false}, 
            show_in_prev_month = ${show_in_prev_month ?? false},
            observation = ${observation ?? ''}, section = ${section},
            month = ${monthVal}, year = ${yearVal}
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
