import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from "react-native";
import { useStudy } from "../context/StudyContext";
import { supabase } from "../utils/supabase";
import {
  createGroup, joinGroupWithPasskey, fetchAllGroups, inviteToGroup,
  acceptInvite, declineInvite, leaveGroup, deleteGroup, fetchMyGroups, fetchGroupMembers,
} from "../utils/groups";
import SkyBackground from "../components/SkyBackground";
import { getTheme, cardShadow } from "../theme";

const MEDALS = ["🥇", "🥈", "🥉"];

function formatHours(totalSeconds) {
  return `${(totalSeconds / 3600).toFixed(1)}h`;
}

export default function GroupsScreen() {
  const { username, claimUsername, profile, darkMode } = useStudy();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);
  const [selectedGroup, setSelectedGroup] = useState(null);

  if (!username) {
    return (
      <SkyBackground>
        <SafeAreaView style={styles.container}>
          <ClaimUsernameCard claimUsername={claimUsername} displayName={profile.name} />
        </SafeAreaView>
      </SkyBackground>
    );
  }

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        {selectedGroup ? (
          <GroupDetail
            group={selectedGroup}
            username={username}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <GroupsList username={username} onOpenGroup={setSelectedGroup} />
        )}
      </SafeAreaView>
    </SkyBackground>
  );
}

