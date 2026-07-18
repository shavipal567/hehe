CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  passkey_hash text NOT NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE group_members (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'accepted',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_groups_owner_id ON groups(owner_id);
CREATE INDEX idx_groups_name ON groups(name);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);

DROP VIEW IF EXISTS groups_public;

CREATE VIEW groups_public AS
SELECT
  id,
  name,
  owner_id,
  created_at
FROM groups;

DROP FUNCTION IF EXISTS create_group(text, text, uuid);

CREATE OR REPLACE FUNCTION create_group(
  p_name text,
  p_passkey text,
  p_owner_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  INSERT INTO groups (name, passkey_hash, owner_id)
  VALUES (p_name, crypt(p_passkey, gen_salt('bf')), p_owner_id)
  RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, user_id, status)
  VALUES (v_group_id, p_owner_id, 'accepted')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN v_group_id;
END;
$$;

DROP FUNCTION IF EXISTS join_group_with_passkey(uuid, text, uuid);

CREATE OR REPLACE FUNCTION join_group_with_passkey(
  p_group_id uuid,
  p_passkey text,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_valid boolean;
BEGIN
  SELECT passkey_hash INTO v_hash
  FROM groups
  WHERE id = p_group_id;

  IF v_hash IS NULL THEN
    RETURN false;
  END IF;

  v_valid := (v_hash = crypt(p_passkey, v_hash));

  IF v_valid IS NOT TRUE THEN
    RETURN false;
  END IF;

  INSERT INTO group_members (group_id, user_id, status)
  VALUES (p_group_id, p_user_id, 'accepted')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN true;
END;
$$;

DROP FUNCTION IF EXISTS leave_group(uuid, uuid);

CREATE OR REPLACE FUNCTION leave_group(
  p_group_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM group_members
  WHERE group_id = p_group_id
    AND user_id = p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS delete_group(uuid, uuid);

CREATE OR REPLACE FUNCTION delete_group(
  p_group_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM groups
  WHERE id = p_group_id;

  IF v_owner_id IS NULL OR v_owner_id <> p_user_id THEN
    RETURN false;
  END IF;

  DELETE FROM groups
  WHERE id = p_group_id;

  RETURN true;
END;
$$;

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS groups_select_authenticated ON groups;
CREATE POLICY groups_select_authenticated
  ON groups
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS group_members_select_authenticated ON group_members;
CREATE POLICY group_members_select_authenticated
  ON group_members
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS group_members_insert_own ON group_members;
CREATE POLICY group_members_insert_own
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS group_members_delete_own ON group_members;
CREATE POLICY group_members_delete_own
  ON group_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON groups_public TO authenticated;

GRANT EXECUTE ON FUNCTION create_group(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION join_group_with_passkey(uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_group(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_group(uuid, uuid) TO authenticated;
GRANT SELECT ON groups TO authenticated;
GRANT SELECT ON group_members TO authenticated;
GRANT SELECT ON groups_public TO authenticated;
GRANT SELECT ON groups_public TO anon;