import { supabase } from "./supabase";

export async function createGroup(name, passkey, owner) {
  const { data, error } = await supabase.rpc("create_group", {
    p_name: name,
    p_passkey: passkey,
    p_owner: owner,
  });
  return { id: data, error: error?.message };
}

export async function joinGroupWithPasskey(groupId, passkey, username) {
  const { data, error } = await supabase.rpc("join_group_with_passkey", {
    p_group_id: groupId,
    p_passkey: passkey,
    p_username: username,
  });
  return { success: !!data, error: error?.message };
}

export async function findGroupByName(name) {
  const { data, error } = await supabase
    .from("groups_public")
    .select("*")
    .ilike("name", name.trim())
    .maybeSingle();
  return { data, error: error?.message };
}

export async function inviteToGroup(groupId, username, invitedBy) {
  const { error } = await supabase
    .from("group_members")
    .upsert({ group_id: groupId, username, status: "pending", invited_by: invitedBy });
  return { error: error?.message };
}

export async function acceptInvite(groupId, username) {
  const { error } = await supabase
    .from("group_members")
    .update({ status: "accepted" })
    .eq("group_id", groupId)
    .eq("username", username);
  return { error: error?.message };
}

export async function declineInvite(groupId, username) {
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("username", username);
  return { error: error?.message };
}

export const leaveGroup = declineInvite;

export async function fetchMyGroups(username) {
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id,status")
    .eq("username", username);

  const acceptedIds = (memberships || []).filter((m) => m.status === "accepted").map((m) => m.group_id);
  const pendingIds = (memberships || []).filter((m) => m.status === "pending").map((m) => m.group_id);
  const allIds = [...acceptedIds, ...pendingIds];

  if (allIds.length === 0) return { groups: [], pendingGroups: [] };

  const { data: rows } = await supabase.from("groups_public").select("*").in("id", allIds);
  const groups = (rows || []).filter((g) => acceptedIds.includes(g.id));
  const pendingGroups = (rows || []).filter((g) => pendingIds.includes(g.id));
  return { groups, pendingGroups };
}

export async function fetchGroupMembers(groupId) {
  const { data: members } = await supabase
    .from("group_members")
    .select("username,status,invited_by")
    .eq("group_id", groupId)
    .eq("status", "accepted");

  const usernames = (members || []).map((m) => m.username);
  if (usernames.length === 0) return [];

  const { data: profiles } = await supabase.from("profiles").select("*").in("username", usernames);
  return profiles || [];
}
