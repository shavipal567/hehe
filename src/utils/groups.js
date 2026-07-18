import { supabase } from "./supabase";


export async function createGroup(name, userId) {
  const { data, error } = await supabase.rpc("create_group", {
    p_name: name,
    p_owner_id: userId,
  });

  return {
    id: data,
    error: error?.message,
  };
}


export async function fetchAllGroups() {
  const { data, error } = await supabase
    .from("groups_public")
    .select("*")
    .order("created_at", { ascending: false });

  return {
    groups: data || [],
    error: error?.message,
  };
}


export async function findGroupByName(name) {
  const { data, error } = await supabase
    .from("groups_public")
    .select("*")
    .eq("name", name)
    .maybeSingle();

  return {
    data,
    error: error?.message,
  };
}


// User sends request to join

export async function requestJoinGroup(groupId, userId) {
  const { data, error } = await supabase.rpc(
    "request_join_group",
    {
      p_group_id: groupId,
      p_user_id: userId,
    }
  );

  return {
    success: !!data,
    error: error?.message,
  };
}


// Owner accepts request

export async function acceptGroupRequest(requestId) {
  const { data, error } = await supabase.rpc(
    "accept_group_request",
    {
      p_request_id: requestId,
    }
  );

  return {
    success: !!data,
    error: error?.message,
  };
}


export async function rejectGroupRequest(requestId) {
  const { data, error } = await supabase.rpc(
    "reject_group_request",
    {
      p_request_id: requestId,
    }
  );

  return {
    success: !!data,
    error: error?.message,
  };
}


// Owner invites user

export async function inviteUserToGroup(
  groupId,
  userId,
  invitedBy
) {
  const { data, error } = await supabase.rpc(
    "invite_user_to_group",
    {
      p_group_id: groupId,
      p_user_id: userId,
      p_invited_by: invitedBy,
    }
  );

  return {
    success: !!data,
    error: error?.message,
  };
}


// User accepts invite

export async function acceptGroupInvite(inviteId) {
  const { data, error } = await supabase.rpc(
    "accept_group_invite",
    {
      p_invite_id: inviteId,
    }
  );

  return {
    success: !!data,
    error: error?.message,
  };
}


export async function fetchMyGroups(userId) {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      group_id,
      groups_public(*)
    `)
    .eq("user_id", userId);


  return {
    groups:
      data?.map((x) => x.groups_public).filter(Boolean) || [],
    error: error?.message,
  };
}


export async function fetchGroupMembers(groupId) {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      user_id,
      profiles(*)
    `)
    .eq("group_id", groupId);


  if (error) return [];

  return data
    ?.map((x) => x.profiles)
    .filter(Boolean) || [];
}