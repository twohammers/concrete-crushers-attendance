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
    // Data population endpoint
    if (method === 'POST' && path === '/populate') {
      const teamRoster = [
        { firstName: "Alyssa", lastName: "Sherlock", position: "Player", jerseyNumber: 1, gamesPlayed: 0, isActive: true },
        { firstName: "Derrick", lastName: "Chew", position: "Player", jerseyNumber: 2, gamesPlayed: 0, isActive: true },
        { firstName: "Emily", lastName: "Rich", position: "Player", jerseyNumber: 3, gamesPlayed: 0, isActive: true },
        { firstName: "Francisco", lastName: "Chavez", position: "Player", jerseyNumber: 4, gamesPlayed: 0, isActive: true },
        { firstName: "Hayden", lastName: "Hogun", position: "Player", jerseyNumber: 5, gamesPlayed: 0, isActive: true },
        { firstName: "Honey", lastName: "Torres", position: "Player", jerseyNumber: 6, gamesPlayed: 0, isActive: true },
        { firstName: "Jessica", lastName: "Henriquez", position: "Player", jerseyNumber: 7, gamesPlayed: 0, isActive: true },
        { firstName: "Juan", lastName: "Ramos", position: "Player", jerseyNumber: 8, gamesPlayed: 0, isActive: true },
        { firstName: "Kathy", lastName: "Lininger", position: "Player", jerseyNumber: 9, gamesPlayed: 0, isActive: true },
        { firstName: "Michael", lastName: "Sanchez", position: "Player", jerseyNumber: 10, gamesPlayed: 0, isActive: true },
        { firstName: "Omar", lastName: "Banuelos", position: "Player", jerseyNumber: 11, gamesPlayed: 0, isActive: true },
        { firstName: "Robert", lastName: "Hodes", position: "Player", jerseyNumber: 12, gamesPlayed: 0, isActive: true },
        { firstName: "Shannon", lastName: "Bible", position: "Player", jerseyNumber: 13, gamesPlayed: 0, isActive: true },
        { firstName: "Skye", lastName: "Lininger", position: "Player", jerseyNumber: 14, gamesPlayed: 0, isActive: true },
        { firstName: "Steven", lastName: "Maciel", position: "Player", jerseyNumber: 15, gamesPlayed: 0, isActive: true },
        { firstName: "Tereasa", lastName: "Ramos", position: "Player", jerseyNumber: 16, gamesPlayed: 0, isActive: true },
        { firstName: "Dahlia", lastName: "Moreno", position: "Alternate", jerseyNumber: 17, gamesPlayed: 0, isActive: false }
      ];

      const games = [
        { opponent: "Chico Islanders", homeAway: "Home", field: "Hooker Oak Park", date: "2025-06-20", time: "19:10", isActive: true },
        { opponent: "Hignell Hooligans", homeAway: "Home", field: "Hooker Oak Park", date: "2025-06-27", time: "18:00", isActive: false },
        { opponent: "Butte Roofing Company", homeAway: "Away", field: "Hooker Oak Park", date: "2025-07-11", time: "18:00", isActive: false },
        { opponent: "Bat Habits", homeAway: "Home", field: "Hooker Oak Park", date: "2025-07-18", time: "21:30", isActive: false },
        { opponent: "The Not So Glum Lot", homeAway: "Away", field: "Hooker Oak Park", date: "2025-07-25", time: "20:20", isActive: false },
        { opponent: "Sticks and Chicks", homeAway: "Home", field: "Hooker Oak Park", date: "2025-08-01", time: "19:10", isActive: false },
        { opponent: "Bat intentions", homeAway: "Away", field: "Hooker Oak Park", date: "2025-08-08", time: "20:20", isActive: false },
        { opponent: "Chico Islanders", homeAway: "Away", field: "Hooker Oak Park", date: "2025-08-15", time: "21:30", isActive: false }
      ];

      try {
        // Clear existing data
        const collections = ['teamRoster', 'games', 'attendees'];
        for (const collectionName of collections) {
          const snapshot = await getDocs(collection(db, collectionName));
          for (const docSnapshot of snapshot.docs) {
            await deleteDoc(docSnapshot.ref);
          }
        }

        // Add team roster
        for (const member of teamRoster) {
          await addDoc(collection(db, 'teamRoster'), member);
        }

        // Add games
        for (const game of games) {
          await addDoc(collection(db, 'games'), game);
        }

        return res.json({ 
          success: true, 
          message: `Populated ${teamRoster.length} team members and ${games.length} games` 
        });
      } catch (error) {
        return res.status(500).json({ 
          error: 'Population failed', 
          message: error instanceof Error ? error.message : String(error) 
        });
      }
    }
