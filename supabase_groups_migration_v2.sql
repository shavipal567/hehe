-- ================================================================
-- Version 2 — Link auth.users to profiles and groups
-- Run in Supabase → SQL Editor.
-- Preserves all existing columns and data for safe rollback.
-- ================================================================

-- ----------------------------------------------------------------
-- Step 1 — Add id column to existing profiles table
-- ----------------------------------------------------------------
alter table profiles add column if not exists id uuid unique references auth.users(id) on delete cascade;

-- ----------------------------------------------------------------
-- Step 2 — Trigger: auto-create profile row on signup
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, total_seconds)
  values (
    new.id,
    null,
    coalesce(new.raw_user_meta_data ->> 'name', 'User'),
    0
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------
-- Step 3 — Add user_id columns to groups and group_members
-- ----------------------------------------------------------------
alter table groups add column if not exists created_by_user_id uuid references profiles(id);
alter table group_members add column if not exists user_id uuid references profiles(id);
alter table group_members add column if not exists invited_by_user_id uuid references profiles(id);

-- ----------------------------------------------------------------
-- Step 4 — Update groups_public view to expose created_by_user_id
-- ----------------------------------------------------------------
drop view if exists groups_public;
create view groups_public as
  select id, name, created_by, created_by_user_id, created_at
  from groups;

grant select on groups_public to anon, authenticated;

-- ----------------------------------------------------------------
-- Step 5 — Update RPC: create_group
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
  values (p_name, crypt(p_passkey, gen_salt('bf')), p_owner, p_owner_user_id)
  returning id into new_id;

  insert into group_members (group_id, username, user_id, status, invited_by)
  values (new_id, p_owner, p_owner_user_id, 'accepted', p_owner);

  return new_id;
end;
$$;

grant execute on function create_group(text, text, text, uuid) to anon, authenticated;

-- ----------------------------------------------------------------
-- Step 6 — Update RPC: join_group_with_passkey
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
    insert into group_members (group_id, username, user_id, status, invited_by)
    values (p_group_id, p_username, p_user_id, 'accepted', p_username)
    on conflict (group_id, username) do update set status = 'accepted', user_id = excluded.user_id;
  end if;

  return coalesce(is_match, false);
end;
$$;

grant execute on function join_group_with_passkey(uuid, text, text, uuid) to anon, authenticated;

-- ----------------------------------------------------------------
-- Step 7 — Update RPC: delete_group
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
  select (
    created_by = p_username
    or (p_user_id is not null and created_by_user_id = p_user_id)
  ) into is_owner
  from groups where id = p_group_id;

  if is_owner then
    delete from groups where id = p_group_id;
  end if;

  return coalesce(is_owner, false);
end;
$$;

grant execute on function delete_group(uuid, text, uuid) to anon, authenticated;
