-- Supabase Database Schema for Concrete Crushers Attendance App

-- Create attendees table
CREATE TABLE IF NOT EXISTS attendees (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in', 'out')),
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create team_roster table
CREATE TABLE IF NOT EXISTS team_roster (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  opponent TEXT NOT NULL,
  home_away TEXT NOT NULL CHECK (home_away IN ('home', 'away')),
  field TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Insert team roster data
INSERT INTO team_roster (first_name, last_name, is_active) VALUES
('Alyssa', 'Sherlock', true),
('Derrick', 'Chew', true),
('Emily', 'Rich', true),
('Francisco', 'Chavez', true),
('Hayden', 'Hogun', true),
('Honey', 'Torres', true),
('Jessica', 'Henriquez', true),
('Juan', 'Ramos', true),
('Kathy', 'Lininger', true),
('Michael', 'Sanchez', true),
('Omar', 'Banuelos', true),
('Robert', 'Hodes', true),
('Shannon', 'Bible', true),
('Skye', 'Lininger', true),
('Steven', 'Maciel', true),
('Tereasa', 'Ramos', true),
('Dahlia', 'More', false);

-- Insert games schedule
INSERT INTO games (opponent, date, time, field, home_away, is_active) VALUES
('Chico Islanders', '6/20/2025', '7:10 PM', 'Hooker Oak Park', 'home', true),
('Hignell Hooligans', '6/27/2025', '6:00 PM', 'Hooker Oak Park', 'home', false),
('Holiday Week - July 4th', '7/4/2025', 'No Games', 'N/A', 'home', false),
('Butte Roofing Company', '7/11/2025', '6:00 PM', 'Hooker Oak Park', 'away', false),
('Bat Habits', '7/18/2025', '9:30 PM', 'Hooker Oak Park', 'home', false),
('The Not So Glum Lot', '7/25/2025', '8:20 PM', 'Hooker Oak Park', 'away', false),
('Sticks and Chicks', '8/1/2025', '7:10 PM', 'Hooker Oak Park', 'home', false),
('Bat intentions', '8/8/2025', '8:20 PM', 'Hooker Oak Park', 'away', false),
('Chico Islanders', '8/15/2025', '9:30 PM', 'Hooker Oak Park', 'away', false);

-- Enable Row Level Security (RLS) - required for Supabase
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since this is a team app)
CREATE POLICY "Enable all operations for attendees" ON attendees FOR ALL USING (true);
CREATE POLICY "Enable all operations for team_roster" ON team_roster FOR ALL USING (true);
CREATE POLICY "Enable all operations for games" ON games FOR ALL USING (true);