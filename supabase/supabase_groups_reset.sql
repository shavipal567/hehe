-- ================================================================
-- Groups Reset — Drop and recreate groups backend
-- Drops views, functions (all overloads), and tables.
-- Does NOT touch auth.users, profiles, or authentication.
-- ================================================================

-- ----------------------------------------------------------------
-- Step 1 — Drop view
-- ----------------------------------------------------------------
drop view if exists groups_public cascade;

-- ----------------------------------------------------------------
-- Step 2 — Drop all function overloads by full signature
-- ----------------------------------------------------------------
drop function if exists create_group(text, text, text) cascade;
drop function if exists create_group(text, text, text, uuid) cascade;

drop function if exists join_group_with_passkey(uuid, text, text) cascade;
drop function if exists join_group_with_passkey(uuid, text, text, uuid) cascade;

drop function if exists delete_group(uuid, text) cascade;
drop function if exists delete_group(uuid, text, uuid) cascade;

-- ----------------------------------------------------------------
-- Step 3 — Drop tables in dependency order
-- ----------------------------------------------------------------
drop table if exists group_members cascade;
drop table if exists groups cascade;
