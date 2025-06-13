import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  deleteDoc,
  getDoc 
} from 'firebase/firestore';

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
        firebaseConfigured: true,
        timestamp: new Date().toISOString()
      });
    }

    // Firebase connection test
    if (method === 'GET' && path === '/test') {
      try {
        const { db } = await import('./firebase-config.js');
        
        // Test Firebase connection by creating a simple document
        const testDocRef = doc(db, 'test', 'connection');
        await setDoc(testDocRef, { timestamp: new Date(), test: true });
        
        // Read it back
        const docSnap = await getDoc(testDocRef);
        const data = docSnap.data();
        
        // Clean up
        await deleteDoc(testDocRef);
        
        return res.json({ 
          status: 'success',
          database: 'connected (firebase web)',
          time: data?.timestamp
        });
      } catch (firebaseError) {
        return res.status(500).json({ 
          error: 'Firebase connection failed',
          firebaseError: firebaseError instanceof Error ? firebaseError.message : String(firebaseError),
          suggestion: 'Check Firebase configuration'
        });
      }
    }

    const { db } = await import('./firebase-config.js');

    // Core endpoints for the app
    if (method === 'GET' && path === '/roster') {
      const rosterQuery = query(collection(db, 'teamRoster'), where('isActive', '==', true));
      const snapshot = await getDocs(rosterQuery);
      const roster = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      return res.json(roster);
    }

    if (method === 'GET' && path === '/game') {
      const gameQuery = query(collection(db, 'games'), where('isActive', '==', true), limit(1));
      const snapshot = await getDocs(gameQuery);
      const game = snapshot.docs.length > 0 ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null;
      return res.json(game);
    }

    if (method === 'GET' && path === '/games') {
      const gamesQuery = query(collection(db, 'games'), orderBy('date'));
      const snapshot = await getDocs(gamesQuery);
      const games = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      return res.json(games);
    }

    if (method === 'GET' && path === '/attendees') {
      const attendeesQuery = query(collection(db, 'attendees'), orderBy('checkedInAt', 'desc'));
      const snapshot = await getDocs(attendeesQuery);
      const attendees = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      return res.json(attendees);
    }

    if (method === 'GET' && path === '/stats') {
      const attendeesSnapshot = await getDocs(collection(db, 'attendees'));
      const attendees = attendeesSnapshot.docs.map((doc: any) => doc.data());
      
      const attending = attendees.filter((a: any) => a.status === 'attending').length;
      const notAttending = attendees.filter((a: any) => a.status === 'not_attending').length;
      
      const gameQuery = query(collection(db, 'games'), where('isActive', '==', true), limit(1));
      const gameSnapshot = await getDocs(gameQuery);
      
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
      const existingQuery = query(
        collection(db, 'attendees'),
        where('firstName', '==', firstName),
        where('lastName', '==', lastName)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        // Update existing attendee
        const docRef = existingSnapshot.docs[0].ref;
        const updateData = {
          status,
          checkedInAt: new Date()
        };
        await updateDoc(docRef, updateData);
        
        const updatedDoc = await getDoc(docRef);
        return res.json({ id: updatedDoc.id, ...updatedDoc.data() });
      } else {
        // Create new attendee
        const newAttendee = {
          firstName,
          lastName,
          status,
          checkedInAt: new Date()
        };
        const docRef = await addDoc(collection(db, 'attendees'), newAttendee);
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
