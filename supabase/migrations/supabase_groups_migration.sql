-- Run this in Supabase → SQL Editor → New query → Run.
-- Adds: multiple groups, hashed passkeys (never readable by the app),
-- and an invite/accept flow.

create extension if not exists pgcrypto;

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  passkey_hash text not null,
  created_by text not null references profiles(username),
  created_at timestamptz default now()
);

create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  username text references profiles(username) on delete cascade,
  status text not null default 'pending', -- 'pending' or 'accepted'
  invited_by text,
  created_at timestamptz default now(),
  primary key (group_id, username)
);

alter table groups enable row level security;
alter table group_members enable row level security;

-- The app is only ever allowed to see id/name/created_by — never passkey_hash.
create or replace view groups_public as
  select id, name, created_by, created_at from groups;

grant select on groups_public to anon, authenticated;

drop policy if exists "members select" on group_members;
drop policy if exists "members insert" on group_members;
drop policy if exists "members update" on group_members;
drop policy if exists "members delete" on group_members;

create policy "members select" on group_members for select using (true);
create policy "members insert" on group_members for insert with check (true);
create policy "members update" on group_members for update using (true);
create policy "members delete" on group_members for delete using (true);

-- Note: there is intentionally NO public select/insert policy on the raw
-- "groups" table. The only way to create a group or check a passkey is
-- through the two functions below, which run with elevated (security
-- definer) rights so they can read passkey_hash internally, but they never
-- return it to the app — only a true/false match result.

create or replace function create_group(p_name text, p_passkey text, p_owner text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_id uuid;
begin
  insert into groups (name, passkey_hash, created_by)
  values (p_name, crypt(p_passkey, gen_salt('bf')), p_owner)
  returning id into new_id;

  insert into group_members (group_id, username, status, invited_by)
  values (new_id, p_owner, 'accepted', p_owner);

  return new_id;
end;
$$;

create or replace function join_group_with_passkey(p_group_id uuid, p_passkey text, p_username text)
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
    insert into group_members (group_id, username, status, invited_by)
    values (p_group_id, p_username, 'accepted', p_username)
    on conflict (group_id, username) do update set status = 'accepted';
  end if;

  return coalesce(is_match, false);
end;
$$;

grant execute on function create_group(text, text, text) to anon, authenticated;
grant execute on function join_group_with_passkey(uuid, text, text) to anon, authenticated;

-- Lets only the group's creator delete it. Deleting a group also removes
-- all its members automatically (group_members has ON DELETE CASCADE).
create or replace function delete_group(p_group_id uuid, p_username text)
returns boolean
language plpgsql
security definer
as $$
declare
  is_owner boolean;
begin
  select (created_by = p_username) into is_owner
  from groups where id = p_group_id;

  if is_owner then
    delete from groups where id = p_group_id;
  end if;

  return coalesce(is_owner, false);
end;
$$;

grant execute on function delete_group(uuid, text) to anon, authenticated;
