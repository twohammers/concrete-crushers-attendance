import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAttendeeSchema, updateAttendeeSchema, insertGameSchema, insertRosterSchema, updateRosterSchema } from "@shared/schema";
import { z } from "zod";
import cron from "node-cron";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all attendees
  app.get("/api/attendees", async (_req, res) => {
    try {
      const attendees = await storage.getAttendees();
      res.json(attendees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendees" });
    }
  });

  // Create or update attendee
  app.post("/api/attendees", async (req, res) => {
    try {
      const data = insertAttendeeSchema.parse(req.body);
      
      // Check if attendee already exists
      const existing = await storage.getAttendeeByName(data.firstName, data.lastName);
      
      let attendee;
      if (existing) {
        // Update existing attendee
        attendee = await storage.updateAttendee({
          id: existing.id,
          ...data
        });
      } else {
        // Create new attendee
        attendee = await storage.createAttendee(data);
      }
      
      res.json(attendee);
    } catch (error) {
      console.error("Error in /api/attendees:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create/update attendee", details: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  // Remove attendee
  app.delete("/api/attendees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid attendee ID" });
      }
      
      await storage.removeAttendee(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove attendee" });
    }
  });

  // Clear all attendees
  app.delete("/api/attendees", async (_req, res) => {
    try {
      await storage.clearAllAttendees();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear attendees" });
    }
  });

  // Get active game
  app.get("/api/game", async (_req, res) => {
    try {
      const game = await storage.getActiveGame();
      if (!game) {
        return res.status(404).json({ error: "No active game found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game" });
    }
  });

  // Get attendance stats
  app.get("/api/stats", async (_req, res) => {
    try {
      const attendees = await storage.getAttendees();
      const attending = attendees.filter(a => a.status === 'in').length;
      const notAttending = attendees.filter(a => a.status === 'out').length;
      
      res.json({
        attending,
        notAttending,
        total: attendees.length,
        gameStatus: attending >= 10 ? 'Good to Play' : 'Need More Players'
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get all games
  app.get("/api/games", async (_req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  // Create new game (for CSV upload functionality)
  app.post("/api/games", async (req, res) => {
    try {
      const data = insertGameSchema.parse(req.body);
      const game = await storage.createGame(data);
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid game data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create game" });
      }
    }
  });

  // Set active game
  app.post("/api/games/:id/activate", async (req, res) => {
    try {
      const gameId = parseInt(req.params.id);
      if (isNaN(gameId)) {
        return res.status(400).json({ error: "Invalid game ID" });
      }
      
      await storage.setActiveGame(gameId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to set active game" });
    }
  });

  // Team roster routes
  app.get("/api/roster", async (_req, res) => {
    try {
      const roster = await storage.getTeamRoster();
      res.json(roster);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch team roster" });
    }
  });

  app.post("/api/roster", async (req, res) => {
    try {
      const data = insertRosterSchema.parse(req.body);
      
      // Check if team member already exists
      const existing = await storage.getTeamMemberByName(data.firstName, data.lastName);
      
      if (existing) {
        return res.status(400).json({ error: "Team member already exists" });
      }
      
      const member = await storage.createTeamMember(data);
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create team member" });
      }
    }
  });

  app.put("/api/roster/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid team member ID" });
      }
      
      const data = updateRosterSchema.parse({ ...req.body, id });
      const member = await storage.updateTeamMember(data);
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update team member" });
      }
    }
  });

  app.delete("/api/roster/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid team member ID" });
      }
      
      await storage.removeTeamMember(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove team member" });
    }
  });

  // Weekly reset functionality - runs every Saturday at 12:00 AM PST
  cron.schedule('0 0 * * 6', async () => {
    try {
      console.log('Running weekly reset...');
      
      // Clear all attendees
      await storage.clearAllAttendees();
      
      // Move to next game if available
      const nextGame = await storage.getNextGame();
      if (nextGame) {
        await storage.setActiveGame(nextGame.id);
        console.log(`Activated next game: ${nextGame.opponent}`);
      }
      
      console.log('Weekly reset completed');
    } catch (error) {
      console.error('Weekly reset failed:', error);
    }
  }, {
    timezone: "America/Los_Angeles"
  });

  const httpServer = createServer(app);
  return httpServer;
}
