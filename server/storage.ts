import { 
  attendees, 
  games,
  teamRoster,
  type Attendee, 
  type InsertAttendee,
  type UpdateAttendee,
  type Game,
  type InsertGame,
  type TeamMember,
  type InsertRoster,
  type UpdateRoster
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Attendee methods
  getAttendees(): Promise<Attendee[]>;
  getAttendeeByName(firstName: string, lastName: string): Promise<Attendee | undefined>;
  createAttendee(attendee: InsertAttendee): Promise<Attendee>;
  updateAttendee(attendee: UpdateAttendee): Promise<Attendee>;
  removeAttendee(id: number): Promise<void>;
  clearAllAttendees(): Promise<void>;
  
  // Game methods
  getActiveGame(): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  setActiveGame(gameId: number): Promise<void>;
  getNextGame(): Promise<Game | undefined>;
  
  // Team roster methods
  getTeamRoster(): Promise<TeamMember[]>;
  createTeamMember(member: InsertRoster): Promise<TeamMember>;
  updateTeamMember(member: UpdateRoster): Promise<TeamMember>;
  removeTeamMember(id: number): Promise<void>;
  getTeamMemberByName(firstName: string, lastName: string): Promise<TeamMember | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with default game data
    this.initializeDefaultGame();
  }

  private async initializeDefaultGame() {
    // Check if games already exist
    const existingGames = await db.select().from(games);
    if (existingGames.length > 0) {
      return; // Games already initialized
    }

    // Initialize all games from the schedule
    const gameData = [
      {
        opponent: "Chico Islanders",
        homeAway: "home" as const,
        field: "Hooker Oak Park, Chico, CA",
        date: "Friday, June 20th",
        time: "7:10 PM PST",
        isActive: true,
      },
      {
        opponent: "Hignell Hooligans",
        homeAway: "home" as const,
        field: "Hooker Oak Park, Chico, CA",
        date: "Friday, June 27th",
        time: "6:00 PM PST",
        isActive: false,
      },
      {
        opponent: "Holiday - July 4th, no games",
        homeAway: "home" as const,
        field: "No games scheduled",
        date: "Friday, July 4th",
        time: "Holiday",
        isActive: false,
      },
      {
        opponent: "Butte Roofing Company",
        homeAway: "away" as const,
        field: "Hooker Oak Park, Chico, CA",
        date: "Friday, July 11th",
        time: "6:00 PM PST",
        isActive: false,
      },
      {
        opponent: "Bat Habits",
        homeAway: "home" as const,
        field: "Hooker Oak Park, Chico, CA",
        date: "Friday, July 18th",
        time: "9:30 PM PST",
        isActive: false,
      },
      {
        opponent: "The Not So Glum Lot",
        homeAway: "away" as const,
        field: "Hooker Oak Park, Chico, CA",
        date: "Friday, July 25th",
        time: "8:20 PM PST",
        isActive: false,
      },
      {
        opponent: "Sticks and Chicks",
        homeAway: "home" as const,
        field: "Hooker Oak Park, Chico, CA",
        date: "Friday, August 1st",
        time: "7:10 PM PST",
        isActive: false,
      },
      {
        opponent: "Bat Intentions",
        homeAway: "away" as const,
        field: "Hooker Oak Park, Chico, CA",
        date: "Friday, August 8th",
        time: "8:20 PM PST",
        isActive: false,
      },
      {
        opponent: "Chico Islanders",
        homeAway: "away" as const,
        field: "Hooker Oak Park, Chico, CA",
        date: "Friday, August 15th",
        time: "9:30 PM PST",
        isActive: false,
      }
    ];

    await db.insert(games).values(gameData);
  }

  async getAttendees(): Promise<Attendee[]> {
    return await db.select().from(attendees).orderBy(desc(attendees.checkedInAt));
  }

  async getAttendeeByName(firstName: string, lastName: string): Promise<Attendee | undefined> {
    const result = await db.select().from(attendees)
      .where(and(
        eq(attendees.firstName, firstName),
        eq(attendees.lastName, lastName)
      ));
    return result[0] || undefined;
  }

  async createAttendee(insertAttendee: InsertAttendee): Promise<Attendee> {
    const [attendee] = await db
      .insert(attendees)
      .values(insertAttendee)
      .returning();
    return attendee;
  }

  async updateAttendee(updateAttendee: UpdateAttendee): Promise<Attendee> {
    const [attendee] = await db
      .update(attendees)
      .set({
        firstName: updateAttendee.firstName,
        lastName: updateAttendee.lastName,
        status: updateAttendee.status,
        checkedInAt: new Date()
      })
      .where(eq(attendees.id, updateAttendee.id))
      .returning();
    
    if (!attendee) {
      throw new Error("Attendee not found");
    }
    
    return attendee;
  }

  async removeAttendee(id: number): Promise<void> {
    await db.delete(attendees).where(eq(attendees.id, id));
  }

  async clearAllAttendees(): Promise<void> {
    await db.delete(attendees);
  }

  async getActiveGame(): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.isActive, true));
    return game || undefined;
  }

  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values({ ...insertGame, isActive: false })
      .returning();
    return game;
  }

  async setActiveGame(gameId: number): Promise<void> {
    // Set all games to inactive
    await db.update(games).set({ isActive: false });
    
    // Set the specified game to active
    await db.update(games)
      .set({ isActive: true })
      .where(eq(games.id, gameId));
  }

  async getNextGame(): Promise<Game | undefined> {
    const allGames = await this.getAllGames();
    const currentActiveIndex = allGames.findIndex(game => game.isActive);
    
    if (currentActiveIndex !== -1 && currentActiveIndex + 1 < allGames.length) {
      return allGames[currentActiveIndex + 1];
    }
    
    return undefined;
  }

  // Team roster methods
  async getTeamRoster(): Promise<TeamMember[]> {
    return await db.select().from(teamRoster).where(eq(teamRoster.isActive, true));
  }

  async createTeamMember(member: InsertRoster): Promise<TeamMember> {
    const [teamMember] = await db
      .insert(teamRoster)
      .values(member)
      .returning();
    return teamMember;
  }

  async updateTeamMember(member: UpdateRoster): Promise<TeamMember> {
    const [teamMember] = await db
      .update(teamRoster)
      .set({
        firstName: member.firstName,
        lastName: member.lastName,
        isActive: member.isActive
      })
      .where(eq(teamRoster.id, member.id))
      .returning();
    
    if (!teamMember) {
      throw new Error("Team member not found");
    }
    
    return teamMember;
  }

  async removeTeamMember(id: number): Promise<void> {
    await db.update(teamRoster)
      .set({ isActive: false })
      .where(eq(teamRoster.id, id));
  }

  async getTeamMemberByName(firstName: string, lastName: string): Promise<TeamMember | undefined> {
    const result = await db.select().from(teamRoster)
      .where(and(
        eq(teamRoster.firstName, firstName),
        eq(teamRoster.lastName, lastName),
        eq(teamRoster.isActive, true)
      ));
    return result[0] || undefined;
  }
}

export const storage = new DatabaseStorage();
