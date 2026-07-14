import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from "react-native";
import { useStudy } from "../context/StudyContext";
import SkyBackground from "../components/SkyBackground";
import { theme, cardShadow } from "../theme";

export default function NotesScreen() {
  const { notes, addNote, updateNote, removeNote } = useStudy();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const handleAdd = () => {
    if (!draft.trim()) return;
    addNote(draft.trim());
    setDraft("");
  };

  const startEdit = (note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const saveEdit = () => {
    if (editingId) updateNote(editingId, editText);
    setEditingId(null);
    setEditText("");
  };

  return (
    <SkyBackground>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Sticky Notes 📌</Text>
        <Text style={styles.subtitle}>Quick reminders, stuck right where you'll see them.</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Write a quick note..."
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={handleAdd}
            multiline
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Stick it</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.board}>
          {notes.length === 0 ? (
            <Text style={styles.empty}>No sticky notes yet — add your first one above. 🌸</Text>
          ) : (
            notes.map((note) => (
              <View
                key={note.id}
                style={[
                  styles.note,
                  { backgroundColor: note.color, transform: [{ rotate: `${note.rotation}deg` }] },
                ]}
              >
                {editingId === note.id ? (
                  <TextInput
                    style={styles.noteInput}
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    autoFocus
                    onBlur={saveEdit}
                    onSubmitEditing={saveEdit}
                  />
                ) : (
                  <TouchableOpacity onPress={() => startEdit(note)}>
                    <Text style={styles.noteText}>{note.text}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.removeButton} onPress={() => removeNote(note.id)}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </SkyBackground>
  );
}

const NOTE_SIZE = "46%";

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 26, fontWeight: "800", color: theme.text, marginTop: 8 },
  subtitle: { color: theme.muted, marginTop: 4, marginBottom: 12 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12 },
  input: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 12, marginRight: 8, minHeight: 46, maxHeight: 90,
  },
  addButton: {
    backgroundColor: theme.primary, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  addButtonText: { color: "#fff", fontWeight: "700" },
  board: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingBottom: 40,
  },
  empty: { color: theme.muted, textAlign: "center", width: "100%", marginTop: 30 },
  note: {
    width: NOTE_SIZE,
    minHeight: 120,
    borderRadius: 6,
    padding: 14,
    marginBottom: 18,
    ...cardShadow,
  },
  noteText: { color: "#3A2E45", fontSize: 15, lineHeight: 20, fontWeight: "600" },
  noteInput: { color: "#3A2E45", fontSize: 15, lineHeight: 20, fontWeight: "600", minHeight: 60 },
  removeButton: { position: "absolute", top: 6, right: 8 },
  removeText: { color: "rgba(58,46,69,0.45)", fontSize: 14, fontWeight: "700" },
});
