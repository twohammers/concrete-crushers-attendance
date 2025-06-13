import { storage } from "./storage";
import { insertAttendeeSchema, updateAttendeeSchema, insertGameSchema, insertRosterSchema, updateRosterSchema } from "@shared/schema";
import { z } from "zod";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, url } = req;
  const path = url.replace('/api', '');

  try {
    // Route: GET /api/attendees
    if (method === 'GET' && path === '/attendees') {
      const attendees = await storage.getAttendees();
      return res.json(attendees);
    }

    // Route: POST /api/attendees
    if (method === 'POST' && path === '/attendees') {
      const data = insertAttendeeSchema.parse(req.body);
      const existing = await storage.getAttendeeByName(data.firstName, data.lastName);
      
      let attendee;
      if (existing) {
        attendee = await storage.updateAttendee({ id: existing.id, ...data });
      } else {
        attendee = await storage.createAttendee(data);
      }
      return res.json(attendee);
    }

    // Route: DELETE /api/attendees/:id
    if (method === 'DELETE' && path.startsWith('/attendees/')) {
      const id = parseInt(path.split('/')[2]);
      await storage.removeAttendee(id);
      return res.json({ success: true });
    }

    // Route: DELETE /api/attendees
    if (method === 'DELETE' && path === '/attendees') {
      await storage.clearAllAttendees();
      return res.json({ success: true });
    }

    // Route: GET /api/stats
    if (method === 'GET' && path === '/stats') {
      const attendees = await storage.getAttendees();
      const activeGame = await storage.getActiveGame();
      
      const attending = attendees.filter(a => a.status === 'attending').length;
      const notAttending = attendees.filter(a => a.status === 'not_attending').length;
      
      return res.json({
        attending,
        notAttending,
        total: attendees.length,
        gameStatus: activeGame?.status || 'upcoming'
      });
    }

    // Route: GET /api/game
    if (method === 'GET' && path === '/game') {
      const game = await storage.getActiveGame();
      return res.json(game);
    }

    // Route: POST /api/game
    if (method === 'POST' && path === '/game') {
      const data = insertGameSchema.parse(req.body);
      const game = await storage.createGame(data);
      await storage.setActiveGame(game.id);
      return res.json(game);
    }

    // Route: PUT /api/game/:id/activate
    if (method === 'PUT' && path.match(/\/game\/\d+\/activate/)) {
      const id = parseInt(path.split('/')[2]);
      await storage.setActiveGame(id);
      return res.json({ success: true });
    }

    // Route: GET /api/games
    if (method === 'GET' && path === '/games') {
      const games = await storage.getAllGames();
      return res.json(games);
    }

    // Route: GET /api/roster
    if (method === 'GET' && path === '/roster') {
      const roster = await storage.getTeamRoster();
      return res.json(roster);
    }

    // Route: POST /api/roster
    if (method === 'POST' && path === '/roster') {
      const data = insertRosterSchema.parse(req.body);
      const member = await storage.createTeamMember(data);
      return res.json(member);
    }

    // Route: PUT /api/roster/:id
    if (method === 'PUT' && path.startsWith('/roster/')) {
      const id = parseInt(path.split('/')[2]);
      const data = updateRosterSchema.parse(req.body);
      const member = await storage.updateTeamMember({ id, ...data });
      return res.json(member);
    }

    // Route: DELETE /api/roster/:id
    if (method === 'DELETE' && path.startsWith('/roster/')) {
      const id = parseInt(path.split('/')[2]);
      await storage.removeTeamMember(id);
      return res.json({ success: true });
    }

    // Route not found
    res.status(404).json({ error: 'Route not found' });

  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid data', details: error.errors });
    } else {
      res.status(500).json({ 
        error: 'Server error', 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  }
}
