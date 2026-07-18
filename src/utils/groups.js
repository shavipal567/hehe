import { supabase } from "./supabase";

async function currentUserId() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user?.id;
}

export async function createGroup(name, passkey, userId) {
  const resolvedId = userId || (await currentUserId());

  if (!resolvedId) {
    return { id: null, error: "Not authenticated" };
  }

  const { data, error } = await supabase.rpc("create_group", {
    p_name: name,
    p_passkey: passkey,
    p_owner_id: resolvedId,
  });

  return {
    id: data,
    error: error?.message,
  };
}


export async function joinGroupWithPasskey(groupId, passkey, userId) {
  const resolvedId = userId || (await currentUserId());

  if (!resolvedId) {
    return {
      success: false,
      error: "Not authenticated",
    };
  }

  const { data, error } = await supabase.rpc(
    "join_group_with_passkey",
    {
      p_group_id: groupId,
      p_passkey: passkey,
      p_user_id: resolvedId,
    }
  );

  return {
    success: !!data,
    error: error?.message,
  };
}


export async function fetchAllGroups() {
  const { data, error } = await supabase
    .from("groups_public")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  return {
    data: data || [],
    error: error?.message,
  };
}


export async function findGroupByName(name) {
  const { data, error } = await supabase
    .from("groups_public")
    .select("*")
    .ilike("name", name.trim())
    .maybeSingle();

  return {
    data,
    error: error?.message,
  };
}


export async function leaveGroup(groupId, userId) {
  const resolvedId = userId || (await currentUserId());

  const { data, error } = await supabase.rpc(
    "leave_group",
    {
      p_group_id: groupId,
      p_user_id: resolvedId,
    }
  );

  return {
    success: !error,
    error: error?.message,
  };
}


export async function deleteGroup(groupId, userId) {
  const resolvedId = userId || (await currentUserId());

  const { data, error } = await supabase.rpc(
    "delete_group",
    {
      p_group_id: groupId,
      p_user_id: resolvedId,
    }
  );

  return {
    success: !!data,
    error: error?.message,
  };
}


export async function fetchMyGroups(userId) {
  const resolvedId = userId || (await currentUserId());

  if (!resolvedId) {
    return {
      groups: [],
      pendingGroups: [],
      error: "Not authenticated",
    };
  }

  const { data: memberships, error } = await supabase
    .from("group_members")
    .select("group_id,status")
    .eq("user_id", resolvedId);

  if (error) {
    return {
      groups: [],
      pendingGroups: [],
      error: error.message,
    };
  }

  const ids = (memberships || [])
    .map((m) => m.group_id);

  if (!ids.length) {
    return {
      groups: [],
      pendingGroups: [],
    };
  }

  const { data: groups, error: groupError } = await supabase
    .from("groups_public")
    .select("*")
    .in("id", ids);

  return {
    groups: groups || [],
    pendingGroups: [],
    error: groupError?.message,
  };
}


export async function fetchGroupMembers(groupId) {
  const { data: members, error } = await supabase
    .from("group_members")
    .select("user_id,status")
    .eq("group_id", groupId)
    .eq("status", "accepted");

  if (error) {
    return [];
  }

  const ids = (members || [])
    .map((m) => m.user_id)
    .filter(Boolean);

  if (!ids.length) {
    return [];
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", ids);

  return profiles || [];
}