import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView,
} from "react-native";
import { useStudy } from "../context/StudyContext";

const PALETTE = ["#F2578D", "#5AC8FA", "#4CD787", "#F6B93C", "#F65C6C"];

function formatHours(totalSeconds) {
  const hrs = totalSeconds / 3600;
  return `${hrs.toFixed(1)}h`;
}

export default function GroupsScreen() {
  const { groupMembers, addGroupMember, removeGroupMember, sessions, profile } = useStudy();
  const [name, setName] = useState("");

  const mySeconds = sessions.reduce((sum, s) => sum + s.seconds, 0);

  const board = [
    { id: "me", name: profile.name || "Me", color: "#F2578D", totalSeconds: mySeconds, isMe: true },
    ...groupMembers,
  ].sort((a, b) => b.totalSeconds - a.totalSeconds);

  const handleAdd = () => {
    if (!name.trim()) return;
    const color = PALETTE[groupMembers.length % PALETTE.length];
    addGroupMember(name.trim(), color);
    setName("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Study Group</Text>
      <Text style={styles.subtitle}>
        Ranked by total study time. This build stores everything on-device, so
        add friends here and log their time manually to compare.
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF0F6", padding: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#2B2540", marginTop: 12 },
  subtitle: { color: "#B27F92", marginTop: 4, marginBottom: 8, lineHeight: 18 },
  inputRow: { flexDirection: "row", marginTop: 8 },
  input: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, marginRight: 8,
  },
  addButton: {
    backgroundColor: "#F2578D", borderRadius: 12, paddingHorizontal: 18, justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 14, padding: 12, marginBottom: 10,
  },
  rank: { width: 24, fontWeight: "700", color: "#B27F92" },
  avatar: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    marginRight: 10,
  },
  avatarText: { color: "#fff", fontWeight: "700" },
  name: { flex: 1, fontWeight: "600", color: "#2B2540" },
  hours: { fontWeight: "700", color: "#F2578D", marginRight: 10 },
  remove: { color: "#C98CA5", fontSize: 16, paddingHorizontal: 4 },
});
