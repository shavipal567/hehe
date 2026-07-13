import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView,
} from "react-native";
import { useStudy } from "../context/StudyContext";
import SkyBackground from "../components/SkyBackground";
import { theme, cardShadow } from "../theme";

export default function PlannerScreen() {
  const { todos, addTodo, toggleTodo, removeTodo } = useStudy();
  const [text, setText] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const todaysTodos = todos.filter((t) => t.date === today);

  const handleAdd = () => {
    if (!text.trim()) return;
    addTodo(text.trim());
    setText("");
  };

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Today's Plan</Text>
        <Text style={styles.subtitle}>Quick to-dos for today — plan it in 10 minutes. 📝🌷</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a task..."
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={todaysTodos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Nothing planned yet — add your first task above.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.todoRow}>
              <TouchableOpacity
                style={[styles.checkbox, item.done && styles.checkboxDone]}
                onPress={() => toggleTodo(item.id)}
              >
                {item.done && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <Text style={[styles.todoText, item.done && styles.todoTextDone]}>
                {item.text}
              </Text>
              <TouchableOpacity onPress={() => removeTodo(item.id)}>
                <Text style={styles.remove}>✕</Text>
              </TouchableOpacity>
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
  subtitle: { color: theme.muted, marginTop: 4, marginBottom: 8 },
  inputRow: { flexDirection: "row", marginTop: 12 },
  input: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, marginRight: 8,
  },
  addButton: {
    backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 18, justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  empty: { color: theme.muted, textAlign: "center", marginTop: 40 },
  todoRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: theme.cardBg,
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.cardBorder, ...cardShadow,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.primary,
    marginRight: 12, alignItems: "center", justifyContent: "center",
  },
  checkboxDone: { backgroundColor: theme.primary },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  todoText: { flex: 1, fontSize: 15, color: theme.text },
  todoTextDone: { textDecorationLine: "line-through", color: theme.muted },
  remove: { color: theme.muted, fontSize: 16, paddingHorizontal: 6 },
});
