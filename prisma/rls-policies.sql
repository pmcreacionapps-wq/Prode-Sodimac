-- =============================================================
-- Supabase Row Level Security (RLS) Policies
-- Next World Cup Prode — Next English Institute
-- Run this in Supabase SQL Editor after running prisma db push
-- =============================================================

-- NOTE: All DB operations go through the Prisma service-role client
-- (SUPABASE_SERVICE_ROLE_KEY) which bypasses RLS. The policies below
-- are a defence-in-depth layer for direct Supabase client access.

-- ---------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------
ALTER TABLE "User"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Match"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prediction"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SemifinalistPick" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WeeklyScore"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RankingHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Badge"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserBadge"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Announcement"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminSettings" ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------
-- Teams & Matches — public read
-- ---------------------------------------------------------------
CREATE POLICY "teams_public_read" ON "Team"
  FOR SELECT USING (true);

CREATE POLICY "matches_public_read" ON "Match"
  FOR SELECT USING (true);

-- ---------------------------------------------------------------
-- Announcements — public read
-- ---------------------------------------------------------------
CREATE POLICY "announcements_public_read" ON "Announcement"
  FOR SELECT USING (true);

-- ---------------------------------------------------------------
-- Users — public read of non-sensitive fields, own row full access
-- ---------------------------------------------------------------
CREATE POLICY "users_public_read" ON "User"
  FOR SELECT USING (true);

CREATE POLICY "users_own_update" ON "User"
  FOR UPDATE USING (auth.uid()::text = "supabaseId");

-- ---------------------------------------------------------------
-- Predictions — read own only, insert/update own only
-- ---------------------------------------------------------------
CREATE POLICY "predictions_own_read" ON "Prediction"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "userId" AND u."supabaseId" = auth.uid()::text
    )
  );

CREATE POLICY "predictions_own_insert" ON "Prediction"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "userId" AND u."supabaseId" = auth.uid()::text
    )
  );

CREATE POLICY "predictions_own_update" ON "Prediction"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "userId" AND u."supabaseId" = auth.uid()::text
    )
  );

-- ---------------------------------------------------------------
-- SemifinalistPick — own only
-- ---------------------------------------------------------------
CREATE POLICY "semipick_own_read" ON "SemifinalistPick"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "userId" AND u."supabaseId" = auth.uid()::text
    )
  );

CREATE POLICY "semipick_own_write" ON "SemifinalistPick"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "userId" AND u."supabaseId" = auth.uid()::text
    )
  );

-- ---------------------------------------------------------------
-- Notifications — own only
-- ---------------------------------------------------------------
CREATE POLICY "notifications_own_read" ON "Notification"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "userId" AND u."supabaseId" = auth.uid()::text
    )
  );

CREATE POLICY "notifications_own_update" ON "Notification"
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM "User" u
      WHERE u.id = "userId" AND u."supabaseId" = auth.uid()::text
    )
  );

-- ---------------------------------------------------------------
-- Rankings & Scores — public read
-- ---------------------------------------------------------------
CREATE POLICY "weekly_scores_public_read" ON "WeeklyScore"
  FOR SELECT USING (true);

CREATE POLICY "ranking_history_public_read" ON "RankingHistory"
  FOR SELECT USING (true);

-- ---------------------------------------------------------------
-- Badges & UserBadges — public read
-- ---------------------------------------------------------------
CREATE POLICY "badges_public_read" ON "Badge"
  FOR SELECT USING (true);

CREATE POLICY "user_badges_public_read" ON "UserBadge"
  FOR SELECT USING (true);

-- ---------------------------------------------------------------
-- AdminSettings — public read (settings like registrationOpen need to be readable)
-- ---------------------------------------------------------------
CREATE POLICY "admin_settings_public_read" ON "AdminSettings"
  FOR SELECT USING (true);

-- ---------------------------------------------------------------
-- Service role bypass (for Prisma server actions)
-- All policies above are automatically bypassed by service_role key
-- ---------------------------------------------------------------
