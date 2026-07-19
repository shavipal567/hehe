-- ============================================================
-- GRIND
-- UUID Profile Migration
-- Date: 2026-07-19
-- ============================================================

---------------------------------------------------------------
-- 1. Backup profiles (Run once before migration)
---------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles_backup AS
SELECT *
FROM profiles;

---------------------------------------------------------------
-- 2. Preserve existing study data
---------------------------------------------------------------

UPDATE profiles
SET id = '22f1a157-7402-4ec0-badb-5517c6c41b61'
WHERE username = 'drshavi';

---------------------------------------------------------------
-- 3. Make UUID the primary key
---------------------------------------------------------------

ALTER TABLE profiles
DROP CONSTRAINT profiles_pkey;

ALTER TABLE profiles
ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

ALTER TABLE profiles
ADD CONSTRAINT profiles_username_key UNIQUE (username);

ALTER TABLE profiles
ALTER COLUMN id SET NOT NULL;

---------------------------------------------------------------
-- 4. Automatically create profile after signup
---------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_username text;
BEGIN

    new_username := split_part(NEW.email, '@', 1);

    WHILE EXISTS (
        SELECT 1
        FROM profiles
        WHERE username = new_username
    )
    LOOP
        new_username := new_username || floor(random()*10000)::text;
    END LOOP;

    INSERT INTO profiles (
        id,
        username,
        display_name,
        total_seconds
    )
    VALUES (
        NEW.id,
        new_username,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            new_username
        ),
        0
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;

END;
$$;

---------------------------------------------------------------
-- 5. Create trigger
---------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

---------------------------------------------------------------
-- 6. Grant permissions
---------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;