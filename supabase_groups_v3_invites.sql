-- ============================================================
-- Groups V3
-- Invite + Join Request System
-- Removes passkey dependency
-- UUID based identity
-- ============================================================


-- ------------------------------------------------------------
-- 1. Remove passkey from groups
-- ------------------------------------------------------------

ALTER TABLE groups
DROP COLUMN IF EXISTS passkey_hash;


-- ------------------------------------------------------------
-- 2. Create group_members clean structure
-- ------------------------------------------------------------

ALTER TABLE group_members
DROP COLUMN IF EXISTS status;


ALTER TABLE group_members
DROP COLUMN IF EXISTS joined_at;


ALTER TABLE group_members
ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();



-- ------------------------------------------------------------
-- 3. Group Join Requests
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS group_requests (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  group_id uuid NOT NULL
    REFERENCES groups(id)
    ON DELETE CASCADE,

  user_id uuid NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'pending',

  created_at timestamptz DEFAULT now(),

  UNIQUE(group_id,user_id)
);



-- ------------------------------------------------------------
-- 4. Group Invitations
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS group_invites (

  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  group_id uuid NOT NULL
    REFERENCES groups(id)
    ON DELETE CASCADE,

  invited_user_id uuid NOT NULL
    REFERENCES profiles(id)
    ON DELETE CASCADE,

  invited_by uuid NOT NULL
    REFERENCES profiles(id),

  status text NOT NULL DEFAULT 'pending',

  created_at timestamptz DEFAULT now(),

  UNIQUE(group_id, invited_user_id)
);



-- ------------------------------------------------------------
-- 5. Replace create_group
-- ------------------------------------------------------------

DROP FUNCTION IF EXISTS create_group(text,text,uuid);


CREATE OR REPLACE FUNCTION create_group(
 p_name text,
 p_owner_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

DECLARE
 v_group uuid;

BEGIN

 INSERT INTO groups(name,owner_id)
 VALUES(p_name,p_owner_id)
 RETURNING id INTO v_group;


 INSERT INTO group_members(group_id,user_id)
 VALUES(v_group,p_owner_id);


 RETURN v_group;

END;

$$;



-- ------------------------------------------------------------
-- 6. Request to join group
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION request_join_group(
 p_group_id uuid,
 p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

BEGIN

 INSERT INTO group_requests(
 group_id,
 user_id
 )

 VALUES(
 p_group_id,
 p_user_id
 )

 ON CONFLICT(group_id,user_id)
 DO UPDATE SET status='pending';


 RETURN true;

END;

$$;



-- ------------------------------------------------------------
-- 7. Accept join request
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION accept_group_request(
 p_request_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$

DECLARE
 r group_requests;

BEGIN

 SELECT *
 INTO r
 FROM group_requests
 WHERE id=p_request_id;


 IF r.id IS NULL THEN
 RETURN false;
 END IF;


 INSERT INTO group_members(
 group_id,
 user_id
 )

 VALUES(
 r.group_id,
 r.user_id
 )

 ON CONFLICT DO NOTHING;


 UPDATE group_requests
 SET status='accepted'
 WHERE id=p_request_id;


 RETURN true;

END;

$$;



-- ------------------------------------------------------------
-- 8. Reject join request
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION reject_group_request(
 p_request_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$

BEGIN

 UPDATE group_requests
 SET status='rejected'
 WHERE id=p_request_id;


 RETURN true;

END;

$$;



-- ------------------------------------------------------------
-- 9. Send invite
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION invite_user_to_group(
 p_group_id uuid,
 p_user_id uuid,
 p_invited_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$

BEGIN

 INSERT INTO group_invites(
 group_id,
 invited_user_id,
 invited_by
 )

 VALUES(
 p_group_id,
 p_user_id,
 p_invited_by
 )

 ON CONFLICT(group_id,invited_user_id)
 DO UPDATE SET status='pending';


 RETURN true;

END;

$$;



-- ------------------------------------------------------------
-- 10. Accept invite
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION accept_group_invite(
 p_invite_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$

DECLARE
 i group_invites;

BEGIN

 SELECT *
 INTO i
 FROM group_invites
 WHERE id=p_invite_id;


 IF i.id IS NULL THEN
 RETURN false;
 END IF;


 INSERT INTO group_members(
 group_id,
 user_id
 )
 VALUES(
 i.group_id,
 i.invited_user_id
 )
 ON CONFLICT DO NOTHING;


 UPDATE group_invites
 SET status='accepted'
 WHERE id=p_invite_id;


 RETURN true;

END;

$$;



-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

ALTER TABLE group_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invites ENABLE ROW LEVEL SECURITY;


CREATE POLICY "requests read"
ON group_requests
FOR SELECT
TO authenticated
USING(true);


CREATE POLICY "invites read"
ON group_invites
FOR SELECT
TO authenticated
USING(true);


GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;