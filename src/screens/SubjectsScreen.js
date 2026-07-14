import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, ScrollView,
} from "react-native";
import { useStudy } from "../context/StudyContext";
import SkyBackground from "../components/SkyBackground";
import { theme, SUBJECT_PALETTE, cardShadow } from "../theme";

export default function SubjectsScreen() {
  const { subjects, addSubject, removeSubject, profile, setProfile, pomodoroSettings, setPomodoroSettings } = useStudy();
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    addSubject(name.trim());
    setName("");
  };

  const adjustPomo = (key, delta) => {
    setPomodoroSettings((p) => ({ ...p, [key]: Math.max(1, p[key] + delta) }));
  };

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView>
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

          {subjects.length === 0 ? (
            <Text style={styles.empty}>No subjects yet — add your first one above. 🌷</Text>
          ) : (
            subjects.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={[styles.dot, { backgroundColor: item.color }]} />
                <Text style={styles.name}>{item.name}</Text>
                <TouchableOpacity onPress={() => removeSubject(item.id)}>
                  <Text style={styles.remove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <Text style={[styles.label, { marginTop: 24 }]}>🍅 Pomodoro lengths</Text>
          <View style={styles.pomoRow}>
            <View style={styles.pomoBox}>
              <Text style={styles.pomoBoxLabel}>Focus</Text>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperButton} onPress={() => adjustPomo("workMinutes", -5)}>
                  <Text style={styles.stepperText}>–</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{pomodoroSettings.workMinutes}m</Text>
                <TouchableOpacity style={styles.stepperButton} onPress={() => adjustPomo("workMinutes", 5)}>
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.pomoBox}>
              <Text style={styles.pomoBoxLabel}>Break</Text>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperButton} onPress={() => adjustPomo("breakMinutes", -1)}>
                  <Text style={styles.stepperText}>–</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{pomodoroSettings.breakMinutes}m</Text>
                <TouchableOpacity style={styles.stepperButton} onPress={() => adjustPomo("breakMinutes", 1)}>
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "800", color: theme.text, marginTop: 8, marginBottom: 12 },
  label: { color: theme.muted, fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  inputRow: { flexDirection: "row" },
  addButton: {
    backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  empty: { color: theme.muted, textAlign: "center", marginTop: 12 },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: theme.cardBg,
    borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: theme.cardBorder,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  name: { flex: 1, fontWeight: "600", color: theme.text },
  remove: { color: theme.muted, fontSize: 16, paddingHorizontal: 4 },
  pomoRow: { flexDirection: "row", gap: 12 },
  pomoBox: {
    flex: 1, backgroundColor: theme.cardBg, borderRadius: 16, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  pomoBoxLabel: { color: theme.muted, fontWeight: "600", marginBottom: 8 },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepperButton: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: theme.primary,
    alignItems: "center", justifyContent: "center",
  },
  stepperText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  stepperValue: { marginHorizontal: 14, fontWeight: "700", color: theme.text, fontSize: 16 },
});
