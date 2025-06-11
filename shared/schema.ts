import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const attendees = pgTable("attendees", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  status: text("status").notNull(), // 'in' or 'out'
  checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
});

export const teamRoster = pgTable("team_roster", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  opponent: text("opponent").notNull(),
  homeAway: text("home_away").notNull(), // 'home' or 'away'
  field: text("field").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertAttendeeSchema = createInsertSchema(attendees).omit({
  id: true,
  checkedInAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  isActive: true,
});

export const insertRosterSchema = createInsertSchema(teamRoster).omit({
  id: true,
});

export const updateAttendeeSchema = insertAttendeeSchema.extend({
  id: z.number(),
});

export const updateRosterSchema = insertRosterSchema.extend({
  id: z.number(),
});

export type InsertAttendee = z.infer<typeof insertAttendeeSchema>;
export type UpdateAttendee = z.infer<typeof updateAttendeeSchema>;
export type Attendee = typeof attendees.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertRoster = z.infer<typeof insertRosterSchema>;
export type UpdateRoster = z.infer<typeof updateRosterSchema>;
export type TeamMember = typeof teamRoster.$inferSelect;
