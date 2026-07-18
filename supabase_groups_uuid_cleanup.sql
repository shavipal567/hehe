-- ================================================================
-- UUID Cleanup — Finalize V2 Groups Migration
-- Run AFTER supabase_groups_migration_v2.sql has been executed.
-- Drops legacy username-based FK constraints.
-- Updates RPCs to write NULL for legacy text columns.
-- Ownership is checked ONLY by created_by_user_id.
-- Does NOT drop any columns or delete any data.
-- ================================================================

-- ----------------------------------------------------------------
-- Step 1 — Drop legacy FK constraints that reference username/text columns
-- These were created by the original V1 schema and are no longer
-- needed now that user_id (UUID) columns are the source of truth.
-- ----------------------------------------------------------------
alter table groups drop constraint if exists groups_created_by_fkey;

alter table group_members drop constraint if exists group_members_username_fkey;
alter table group_members drop constraint if exists group_members_invited_by_fkey;

-- ----------------------------------------------------------------
-- Step 2 — Update create_group to write NULL for legacy text columns
-- created_by       → NULL  (no longer populated)
-- created_by_user_id → p_owner_user_id (source of truth)
-- group_members.username → NULL (no longer populated)
-- group_members.user_id  → p_owner_user_id (source of truth)
-- ----------------------------------------------------------------
create or replace function create_group(
  p_name text,
  p_passkey text,
  p_owner text,
  p_owner_user_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_id uuid;
begin
  insert into groups (name, passkey_hash, created_by, created_by_user_id)
  values (p_name, crypt(p_passkey, gen_salt('bf')), null, p_owner_user_id)
  returning id into new_id;

  insert into group_members (group_id, username, user_id, status, invited_by)
  values (new_id, null, p_owner_user_id, 'accepted', p_owner);

  return new_id;
end;
$$;

grant execute on function create_group(text, text, text, uuid) to anon, authenticated;

-- ----------------------------------------------------------------
-- Step 3 — Update join_group_with_passkey
-- Uses user_id (UUID) as the identity key for conflict detection.
-- If the user is already a member, updates their status.
-- If not, inserts a new row. This works correctly regardless of
-- whether the legacy username column is NULL or populated.
-- ----------------------------------------------------------------
create or replace function join_group_with_passkey(
  p_group_id uuid,
  p_passkey text,
  p_username text,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  is_match boolean;
begin
  select (passkey_hash = crypt(p_passkey, passkey_hash)) into is_match
  from groups where id = p_group_id;

  if is_match then
    if exists (select 1 from group_members where group_id = p_group_id and user_id = p_user_id) then
      update group_members set status = 'accepted' where group_id = p_group_id and user_id = p_user_id;
    else
      insert into group_members (group_id, username, user_id, status, invited_by)
      values (p_group_id, p_username, p_user_id, 'accepted', p_username);
    end if;
  end if;

  return coalesce(is_match, false);
end;
$$;

grant execute on function join_group_with_passkey(uuid, text, text, uuid) to anon, authenticated;

-- ----------------------------------------------------------------
-- Step 4 — Update delete_group
-- Ownership is checked ONLY by created_by_user_id (UUID).
-- The legacy created_by text column is no longer consulted.
-- ----------------------------------------------------------------
create or replace function delete_group(
  p_group_id uuid,
  p_username text,
  p_user_id uuid default null
)
returns boolean
language plpgsql
security definer
as $$
declare
  is_owner boolean;
begin
  select (created_by_user_id = p_user_id) into is_owner
  from groups where id = p_group_id;

  if is_owner then
    delete from groups where id = p_group_id;
  end if;

  return coalesce(is_owner, false);
end;
$$;

grant execute on function delete_group(uuid, text, uuid) to anon, authenticated;

-- ----------------------------------------------------------------
-- Step 5 — groups_public view
-- Already updated in V2 migration to include created_by_user_id.
--   select id, name, created_by, created_by_user_id, created_at
-- No changes required.
-- ----------------------------------------------------------------
