import { neon } from '@neondatabase/serverless';

// POST /api/setup  — run once to create table + seed 2026 data
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Create table
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id         SERIAL PRIMARY KEY,
        year       INTEGER NOT NULL,
        month      INTEGER NOT NULL,
        event_date DATE    NOT NULL,
        time       VARCHAR(10) NOT NULL,
        local      VARCHAR(100) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        is_parcial BOOLEAN DEFAULT FALSE,
        section    VARCHAR(50) NOT NULL,
        observation TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create index
    await sql`CREATE INDEX IF NOT EXISTS idx_events_year_month ON events(year, month)`;

    // Clear existing seeded data to avoid duplicates on re-run
    await sql`DELETE FROM events WHERE observation = '__seeded__'`;

    // Seed 2026 rehearsal data from the annual schedule table
    const seedData = [
      // IPORÃ LOCAL - odd months only
      { date: '2026-01-16', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-03-20', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-05-15', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-07-17', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-09-18', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-11-20', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      // IPORÃ E REGIÃO - even months
      { date: '2026-02-20', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-04-17', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-06-19', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-08-21', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-10-16', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-12-18', time: '19:30', local: 'Iporã', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      // FRANCISCO ALVES - all months
      { date: '2026-01-02', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-02-06', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-03-06', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-04-03', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-05-01', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-06-05', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-07-03', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-08-07', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-09-04', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-10-02', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-11-06', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      { date: '2026-12-04', time: '19:30', local: 'Francisco Alves', type: 'Ensaio', parcial: false, section: 'ENSAIOS MENSAIS' },
      // CAFEZAL DO SUL (Parcial) - all months
      { date: '2026-01-15', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-02-19', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-03-19', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-04-16', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-05-21', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-06-18', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-07-16', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-08-20', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-09-17', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-10-15', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-11-19', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-12-17', time: '19:30', local: 'Cafezal do Sul', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      // NOVA SANTA HELENA (Parcial) - ODD months only
      { date: '2026-01-09', time: '19:30', local: 'Nova Santa Helena', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-03-13', time: '19:30', local: 'Nova Santa Helena', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-05-08', time: '19:30', local: 'Nova Santa Helena', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-07-10', time: '19:30', local: 'Nova Santa Helena', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-09-11', time: '19:30', local: 'Nova Santa Helena', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-11-13', time: '19:30', local: 'Nova Santa Helena', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      // GUAIPORÃ (Parcial) - all months except December
      { date: '2026-01-27', time: '19:30', local: 'Guaiporã', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-02-24', time: '19:30', local: 'Guaiporã', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-03-24', time: '19:30', local: 'Guaiporã', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-04-28', time: '19:30', local: 'Guaiporã', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-05-26', time: '19:30', local: 'Guaiporã', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-06-23', time: '19:30', local: 'Guaiporã', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-07-28', time: '19:30', local: 'Guaiporã', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-08-25', time: '19:30', local: 'Guaiporã', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-09-22', time: '19:30', local: 'Guaiporã', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-10-27', time: '19:30', local: 'Guaiporã', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-11-22', time: '19:30', local: 'Guaiporã', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      // VILA NILZA (Parcial) - EVEN months only
      { date: '2026-02-21', time: '19:30', local: 'Vila Nilza', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-04-18', time: '19:30', local: 'Vila Nilza', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-06-20', time: '19:30', local: 'Vila Nilza', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-08-15', time: '19:30', local: 'Vila Nilza', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-10-17', time: '19:30', local: 'Vila Nilza', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      { date: '2026-12-19', time: '19:30', local: 'Vila Nilza', type: 'Ensaio', parcial: true, section: 'ENSAIOS MENSAIS' },
      // IPORÃ REGIONAL - September only
      { date: '2026-09-15', time: '09:00', local: 'Iporã', type: 'Ensaio Regional', parcial: false, section: 'ENSAIOS MENSAIS' },
    ];

    for (const ev of seedData) {
      const d = new Date(ev.date);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      await sql`
        INSERT INTO events (event_date, time, local, event_type, is_parcial, observation, section, year, month)
        VALUES (${ev.date}, ${ev.time}, ${ev.local}, ${ev.type}, ${ev.parcial}, ${'__seeded__'}, ${ev.section}, ${year}, ${month})
      `;
    }

    return res.status(200).json({ success: true, seeded: seedData.length });
  } catch (error) {
    console.error('Setup Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
