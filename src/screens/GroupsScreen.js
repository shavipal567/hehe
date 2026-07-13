import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView,
} from "react-native";
import { useStudy } from "../context/StudyContext";
import SkyBackground from "../components/SkyBackground";
import { theme, SUBJECT_PALETTE, cardShadow } from "../theme";

function formatHours(totalSeconds) {
  const hrs = totalSeconds / 3600;
  return `${hrs.toFixed(1)}h`;
}

export default function GroupsScreen() {
  const { groupMembers, addGroupMember, removeGroupMember, sessions, profile } = useStudy();
  const [name, setName] = useState("");

  const mySeconds = sessions.reduce((sum, s) => sum + s.seconds, 0);

  const board = [
    { id: "me", name: profile.name || "Me", color: theme.primary, totalSeconds: mySeconds, isMe: true },
    ...groupMembers,
  ].sort((a, b) => b.totalSeconds - a.totalSeconds);

  const handleAdd = () => {
    if (!name.trim()) return;
    const color = SUBJECT_PALETTE[groupMembers.length % SUBJECT_PALETTE.length];
    addGroupMember(name.trim(), color);
    setName("");
  };

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Study Group</Text>
        <Text style={styles.subtitle}>
          Ranked by total study time. Add friends here and log their time manually to compare. 👯‍♀️✨
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a friend's name..."
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={board}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={[styles.avatar, { backgroundColor: item.color }]}>
                <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
              </View>
              <Text style={styles.name}>{item.name}{item.isMe ? " (you)" : ""}</Text>
              <Text style={styles.hours}>{formatHours(item.totalSeconds)}</Text>
              {!item.isMe && (
                <TouchableOpacity onPress={() => removeGroupMember(item.id)}>
                  <Text style={styles.remove}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: "800", color: theme.text, marginTop: 8 },
  subtitle: { color: theme.muted, marginTop: 4, marginBottom: 8, lineHeight: 18 },
  inputRow: { flexDirection: "row", marginTop: 8 },
  input: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, marginRight: 8,
  },
  addButton: {
    backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: theme.cardBg,
    borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  rank: { width: 24, fontWeight: "700", color: theme.muted },
  avatar: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    marginRight: 10,
  },
  avatarText: { color: "#fff", fontWeight: "700" },
  name: { flex: 1, fontWeight: "600", color: theme.text },
  hours: { fontWeight: "700", color: theme.primary, marginRight: 10 },
  remove: { color: theme.muted, fontSize: 16, paddingHorizontal: 4 },
});