function ClaimUsernameCard({ claimUsername, displayName }) {
  const { darkMode } = useStudy();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    setError("");
    setBusy(true);
    const { error: err } = await claimUsername(value, displayName);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <View style={styles.centerWrap}>
      <View style={styles.claimCard}>
        <Text style={styles.claimEmoji}>👯‍♀️✨</Text>
        <Text style={styles.claimTitle}>Join the Study Group</Text>
        <Text style={styles.claimSubtitle}>
          Pick a username once — you'll use this to create or join groups.
        </Text>
        <TextInput
          style={styles.claimInput}
          placeholder="choose_a_username"
          placeholderTextColor={theme.muted}
          value={value}
          onChangeText={setValue}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity style={styles.claimButton} onPress={handleSave} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.claimButtonText}>Save username</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GroupsList({ username, onOpenGroup }) {
  const { darkMode } = useStudy();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);

  const [groups, setGroups] = useState([]);
  const [pendingGroups, setPendingGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createPasskey, setCreatePasskey] = useState("");
  const [createError, setCreateError] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  const [joiningGroup, setJoiningGroup] = useState(null);
  const [joinPasskeyInput, setJoinPasskeyInput] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ groups: g, pendingGroups: p }, { data: all }] = await Promise.all([
      fetchMyGroups(username),
      fetchAllGroups(),
    ]);
    setGroups(g);
    setPendingGroups(p);
    setAllGroups(all);
    setLoading(false);
  }, [username]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("group-members-" + username)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "groups" }, () => refresh())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [refresh]);

  const myGroupIds = new Set([...groups, ...pendingGroups].map((g) => g.id));
  const discoverable = allGroups.filter((g) => !myGroupIds.has(g.id));

  const handleCreate = async () => {
    setCreateError("");
    if (!createName.trim() || !createPasskey.trim()) {
      setCreateError("Enter a group name and a passkey.");
      return;
    }
    setCreateBusy(true);
    const { id, error } = await createGroup(createName.trim(), createPasskey.trim(), username);
    setCreateBusy(false);
    if (error) {
      setCreateError(error.includes("duplicate") || error.includes("unique") ? "That group name is taken — try another." : error);
      return;
    }
    setCreateName("");
    setCreatePasskey("");
    setShowCreate(false);
    refresh();
  };

  const openJoinPrompt = (group) => {
    setJoiningGroup(joiningGroup?.id === group.id ? null : group);
    setJoinPasskeyInput("");
    setJoinError("");
  };

  const handleJoin = async () => {
    if (!joiningGroup) return;
    setJoinError("");
    if (!joinPasskeyInput.trim()) {
      setJoinError("Enter the passkey.");
      return;
    }
    setJoinBusy(true);
    const { success, error } = await joinGroupWithPasskey(joiningGroup.id, joinPasskeyInput.trim(), username);
    setJoinBusy(false);
    if (error) {
      setJoinError(error);
      return;
    }
    if (!success) {
      setJoinError("Wrong passkey for that group.");
      return;
    }
    setJoiningGroup(null);
    setJoinPasskeyInput("");
    refresh();
  };

  const handleAccept = async (groupId) => {
    await acceptInvite(groupId, username);
    refresh();
  };

  const handleDecline = async (groupId) => {
    await declineInvite(groupId, username);
    refresh();
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>Study Groups 🏆</Text>
      <Text style={styles.subtitle}>You're @{username}.</Text>

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
          <TextInput
            style={styles.formInput} placeholder="Set a passkey" placeholderTextColor={theme.muted}
            value={createPasskey} onChangeText={setCreatePasskey} secureTextEntry
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
              {pendingGroups.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.sectionLabel}>Invitations</Text>
                  {pendingGroups.map((g) => (
                    <View key={g.id} style={styles.inviteRow}>
                      <Text style={styles.inviteName}>{g.name}</Text>
                      <TouchableOpacity onPress={() => handleAccept(g.id)} style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDecline(g.id)}>
                        <Text style={styles.declineText}>Decline</Text>
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
              {discoverable.length === 0 ? (
                <Text style={styles.empty}>
                  No other groups exist yet — be the first to create one, or ask a friend for their group name.
                </Text>
              ) : (
                discoverable.map((g) => (
                  <View key={g.id} style={styles.discoverRowWrap}>
                    <TouchableOpacity style={styles.discoverRow} onPress={() => openJoinPrompt(g)}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.groupName}>{g.name}</Text>
                        <Text style={styles.discoverCreator}>by @{g.created_by}</Text>
                      </View>
                      <Text style={styles.groupArrow}>{joiningGroup?.id === g.id ? "︿" : "＋"}</Text>
                    </TouchableOpacity>

                    {joiningGroup?.id === g.id && (
                      <View style={styles.joinPromptRow}>
                        <TextInput
                          style={styles.joinPromptInput}
                          placeholder="Enter passkey to join..."
                          placeholderTextColor={theme.muted}
                          value={joinPasskeyInput}
                          onChangeText={setJoinPasskeyInput}
                          secureTextEntry
                          autoFocus
                        />
                        <TouchableOpacity style={styles.joinPromptButton} onPress={handleJoin} disabled={joinBusy}>
                          {joinBusy ? <ActivityIndicator color="#fff" /> : <Text style={styles.joinPromptButtonText}>Join</Text>}
                        </TouchableOpacity>
                      </View>
                    )}
                    {joiningGroup?.id === g.id && !!joinError && (
                      <Text style={styles.errorText}>{joinError}</Text>
                    )}
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

function GroupDetail({ group, username, onBack }) {
  const { darkMode } = useStudy();
  const theme = getTheme(darkMode);
  const styles = makeStyles(theme, darkMode);

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

  const sorted = [...members].sort((a, b) => b.total_seconds - a.total_seconds);
  const topSeconds = Math.max(...sorted.map((m) => m.total_seconds), 1);

  const handleInvite = async () => {
    setInviteMsg("");
    const clean = inviteInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!clean) return;
    const { error } = await inviteToGroup(group.id, clean, username);
    if (error) {
      setInviteMsg("Couldn't invite — check the username exists.");
    } else {
      setInviteMsg(`Invited @${clean}.`);
      setInviteInput("");
    }
  };

  const handleLeave = async () => {
    await leaveGroup(group.id, username);
    onBack();
  };

  const isOwner = group.created_by === username;

  const handleDelete = () => {
    Alert.alert(
      "Delete this group?",
      `"${group.name}" will be deleted for everyone, including all members. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { success, error } = await deleteGroup(group.id, username);
            if (success) onBack();
            else Alert.alert("Couldn't delete group", error || "Please try again.");
          },
        },
      ]
    );
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
          placeholder="Invite by username..."
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
          keyExtractor={(item) => item.username}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
          renderItem={({ item, index }) => {
            const isMe = item.username === username;
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

function makeStyles(theme, darkMode) {
  return StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: "800", color: theme.text, marginTop: 8 },
  subtitle: { color: theme.muted, marginTop: 4, marginBottom: 8, lineHeight: 18 },

  centerWrap: { flex: 1, justifyContent: "center" },
  claimCard: {
    backgroundColor: theme.cardBg, borderRadius: 28, padding: 28, alignItems: "center",
    borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  claimEmoji: { fontSize: 30, marginBottom: 8 },
  claimTitle: { fontSize: 22, fontWeight: "800", color: theme.text, textAlign: "center" },
  claimSubtitle: { color: theme.muted, textAlign: "center", marginTop: 8, marginBottom: 18, lineHeight: 20 },
  claimInput: {
    width: "100%", backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 16, textAlign: "center", color: "#3A2E45",
  },
  claimButton: {
    width: "100%", backgroundColor: theme.primary, borderRadius: 16, paddingVertical: 16,
    alignItems: "center", marginTop: 16,
  },
  claimButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  errorText: { color: theme.danger, marginTop: 8, fontWeight: "600", fontSize: 13 },

  actionRow: { flexDirection: "row", marginTop: 8 },
  actionButton: {
    flex: 1, backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 13, alignItems: "center",
  },
  actionButtonText: { color: "#fff", fontWeight: "700" },

  formCard: { backgroundColor: theme.cardBg, borderRadius: 16, padding: 14, marginTop: 12, ...cardShadow },
  formInput: { backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8, color: "#3A2E45" },
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
    flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, marginRight: 8, color: "#3A2E45",
  },
  joinPromptButton: { backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center" },
  joinPromptButtonText: { color: "#fff", fontWeight: "700" },

  backRow: { marginBottom: 4 },
  backText: { color: theme.primary, fontWeight: "700" },

  inviteRow2: { flexDirection: "row", marginTop: 8 },
  input: { flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginRight: 8, color: "#3A2E45" },
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
