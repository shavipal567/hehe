import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView,
} from "react-native";
import { useStudy } from "../context/StudyContext";

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
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Today's Plan</Text>
      <Text style={styles.subtitle}>Quick to-dos for today — plan it in 10 minutes.</Text>

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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F1FF", padding: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#2B2540", marginTop: 12 },
  subtitle: { color: "#8A83A6", marginTop: 4, marginBottom: 8 },
  inputRow: { flexDirection: "row", marginTop: 12 },
  input: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, marginRight: 8,
  },
  addButton: {
    backgroundColor: "#7C6CF6", borderRadius: 12, paddingHorizontal: 18, justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  empty: { color: "#8A83A6", textAlign: "center", marginTop: 40 },
  todoRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#7C6CF6",
    marginRight: 12, alignItems: "center", justifyContent: "center",
  },
  checkboxDone: { backgroundColor: "#7C6CF6" },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  todoText: { flex: 1, fontSize: 15, color: "#2B2540" },
  todoTextDone: { textDecorationLine: "line-through", color: "#B4AFC9" },
  remove: { color: "#B4AFC9", fontSize: 16, paddingHorizontal: 6 },
});
