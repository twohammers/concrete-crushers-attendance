# Free Deployment Guide: Supabase + Vercel

## Step 1: Create Supabase Project
1. Visit https://supabase.com and create account
2. Click "New Project" 
3. Choose organization and project name: "concrete-crushers-attendance"
4. Set database password (save this!)
5. Select region closest to your team
6. Wait 2-3 minutes for setup

## Step 2: Set Up Database
1. In Supabase dashboard, go to "SQL Editor"
2. Copy contents of `supabase-schema.sql` file
3. Paste into SQL Editor and click "RUN"
4. Verify tables created: attendees, team_roster, games

## Step 3: Get Connection String
1. Go to Settings > Database
2. Find "Connection string" section
3. Copy the connection string (URI format)
4. Replace `[YOUR-PASSWORD]` with your actual password
5. Save this - you'll need it for Vercel

## Step 4: Prepare Code for Deployment
1. Push your code to GitHub repository
2. Make sure `vercel.json` and updated `server/db.ts` are included

## Step 5: Deploy to Vercel
1. Visit https://vercel.com and sign up
2. Click "New Project" 
3. Import your GitHub repository
4. In "Environment Variables" section, add:
   - `DATABASE_URL` = (your Supabase connection string)
   - `NODE_ENV` = `production`
5. Click "Deploy"

## Step 6: Test Your App
1. Visit the Vercel URL provided
2. Test team member check-ins
3. Verify schedule displays correctly
4. Confirm database updates work

## Total Cost: $0/month
- Supabase: Free tier (500MB database, 50,000 monthly active users)
- Vercel: Free tier (100GB bandwidth, unlimited static sites)

Perfect for your 17-person softball team!