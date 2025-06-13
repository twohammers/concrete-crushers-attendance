export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Test database connection first
    const { Pool } = await import('@neondatabase/serverless');
    
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'Database connection not configured',
        env: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('PG'))
      });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Test query
    const testResult = await pool.query('SELECT 1 as test');
    
    // If we get here, database is working
    const { method, url } = req;
    const path = url.replace('/api', '');

    // Simple test endpoints to verify functionality
    if (method === 'GET' && path === '/test') {
      return res.json({ 
        status: 'API working', 
        database: 'connected',
        testQuery: testResult.rows[0]
      });
    }

    if (method === 'GET' && path === '/roster') {
      const result = await pool.query('SELECT * FROM team_roster ORDER BY "firstName", "lastName"');
      return res.json(result.rows);
    }

    if (method === 'GET' && path === '/game') {
      const result = await pool.query('SELECT * FROM games WHERE "isActive" = true LIMIT 1');
      return res.json(result.rows[0] || null);
    }

    if (method === 'GET' && path === '/games') {
      const result = await pool.query('SELECT * FROM games ORDER BY date');
      return res.json(result.rows);
    }

    if (method === 'GET' && path === '/attendees') {
      const result = await pool.query('SELECT * FROM attendees ORDER BY "firstName", "lastName"');
      return res.json(result.rows);
    }

    if (method === 'GET' && path === '/stats') {
      const attendeesResult = await pool.query('SELECT * FROM attendees');
      const gameResult = await pool.query('SELECT * FROM games WHERE "isActive" = true LIMIT 1');
      
      const attendees = attendeesResult.rows;
      const game = gameResult.rows[0];
      
      const attending = attendees.filter(a => a.status === 'attending').length;
      const notAttending = attendees.filter(a => a.status === 'not_attending').length;
      
      return res.json({
        attending,
        notAttending,
        total: attendees.length,
        gameStatus: game?.isActive ? 'active' : 'upcoming'
      });
    }

    if (method === 'POST' && path === '/attendees') {
      const { firstName, lastName, status } = req.body;
      
      // Check if exists
      const existingResult = await pool.query(
        'SELECT id FROM attendees WHERE "firstName" = $1 AND "lastName" = $2',
        [firstName, lastName]
      );

      if (existingResult.rows.length > 0) {
        // Update
        const updateResult = await pool.query(
          'UPDATE attendees SET status = $1, "checkedInAt" = NOW() WHERE id = $2 RETURNING *',
          [status, existingResult.rows[0].id]
        );
        return res.json(updateResult.rows[0]);
      } else {
        // Insert
        const insertResult = await pool.query(
          'INSERT INTO attendees ("firstName", "lastName", status, "checkedInAt") VALUES ($1, $2, $3, NOW()) RETURNING *',
          [firstName, lastName, status]
        );
        return res.json(insertResult.rows[0]);
      }
    }

    // Route not found
    res.status(404).json({ error: 'Route not found', path, method });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
