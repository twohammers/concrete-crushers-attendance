export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, url } = req;
    const path = url.replace('/api', '');

    // Environment check endpoint
    if (method === 'GET' && path === '/debug') {
      return res.json({
        nodeVersion: process.version,
        platform: process.platform,
        hasDB: !!process.env.DATABASE_URL,
        envKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PG')),
        timestamp: new Date().toISOString()
      });
    }

    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'DATABASE_URL environment variable not found',
        availableEnvs: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PG'))
      });
    }

    // Try to connect to database with better error handling
    if (method === 'GET' && path === '/test') {
      try {
        const { Pool } = await import('@neondatabase/serverless');
        const pool = new Pool({ 
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        const result = await pool.query('SELECT NOW() as current_time');
        return res.json({ 
          status: 'success',
          database: 'connected',
          time: result.rows[0]
        });
      } catch (dbError) {
        return res.status(500).json({ 
          error: 'Database connection failed',
          message: dbError instanceof Error ? dbError.message : String(dbError),
          type: dbError instanceof Error ? dbError.constructor.name : 'Unknown',
          connectionString: process.env.DATABASE_URL ? 'present' : 'missing'
        });
      }
    }

    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Test basic connectivity
    if (method === 'GET' && path === '/test') {
      const result = await pool.query('SELECT NOW() as current_time');
      return res.json({ 
        status: 'success',
        database: 'connected',
        time: result.rows[0]
      });
    }

    // Core endpoints for the app
    if (method === 'GET' && path === '/roster') {
      const result = await pool.query(`
        SELECT id, "firstName", "lastName", position, "jerseyNumber", "gamesPlayed", "isActive"
        FROM team_roster 
        WHERE "isActive" = true 
        ORDER BY "firstName", "lastName"
      `);
      return res.json(result.rows);
    }

    if (method === 'GET' && path === '/game') {
      const result = await pool.query(`
        SELECT id, opponent, "homeAway", field, date, time, "isActive"
        FROM games 
        WHERE "isActive" = true 
        LIMIT 1
      `);
      return res.json(result.rows[0] || null);
    }

    if (method === 'GET' && path === '/games') {
      const result = await pool.query(`
        SELECT id, opponent, "homeAway", field, date, time, "isActive"
        FROM games 
        ORDER BY date
      `);
      return res.json(result.rows);
    }

    if (method === 'GET' && path === '/attendees') {
      const result = await pool.query(`
        SELECT id, "firstName", "lastName", status, "checkedInAt"
        FROM attendees 
        ORDER BY "checkedInAt" DESC
      `);
      return res.json(result.rows);
    }

    if (method === 'GET' && path === '/stats') {
      const attendeesResult = await pool.query('SELECT status FROM attendees');
      const gameResult = await pool.query('SELECT "isActive" FROM games WHERE "isActive" = true LIMIT 1');
      
      const attendees = attendeesResult.rows;
      const attending = attendees.filter(a => a.status === 'attending').length;
      const notAttending = attendees.filter(a => a.status === 'not_attending').length;
      
      return res.json({
        attending,
        notAttending,
        total: attendees.length,
        gameStatus: gameResult.rows.length > 0 ? 'active' : 'upcoming'
      });
    }

    if (method === 'POST' && path === '/attendees') {
      const { firstName, lastName, status } = req.body;
      
      const existingResult = await pool.query(
        'SELECT id FROM attendees WHERE "firstName" = $1 AND "lastName" = $2',
        [firstName, lastName]
      );

      if (existingResult.rows.length > 0) {
        const updateResult = await pool.query(
          'UPDATE attendees SET status = $1, "checkedInAt" = NOW() WHERE id = $2 RETURNING *',
          [status, existingResult.rows[0].id]
        );
        return res.json(updateResult.rows[0]);
      } else {
        const insertResult = await pool.query(
          'INSERT INTO attendees ("firstName", "lastName", status, "checkedInAt") VALUES ($1, $2, $3, NOW()) RETURNING *',
          [firstName, lastName, status]
        );
        return res.json(insertResult.rows[0]);
      }
    }

    return res.status(404).json({ error: 'Route not found', path, method });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Server error', 
      message: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : 'Unknown'
    });
  }
}
