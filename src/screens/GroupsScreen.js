import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from "react-native";
import { useStudy } from "../context/StudyContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabase";
import {
  createGroup,
  fetchAllGroups,
  findGroupByName,
  fetchMyGroups,
  fetchGroupMembers,
  requestJoinGroup,
  acceptGroupRequest,
  rejectGroupRequest,
  inviteUserToGroup,
  acceptGroupInvite,
} from "../utils/groups";
import SkyBackground from "../components/SkyBackground";
import { getTheme, cardShadow } from "../theme";

const MEDALS = ["🥇", "🥈", "🥉"];

function formatHours(totalSeconds) {
  return `${(totalSeconds / 3600).toFixed(1)}h`;
}

export default function GroupsScreen() {
  const { darkMode } = useStudy();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme);
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        {selectedGroup ? (
          <GroupDetail
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <GroupsList onOpenGroup={setSelectedGroup} />
        )}
      </SafeAreaView>
    </SkyBackground>
  );
}

function GroupsList({ onOpenGroup }) {
  const { darkMode } = useStudy();
  const { user } = useAuth();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme);

  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  const [discoverSearch, setDiscoverSearch] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);

  const [joinBusyId, setJoinBusyId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);

    const [{ groups: myGroups }, { groups: all }] = await Promise.all([
      fetchMyGroups(user.id),
      fetchAllGroups(),
    ]);
    setGroups(myGroups || []);
    setAllGroups(all || []);

    const ownedIds = (myGroups || []).filter((g) => g.owner_id === user.id).map((g) => g.id);

    const [{ data: inviteRows }, { data: requestRows }] = await Promise.all([
      supabase
        .from("group_invites")
        .select("id, group_id, invited_by, groups_public(name)")
        .eq("invited_user_id", user.id)
        .eq("status", "pending"),
      ownedIds.length > 0
        ? supabase
            .from("group_requests")
            .select("id, group_id, user_id, profiles(username), groups_public(name)")
            .in("group_id", ownedIds)
            .eq("status", "pending")
        : Promise.resolve({ data: [] }),
    ]);

    setInvitations(inviteRows || []);
    setJoinRequests(requestRows || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("group-members-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "groups" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_invites" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_requests" }, () => refresh())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refresh]);

  const myGroupIds = new Set(groups.map((g) => g.id));
  const discoverable = allGroups
    .filter((g) => !myGroupIds.has(g.id))
    .filter((g) => (g.name || "").toLowerCase().includes(discoverSearch.trim().toLowerCase()));

  const handleCreate = async () => {
    setCreateError("");
    if (!createName.trim()) {
      setCreateError("Enter a group name.");
      return;
    }
    setCreateBusy(true);
    const { error } = await createGroup(createName.trim(), user.id);
    setCreateBusy(false);
    if (error) {
      setCreateError(error.includes("duplicate") || error.includes("unique") ? "That group name is taken — try another." : error);
      return;
    }
    setCreateName("");
    setShowCreate(false);
    refresh();
  };

  const handleSearch = async () => {
    if (!discoverSearch.trim()) return;
    setSearchBusy(true);
    const { data, error } = await findGroupByName(discoverSearch.trim());
    setSearchBusy(false);
    if (!error && data && !allGroups.some((g) => g.id === data.id)) {
      setAllGroups((prev) => [data, ...prev]);
    }
  };

  const handleRequestJoin = async (group) => {
    setJoinBusyId(group.id);
    const { success, error } = await requestJoinGroup(group.id, user.id);
    setJoinBusyId(null);
    if (error || !success) {
      Alert.alert("Couldn't send request", error || "Please try again.");
      return;
    }
    Alert.alert("Request sent", `Your request to join "${group.name}" is pending approval.`);
    refresh();
  };

  const handleAcceptInvite = async (invite) => {
    const { success, error } = await acceptGroupInvite(invite.id);
    if (!success) {
      Alert.alert("Couldn't accept invite", error || "Please try again.");
      return;
    }
    refresh();
  };

  const handleRejectInvite = async (invite) => {
    const { error } = await supabase
      .from("group_invites")
      .update({ status: "rejected" })
      .eq("id", invite.id);
    if (error) {
      Alert.alert("Couldn't reject invite", error.message);
      return;
    }
    refresh();
  };

  const handleAcceptRequest = async (request) => {
    const { success, error } = await acceptGroupRequest(request.id);
    if (!success) {
      Alert.alert("Couldn't accept request", error || "Please try again.");
      return;
    }
    refresh();
  };

  const handleRejectRequest = async (request) => {
    const { success, error } = await rejectGroupRequest(request.id);
    if (!success) {
      Alert.alert("Couldn't reject request", error || "Please try again.");
      return;
    }
    refresh();
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>Study Groups 🏆</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowCreate((v) => !v)}>
          <Text style={styles.actionButtonText}>+ Create a group</Text>
        </TouchableOpacity>
      </View>

      {showCreate && (
        <View style={styles.formCard}>
          <TextInput
            style={styles.formInput} placeholder="Group name" placeholderTextColor={theme.muted}
            value={createName} onChangeText={setCreateName}
          />
          {!!createError && <Text style={styles.errorText}>{createError}</Text>}
          <TouchableOpacity style={styles.formSubmit} onPress={handleCreate} disabled={createBusy}>
            {createBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.formSubmitText}>Create</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={theme.primary} />
      ) : (
        <FlatList
          data={[]}
          ListHeaderComponent={
            <>
              {invitations.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.sectionLabel}>Invitations</Text>
                  {invitations.map((inv) => (
                    <View key={inv.id} style={styles.inviteRow}>
                      <Text style={styles.inviteName}>{inv.groups_public?.name}</Text>
                      <TouchableOpacity onPress={() => handleAcceptInvite(inv)} style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRejectInvite(inv)}>
                        <Text style={styles.declineText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {joinRequests.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.sectionLabel}>Join Requests</Text>
                  {joinRequests.map((req) => (
                    <View key={req.id} style={styles.inviteRow}>
                      <Text style={styles.inviteName}>
                        {req.profiles?.username || "Someone"} → {req.groups_public?.name}
                      </Text>
                      <TouchableOpacity onPress={() => handleAcceptRequest(req)} style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRejectRequest(req)}>
                        <Text style={styles.declineText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Text style={styles.sectionLabel}>My groups</Text>
              {groups.length === 0 ? (
                <Text style={styles.empty}>You haven't joined any groups yet.</Text>
              ) : (
                groups.map((g) => (
                  <TouchableOpacity key={g.id} style={styles.groupRow} onPress={() => onOpenGroup(g)}>
                    <Text style={styles.groupName}>{g.name}</Text>
                    <Text style={styles.groupArrow}>›</Text>
                  </TouchableOpacity>
                ))
              )}

              <Text style={styles.sectionLabel}>Discover groups</Text>
              <View style={styles.inviteRow2}>
                <TextInput
                  style={styles.input}
                  placeholder="Search group name..."
                  placeholderTextColor={theme.muted}
                  value={discoverSearch}
                  onChangeText={setDiscoverSearch}
                  onSubmitEditing={handleSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleSearch} disabled={searchBusy}>
                  {searchBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.addButtonText}>Search</Text>}
                </TouchableOpacity>
              </View>

              {discoverable.length === 0 ? (
                <Text style={styles.empty}>
                  No other groups found — be the first to create one, or ask a friend for their group name.
                </Text>
              ) : (
                discoverable.map((g) => (
                  <View key={g.id} style={styles.discoverRowWrap}>
                    <View style={styles.discoverRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.groupName}>{g.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.joinPromptButton}
                        onPress={() => handleRequestJoin(g)}
                        disabled={joinBusyId === g.id}
                      >
                        {joinBusyId === g.id ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.joinPromptButtonText}>Request to Join</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </>
          }
          renderItem={null}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

function GroupDetail({ group, onBack }) {
  const { darkMode } = useStudy();
  const { user } = useAuth();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteInput, setInviteInput] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await fetchGroupMembers(group.id);
    setMembers(data);
    setLoading(false);
  }, [group.id]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("group-detail-" + group.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, () => refresh())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refresh]);

  const sorted = [...(members || [])].sort((a, b) => (b.total_seconds || 0) - (a.total_seconds || 0));
  const topSeconds = Math.max(...sorted.map((m) => m.total_seconds || 0), 1);

  const handleInvite = async () => {
    setInviteMsg("");
    const targetUserId = inviteInput.trim();
    if (!targetUserId) return;
    const { success, error } = await inviteUserToGroup(group.id, targetUserId, user.id);
    if (error || !success) {
      setInviteMsg("Couldn't invite — check the user ID and try again.");
    } else {
      setInviteMsg("Invitation sent.");
      setInviteInput("");
    }
  };

  const handleLeave = async () => {
    const { error } = await supabase.rpc("leave_group", {
      p_group_id: group.id,
      p_user_id: user.id,
    });
    if (error) {
      Alert.alert("Couldn't leave group", error.message);
      return;
    }
    onBack();
  };

  const isOwner = group.owner_id === user.id;

const handleDelete = async () => {
  const confirmed = window.confirm(
    `Delete "${group.name}"?\n\nThis will permanently delete the group for everyone.`
  );

  if (!confirmed) return;

  const { data, error } = await supabase.rpc("delete_group", {
    p_group_id: group.id,
    p_user_id: user.id,
  });

  if (data) {
    alert("Group deleted.");
    onBack();
  } else {
    alert(error?.message || "Delete failed.");
  }
};
  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={onBack} style={styles.backRow}>
        <Text style={styles.backText}>‹ All groups</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{group.name}</Text>
      <Text style={styles.subtitle}>Live leaderboard for this group.</Text>

      <View style={styles.inviteRow2}>
        <TextInput
          style={styles.input}
          placeholder="Invite by user ID..."
          placeholderTextColor={theme.muted}
          value={inviteInput}
          onChangeText={setInviteInput}
          onSubmitEditing={handleInvite}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleInvite}>
          <Text style={styles.addButtonText}>Invite</Text>
        </TouchableOpacity>
      </View>
      {!!inviteMsg && <Text style={styles.inviteMsg}>{inviteMsg}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={theme.primary} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
          renderItem={({ item, index }) => {
            const isMe = item.id === user.id;
            const barPct = Math.max(6, Math.round((item.total_seconds / topSeconds) * 100));
            return (
              <View style={styles.row}>
                <Text style={styles.rank}>{index < 3 ? MEDALS[index] : index + 1}</Text>
                <View style={[styles.avatar, { backgroundColor: isMe ? theme.primary : theme.secondary }]}>
                  <Text style={styles.avatarText}>{item.display_name?.[0]?.toUpperCase() || "?"}</Text>
                </View>
                <View style={styles.nameCol}>
                  <Text style={styles.name}>{item.display_name}{isMe ? " (you)" : ""}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${barPct}%`, backgroundColor: isMe ? theme.primary : theme.secondary }]} />
                  </View>
                </View>
                <Text style={styles.hours}>{formatHours(item.total_seconds)}</Text>
              </View>
            );
          }}
        />
      )}

      {isOwner ? (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>🗑️ Delete group</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
          <Text style={styles.leaveButtonText}>Leave group</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: "800", color: theme.text, marginTop: 8 },
  subtitle: { color: theme.muted, marginTop: 4, marginBottom: 8, lineHeight: 18 },

  errorText: { color: theme.danger, marginTop: 8, fontWeight: "600", fontSize: 13 },

  actionRow: { flexDirection: "row", marginTop: 8 },
  actionButton: {
    flex: 1, backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 13, alignItems: "center",
  },
  actionButtonText: { color: "#fff", fontWeight: "700" },

  formCard: { backgroundColor: theme.cardBg, borderRadius: 16, padding: 14, marginTop: 12, ...cardShadow },
  formInput: { backgroundColor: theme.cardBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, color: theme.text },
  formSubmit: { backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  formSubmitText: { color: "#fff", fontWeight: "700" },

  sectionLabel: { fontWeight: "800", color: theme.text, fontSize: 15, marginTop: 18, marginBottom: 8 },
  empty: { color: theme.muted, marginTop: 4, lineHeight: 18 },

  inviteRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: theme.cardBg,
    borderRadius: 12, padding: 12, marginBottom: 8, ...cardShadow,
  },
  inviteName: { flex: 1, fontWeight: "700", color: theme.text },
  acceptButton: { backgroundColor: theme.primary, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, marginRight: 10 },
  acceptButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  declineText: { color: theme.muted, fontWeight: "600", fontSize: 13 },

  groupRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: theme.cardBg,
    borderRadius: 14, padding: 16, marginBottom: 8, ...cardShadow,
  },
  groupName: { fontWeight: "700", color: theme.text, fontSize: 15 },
  groupArrow: { color: theme.muted, fontSize: 18 },

  discoverRowWrap: { marginBottom: 8 },
  discoverRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: theme.cardBg,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.cardBorder,
  },
  discoverCreator: { color: theme.muted, fontSize: 12, marginTop: 2 },
  joinPromptRow: { flexDirection: "row", marginTop: 8 },
  joinPromptInput: {
    flex: 1, backgroundColor: theme.cardBg, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, marginRight: 8, color: theme.text,
  },
  joinPromptButton: { backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center" },
  joinPromptButtonText: { color: "#fff", fontWeight: "700" },

  backRow: { marginBottom: 4 },
  backText: { color: theme.primary, fontWeight: "700" },

  inviteRow2: { flexDirection: "row", marginTop: 8 },
  input: { flex: 1, backgroundColor: theme.cardBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginRight: 8, color: theme.text },
  addButton: { backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center" },
  addButtonText: { color: "#fff", fontWeight: "700" },
  inviteMsg: { color: theme.muted, marginTop: 6, fontSize: 13 },

  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: theme.cardBg,
    borderRadius: 14, padding: 12, marginBottom: 10, ...cardShadow,
  },
  rank: { width: 30, fontWeight: "800", color: theme.muted, fontSize: 15, textAlign: "center" },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 10 },
  avatarText: { color: "#fff", fontWeight: "700" },
  nameCol: { flex: 1, marginRight: 8 },
  name: { fontWeight: "700", color: theme.text, marginBottom: 5 },
  barTrack: { height: 6, backgroundColor: "rgba(242,87,141,0.12)", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  hours: { fontWeight: "800", color: theme.primary, fontSize: 14 },

  leaveButton: { alignItems: "center", paddingVertical: 12 },
  leaveButtonText: { color: theme.danger, fontWeight: "700" },
  deleteButton: {
    alignItems: "center", paddingVertical: 12, backgroundColor: "rgba(246,92,108,0.12)",
    borderRadius: 14, marginTop: 4,
  },
  deleteButtonText: { color: theme.danger, fontWeight: "800" },
});
}