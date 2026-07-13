import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView,
} from "react-native";
import { useStudy } from "../context/StudyContext";

const COLORS = ["#7C6CF6", "#5AC8FA", "#4CD787", "#F6B93C", "#F65C6C", "#9B5DE5"];

export default function SubjectsScreen() {
  const { subjects, addSubject, removeSubject, profile, setProfile } = useStudy();
  const [name, setName] = useState("");
  const [colorIndex, setColorIndex] = useState(0);

  const handleAdd = () => {
    if (!name.trim()) return;
    addSubject(name.trim(), COLORS[colorIndex % COLORS.length]);
    setName("");
    setColorIndex((c) => c + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Subjects & Profile</Text>

      <Text style={styles.label}>Your name</Text>
      <TextInput
        style={styles.input}
        value={profile.name}
        onChangeText={(v) => setProfile({ ...profile, name: v })}
        placeholder="Your name"
      />

      <Text style={[styles.label, { marginTop: 20 }]}>Subjects</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          placeholder="New subject name..."
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity onPress={() => removeSubject(item.id)}>
              <Text style={styles.remove}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F1FF", padding: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#2B2540", marginTop: 12, marginBottom: 12 },
  label: { color: "#8A83A6", fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  inputRow: { flexDirection: "row" },
  addButton: {
    backgroundColor: "#7C6CF6", borderRadius: 12, paddingHorizontal: 18, justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  name: { flex: 1, fontWeight: "600", color: "#2B2540" },
  remove: { color: "#B4AFC9", fontSize: 16, paddingHorizontal: 4 },
});
