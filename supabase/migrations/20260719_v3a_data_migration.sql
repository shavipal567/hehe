-- ============================================================
-- GRIND Version 3A
-- Data Layer Migration
-- Migrates business data from AsyncStorage to Supabase
-- Date: 2026-07-19
-- ============================================================

-- ------------------------------------------------------------
-- 1. Subjects
-- Each user can define study subjects with a name and color
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS subjects_select_own ON subjects;
CREATE POLICY subjects_select_own
  ON subjects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS subjects_insert_own ON subjects;
CREATE POLICY subjects_insert_own
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS subjects_update_own ON subjects;
CREATE POLICY subjects_update_own
  ON subjects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS subjects_delete_own ON subjects;
CREATE POLICY subjects_delete_own
  ON subjects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 2. Tasks (Planner / Calendar todos)
-- Each task belongs to a user and is associated with a date
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_select_own ON tasks;
CREATE POLICY tasks_select_own
  ON tasks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS tasks_insert_own ON tasks;
CREATE POLICY tasks_insert_own
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS tasks_update_own ON tasks;
CREATE POLICY tasks_update_own
  ON tasks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS tasks_delete_own ON tasks;
CREATE POLICY tasks_delete_own
  ON tasks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 3. Notes (Sticky notes)
-- Each note has a color and rotation for visual display
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  color text NOT NULL,
  rotation integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notes_select_own ON notes;
CREATE POLICY notes_select_own
  ON notes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notes_insert_own ON notes;
CREATE POLICY notes_insert_own
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notes_update_own ON notes;
CREATE POLICY notes_update_own
  ON notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notes_delete_own ON notes;
CREATE POLICY notes_delete_own
  ON notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 4. Study Sessions
-- Tracks each study session with duration, mode, and optional subject
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  seconds integer NOT NULL,
  mode text NOT NULL DEFAULT 'stopwatch',
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(date);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS study_sessions_select_own ON study_sessions;
CREATE POLICY study_sessions_select_own
  ON study_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS study_sessions_insert_own ON study_sessions;
CREATE POLICY study_sessions_insert_own
  ON study_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS study_sessions_update_own ON study_sessions;
CREATE POLICY study_sessions_update_own
  ON study_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS study_sessions_delete_own ON study_sessions;
CREATE POLICY study_sessions_delete_own
  ON study_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 5. Pomodoro preferences on profiles table
-- ------------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pomodoro_work_minutes integer NOT NULL DEFAULT 25;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pomodoro_break_minutes integer NOT NULL DEFAULT 5;
