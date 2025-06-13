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
        hasFirebase: !!process.env.FIREBASE_PROJECT_ID,
        envKeys: Object.keys(process.env).filter(k => k.includes('FIREBASE')),
        allEnvKeys: Object.keys(process.env).length,
        timestamp: new Date().toISOString(),
        projectId: process.env.FIREBASE_PROJECT_ID || 'not found',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'present' : 'missing'
      });
    }
    // Check if Firebase environment variables exist  
    if (!process.env.FIREBASE_PROJECT_ID) {
      return res.status(500).json({ 
        error: 'Firebase environment variables not found',
        required: ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL']
      });
    }

    // Firebase connection test
    if (method === 'GET' && path === '/test') {
      try {
        const { db } = await import('./firebase.js');
        
        // Test Firebase connection by creating a simple document
        const testDoc = db.collection('test').doc('connection');
        await testDoc.set({ timestamp: new Date(), test: true });
        
        // Read it back
        const doc = await testDoc.get();
        const data = doc.data();
        
        // Clean up
        await testDoc.delete();
        
        return res.json({ 
          status: 'success',
          database: 'connected (firebase)',
          time: data?.timestamp,
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } catch (firebaseError) {
        return res.status(500).json({ 
          error: 'Firebase connection failed',
          firebaseError: firebaseError instanceof Error ? firebaseError.message : String(firebaseError),
          suggestion: 'Check Firebase environment variables'
        });
      }
    }

    const { db } = await import('./firebase.js');

    // Core endpoints for the app
    if (method === 'GET' && path === '/roster') {
      const snapshot = await db.collection('teamRoster').where('isActive', '==', true).get();
      const roster = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(roster);
    }

    if (method === 'GET' && path === '/game') {
      const snapshot = await db.collection('games').where('isActive', '==', true).limit(1).get();
      const game = snapshot.docs.length > 0 ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null;
      return res.json(game);
    }

    if (method === 'GET' && path === '/games') {
      const snapshot = await db.collection('games').orderBy('date').get();
      const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(games);
    }

    if (method === 'GET' && path === '/attendees') {
      const snapshot = await db.collection('attendees').orderBy('checkedInAt', 'desc').get();
      const attendees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.json(attendees);
    }

    if (method === 'GET' && path === '/stats') {
      const snapshot = await db.collection('attendees').get();
      const attendees = snapshot.docs.map(doc => doc.data());
      
      const attending = attendees.filter(a => a.status === 'attending').length;
      const notAttending = attendees.filter(a => a.status === 'not_attending').length;
      
      const gameSnapshot = await db.collection('games').where('isActive', '==', true).limit(1).get();
      
      return res.json({
        attending,
        notAttending,
        total: attendees.length,
        gameStatus: gameSnapshot.docs.length > 0 ? 'active' : 'upcoming'
      });
    }

    if (method === 'POST' && path === '/attendees') {
      const { firstName, lastName, status } = req.body;
      
      // Check if attendee already exists
      const existingSnapshot = await db.collection('attendees')
        .where('firstName', '==', firstName)
        .where('lastName', '==', lastName)
        .get();

      if (!existingSnapshot.empty) {
        // Update existing attendee
        const docRef = existingSnapshot.docs[0].ref;
        const updateData = {
          status,
          checkedInAt: new Date()
        };
        await docRef.update(updateData);
        
        const updatedDoc = await docRef.get();
        return res.json({ id: updatedDoc.id, ...updatedDoc.data() });
      } else {
        // Create new attendee
        const newAttendee = {
          firstName,
          lastName,
          status,
          checkedInAt: new Date()
        };
        const docRef = await db.collection('attendees').add(newAttendee);
        return res.json({ id: docRef.id, ...newAttendee });
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
