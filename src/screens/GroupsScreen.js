import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, ActivityIndicator,
} from "react-native";
import { useStudy } from "../context/StudyContext";
import { supabase } from "../utils/supabase";
import SkyBackground from "../components/SkyBackground";
import { theme, cardShadow } from "../theme";

function formatHours(totalSeconds) {
  return `${(totalSeconds / 3600).toFixed(1)}h`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function GroupsScreen() {
  const { username, friends, addFriend, removeFriend, claimUsername, profile } = useStudy();

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        {!username ? (
          <ClaimUsernameCard claimUsername={claimUsername} displayName={profile.name} />
        ) : (
          <LiveLeaderboard
            username={username}
            friends={friends}
            addFriend={addFriend}
            removeFriend={removeFriend}
          />
        )}
      </SafeAreaView>
    </SkyBackground>
  );
}

function ClaimUsernameCard({ claimUsername, displayName }) {
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
          Pick a username once — your study time will sync live from here on,
          and friends can find you by this name.
        </Text>
        <TextInput
          style={styles.claimInput}
          placeholder="choose_a_username"
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

function LiveLeaderboard({ username, friends, addFriend, removeFriend }) {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [friendInput, setFriendInput] = useState("");
  const [addError, setAddError] = useState("");

  const allUsernames = [username, ...friends];

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .in("username", allUsernames);
    if (!error && data) setBoard(data);
    setLoading(false);
  }, [allUsernames.join(",")]);

  useEffect(() => {
    fetchProfiles();

    const channel = supabase
      .channel("public:profiles-" + username)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          setBoard((prev) => {
            if (!allUsernames.includes(row.username)) return prev;
            const others = prev.filter((p) => p.username !== row.username);
            return [...others, row];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfiles, username, friends.join(",")]);

  const sorted = [...board].sort((a, b) => b.total_seconds - a.total_seconds);
  const topSeconds = Math.max(...sorted.map((b) => b.total_seconds), 1);

  const handleAddFriend = async () => {
    setAddError("");
    const clean = friendInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!clean) return;
    if (clean === username) {
      setAddError("That's your own username 🙂");
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", clean)
      .maybeSingle();
    if (error || !data) {
      setAddError("No one's claimed that username yet.");
      return;
    }
    addFriend(clean);
    setFriendInput("");
  };

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>Study Group 🏆</Text>
      <Text style={styles.subtitle}>
        Live leaderboard — updates automatically as everyone studies. You're @{username}.
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a friend by username..."
          value={friendInput}
          onChangeText={setFriendInput}
          onSubmitEditing={handleAddFriend}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {!!addError && <Text style={styles.errorText}>{addError}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={theme.primary} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.username}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.empty}>Add a friend's username above to see them here.</Text>}
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
                {!isMe && (
                  <TouchableOpacity onPress={() => removeFriend(item.username)}>
                    <Text style={styles.remove}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "800", color: theme.text, marginTop: 8 },
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
    paddingVertical: 14, fontSize: 16, textAlign: "center",
  },
  claimButton: {
    width: "100%", backgroundColor: theme.primary, borderRadius: 16, paddingVertical: 16,
    alignItems: "center", marginTop: 16,
  },
  claimButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  errorText: { color: theme.danger, textAlign: "center", marginTop: 10, fontWeight: "600" },

  inputRow: { flexDirection: "row", marginTop: 8 },
  input: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, marginRight: 8,
  },
  addButton: {
    backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  empty: { color: theme.muted, textAlign: "center", marginTop: 20 },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: theme.cardBg,
    borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  rank: { width: 30, fontWeight: "800", color: theme.muted, fontSize: 15, textAlign: "center" },
  avatar: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  avatarText: { color: "#fff", fontWeight: "700" },
  nameCol: { flex: 1, marginRight: 8 },
  name: { fontWeight: "700", color: theme.text, marginBottom: 5 },
  barTrack: { height: 6, backgroundColor: "rgba(242,87,141,0.12)", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  hours: { fontWeight: "800", color: theme.primary, marginRight: 8, fontSize: 14 },
  remove: { color: theme.muted, fontSize: 16, paddingHorizontal: 2 },
});
